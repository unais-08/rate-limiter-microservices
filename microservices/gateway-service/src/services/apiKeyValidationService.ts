import redisClient from "../utils/redisClient.js";
import Logger from "../utils/logger.js";
import config from "../config/gatewayService.config.js";
import type { ApiKeyVerification } from "../types/index.js";
import axios from "axios";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * API Key Validation Service
 * Validates API keys with Redis cache + PostgreSQL fallback
 * Flow: Check Redis → Call Admin Service (queries PostgreSQL) → Cache result
 */
class ApiKeyValidationService {
  private readonly NEGATIVE_CACHE_TTL = 300; // 5 minutes for invalid keys
  private readonly POSITIVE_CACHE_TTL = 900; // 15 minutes for valid keys
  private readonly ADMIN_SERVICE_URL =
    process.env.ADMIN_SERVICE_URL || "http://localhost:3004";

  /**
   * Validate API key with Redis cache + PostgreSQL fallback
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyVerification> {
    try {
      const redis = redisClient.getClient();

      // Step 1: Check Redis cache first
      const exists = await redis.sIsMember("apikeys:all", apiKey);

      if (exists) {
        // Key found in Redis - fetch metadata
        const metadata = await redis.hGetAll(`apikey:${apiKey}:metadata`);

        if (metadata && Object.keys(metadata).length > 0) {
          // Check if key is enabled
          if (metadata.enabled === "false") {
            logger.warn("API key is disabled", {
              apiKey: apiKey.substring(0, 8) + "***",
            });
            throw new Error("API key is disabled");
          }

          // Update last used timestamp (async)
          this.updateLastUsed(apiKey).catch((err) => {
            logger.warn("Failed to update lastUsed", { error: err.message });
          });

          logger.debug("API key validated from Redis cache", {
            apiKey: apiKey.substring(0, 8) + "***",
            tier: metadata.tier,
          });

          return {
            valid: true,
            userId: metadata.userId || apiKey.split("_")[1] || "unknown",
            tier: metadata.tier || "free",
            permissions: ["*"],
            metadata: {
              name: metadata.name,
              tokensPerWindow: parseInt(metadata.tokensPerWindow || "100", 10),
              refillRate: parseInt(metadata.refillRate || "10", 10),
              maxBurst: parseInt(metadata.maxBurst || "100", 10),
            },
          };
        }
      }

      // Step 2: Redis cache miss - fallback to Admin Service (queries PostgreSQL)
      logger.info("Redis cache miss, querying Admin Service", {
        apiKey: apiKey.substring(0, 8) + "***",
      });

      const adminResponse = await this.validateWithAdminService(apiKey);

      if (!adminResponse.valid) {
        // Cache negative result
        await this.cacheNegativeResult(apiKey);
        throw new Error("Invalid API key");
      }

      // Step 3: Admin Service returned valid key - cache it in Redis
      await this.cacheValidKey(apiKey, adminResponse.metadata);

      logger.info("API key validated from PostgreSQL and cached", {
        apiKey: apiKey.substring(0, 8) + "***",
        tier: adminResponse.metadata.tier,
      });

      return {
        valid: true,
        userId:
          adminResponse.metadata.userId || apiKey.split("_")[1] || "unknown",
        tier: adminResponse.metadata.tier || "free",
        permissions: ["*"],
        metadata: {
          name: adminResponse.metadata.name,
          tokensPerWindow: adminResponse.metadata.tokensPerWindow,
          refillRate: adminResponse.metadata.refillRate,
          maxBurst: adminResponse.metadata.maxBurst,
        },
      };
    } catch (error) {
      logger.error("API key validation failed", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        valid: false,
        userId: "unknown",
        tier: "none",
        permissions: [],
      };
    }
  }

  /**
   * Call Admin Service to validate API key (queries PostgreSQL)
   */
  private async validateWithAdminService(
    apiKey: string,
  ): Promise<{ valid: boolean; metadata: any }> {
    try {
      const response = await axios.post(
        `${this.ADMIN_SERVICE_URL}/api/v1/internal/validate/${apiKey}`,
        {},
        {
          timeout: 5000, // 5 second timeout
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      logger.debug("Admin Service validation response received", {
        apiKey: apiKey.substring(0, 8) + "***",
        status: response.status,
      });
      if (response.data.success && response.data.valid) {
        return {
          valid: true,
          metadata: response.data.metadata,
        };
      }

      return { valid: false, metadata: null };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.debug("API key not found in Admin Service", {
            apiKey: apiKey.substring(0, 8) + "***",
          });
          return { valid: false, metadata: null };
        }

        logger.error("Admin Service validation request failed", {
          status: error.response?.status,
          message: error.message,
        });
      }

      // On Admin Service failure, fail closed (reject request)
      throw new Error("Unable to validate API key - Admin Service unavailable");
    }
  }

  /**
   * Cache valid API key in Redis
   */
  private async cacheValidKey(apiKey: string, metadata: any): Promise<void> {
    try {
      const redis = redisClient.getClient();

      // Store metadata
      const cacheData = {
        name: String(metadata.name || "Unknown"),
        userId: String(metadata.userId || ""),
        tier: String(metadata.tier || "free"),
        tokensPerWindow: String(metadata.tokensPerWindow || 100),
        refillRate: String(metadata.refillRate || 10),
        maxBurst: String(metadata.maxBurst || 100),
        enabled: String(metadata.enabled !== false),
        createdAt: new Date().toISOString(),
        lastUsed: "null",
      };

      await redis.hSet(`apikey:${apiKey}:metadata`, cacheData);
      await redis.expire(`apikey:${apiKey}:metadata`, this.POSITIVE_CACHE_TTL);

      // Initialize token bucket
      await redis.set(
        `apikey:${apiKey}:tokens`,
        metadata.tokensPerWindow || 100,
      );
      await redis.set(`apikey:${apiKey}:lastRefill`, Date.now());

      // Add to master set
      await redis.sAdd("apikeys:all", apiKey);

      logger.debug("Cached valid API key from PostgreSQL", {
        apiKey: apiKey.substring(0, 8) + "***",
        ttl: this.POSITIVE_CACHE_TTL,
      });
    } catch (error) {
      logger.error("Failed to cache valid API key", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if key is in negative cache (invalid keys)
   */
  async isInNegativeCache(apiKey: string): Promise<boolean> {
    try {
      const redis = redisClient.getClient();
      const cached = await redis.get(`gateway:invalid:${apiKey}`);
      return cached === "1";
    } catch (error) {
      return false;
    }
  }

  /**
   * Cache negative result (invalid key)
   */
  private async cacheNegativeResult(apiKey: string): Promise<void> {
    try {
      const redis = redisClient.getClient();
      await redis.setEx(
        `gateway:invalid:${apiKey}`,
        this.NEGATIVE_CACHE_TTL,
        "1",
      );
    } catch (error) {
      // Non-critical, just log
      logger.debug("Failed to cache negative result", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update last used timestamp for API key
   */
  private async updateLastUsed(apiKey: string): Promise<void> {
    try {
      const redis = redisClient.getClient();
      await redis.hSet(`apikey:${apiKey}:metadata`, {
        lastUsed: new Date().toISOString(),
      });
    } catch (error) {
      // Non-critical operation
      logger.debug("Failed to update lastUsed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Clear cached validation for a key (called when admin updates key)
   */
  async invalidateCache(apiKey: string): Promise<void> {
    try {
      const redis = redisClient.getClient();
      await redis.del(`gateway:invalid:${apiKey}`);

      logger.info("Cache invalidated for API key", {
        apiKey: apiKey.substring(0, 8) + "***",
      });
    } catch (error) {
      logger.error("Failed to invalidate cache", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get key statistics
   */
  async getKeyStats(apiKey: string): Promise<{
    exists: boolean;
    metadata?: Record<string, string>;
    tokens?: number;
  }> {
    try {
      const redis = redisClient.getClient();

      const exists = await redis.sIsMember("apikeys:all", apiKey);
      if (!exists) {
        return { exists: false };
      }

      const metadata = await redis.hGetAll(`apikey:${apiKey}:metadata`);
      const tokens = await redis.get(`apikey:${apiKey}:tokens`);

      return {
        exists: true,
        metadata,
        tokens: tokens ? parseFloat(tokens) : undefined,
      };
    } catch (error) {
      logger.error("Failed to get key stats", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { exists: false };
    }
  }
}

export default new ApiKeyValidationService();
