import redisClient from "../utils/redisClient.js";
import config from "../config/rateLimit.config.js";
import Logger from "../utils/logger.js";
import { luaScript } from "../utils/luaScript.js";
import type {
  RateLimitResult,
  RateLimitStatus,
  CustomLimitResult,
  LuaScriptResult,
  ApiKeyMetadata,
  TokenBucket,
} from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Token Bucket Rate Limiter Service (ATOMIC VERSION)
 *
 * Uses Redis Lua scripts for atomic operations to prevent race conditions
 * when multiple requests arrive simultaneously.
 */
class TokenBucketService {
  private readonly defaultTokens: number;
  private readonly refillRate: number;
  private readonly maxBurst: number;
  private readonly bucketTTL: number;
  private readonly failOpen: boolean;

  constructor() {
    this.defaultTokens = config.rateLimit.defaultTokens;
    this.refillRate = config.rateLimit.refillRate;
    this.maxBurst = config.rateLimit.maxBurst;
    this.bucketTTL = config.rateLimit.bucketTTL || 3600; // TTL in seconds
    this.failOpen = config.rateLimit?.failOpen ?? true; // Fail open by default
  }

  /**
   * Get Redis key for an API key's token bucket
   */
  private _getBucketKey(apiKey: string): string {
    return `ratelimit:bucket:${apiKey}`;
  }

  /**
   * Get Redis key for an API key's metadata
   */
  private _getMetadataKey(apiKey: string): string {
    return `apikey:${apiKey}:metadata`;
  }

  /**
   * Check if request is allowed and consume a token (ATOMIC)
   *
   * @param apiKey - The API key to check
   * @param tokens - Number of tokens to consume (default: 1)
   * @returns Rate limit result with allowed status and metadata
   */
  async checkLimit(
    apiKey: string,
    tokens: number = 1,
  ): Promise<RateLimitResult> {
    try {
      const client = redisClient.getClient();
      const bucketKey = this._getBucketKey(apiKey);
      const metadataKey = this._getMetadataKey(apiKey);
      const now = Date.now();

      // Execute Lua script atomically
      const result = (await client.eval(luaScript, {
        keys: [bucketKey, metadataKey],
        arguments: [
          now.toString(),
          tokens.toString(),
          this.maxBurst.toString(),
          this.refillRate.toString(),
          this.defaultTokens.toString(),
          this.bucketTTL.toString(),
        ],
      })) as LuaScriptResult;

      logger.debug("Lua script executed", {
        allowed: result[0],
        remainingTokens: result[1],
        refillRate: result[2],
        capacity: result[3],
      });

      const allowed = result[0] === 1;
      const remaining = result[1];
      const actualRefillRate = result[2];
      const actualCapacity = result[3];

      if (allowed) {
        logger.debug("Request allowed", {
          apiKey: apiKey.substring(0, 8) + "***",
          tokensConsumed: tokens,
          tokensRemaining: remaining,
        });
      } else {
        logger.warn("Request blocked - rate limit exceeded", {
          apiKey: apiKey.substring(0, 8) + "***",
          tokensNeeded: tokens,
          tokensAvailable: remaining,
        });
      }

      // Calculate when enough tokens will be available (in milliseconds)
      const tokensNeeded = allowed ? 0 : tokens - remaining;
      const resetInMs = Math.ceil((tokensNeeded / actualRefillRate) * 1000);

      return {
        allowed,
        remaining: Math.max(0, remaining),
        resetIn: resetInMs, // Now correctly in milliseconds
        limit: actualCapacity,
        requestedTokens: tokens,
      };
    } catch (error) {
      logger.error("Error checking rate limit", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Use configurable fail-open/fail-closed behavior
      return {
        allowed: this.failOpen,
        remaining: 0,
        resetIn: 0,
        limit: this.maxBurst,
        error: "Rate limiter unavailable",
      };
    }
  }

  /**
   * Get current bucket status without consuming tokens
   */
  async getStatus(apiKey: string): Promise<RateLimitStatus> {
    try {
      const client = redisClient.getClient();
      const bucketKey = this._getBucketKey(apiKey);
      const metadataKey = this._getMetadataKey(apiKey);
      const now = Date.now();

      // Fetch metadata
      let capacity = this.maxBurst;
      let refillRate = this.refillRate;
      let defaultTokens = this.defaultTokens;

      try {
        const metadata = (await client.hGetAll(metadataKey)) as ApiKeyMetadata;

        if (metadata && Object.keys(metadata).length > 0) {
          if (metadata.maxBurst) {
            const val = parseInt(metadata.maxBurst, 10);
            if (!isNaN(val) && val > 0 && val <= 1000000) {
              capacity = val;
            }
          }
          if (metadata.refillRate) {
            const val = parseInt(metadata.refillRate, 10);
            if (!isNaN(val) && val > 0 && val <= 100000) {
              refillRate = val;
            }
          }
          if (metadata.tokensPerWindow) {
            const val = parseInt(metadata.tokensPerWindow, 10);
            if (!isNaN(val) && val > 0 && val <= 1000000) {
              defaultTokens = val;
            }
          }
        }
      } catch (err) {
        logger.warn("Failed to fetch API key metadata, using defaults", {
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }

      const bucketData = await client.get(bucketKey);

      if (!bucketData) {
        return {
          tokens: defaultTokens,
          capacity: capacity,
          refillRate: refillRate,
        };
      }

      const bucket = JSON.parse(bucketData) as TokenBucket;

      // Calculate refilled tokens
      const timePassed = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = Math.floor(timePassed * refillRate);
      const currentTokens = Math.min(capacity, bucket.tokens + tokensToAdd);

      return {
        tokens: currentTokens,
        capacity: capacity,
        refillRate: refillRate,
        lastRefill: bucket.lastRefill,
      };
    } catch (error) {
      logger.error("Error getting bucket status", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Reset bucket for an API key (admin function)
   */
  async resetBucket(apiKey: string): Promise<CustomLimitResult> {
    try {
      const client = redisClient.getClient();
      const key = this._getBucketKey(apiKey);

      await client.del(key);

      logger.info("Token bucket reset", {
        apiKey: apiKey.substring(0, 8) + "***",
      });

      return {
        success: true,
        message: "Token bucket reset successfully",
      };
    } catch (error) {
      logger.error("Error resetting bucket", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Set custom rate limit for specific API key
   * Note: This updates the bucket but should be used in conjunction with
   * updating the metadata hash for persistent custom limits
   */
  async setCustomLimit(
    apiKey: string,
    limit: number,
    refillRate?: number,
  ): Promise<CustomLimitResult> {
    try {
      // Validate inputs
      if (!limit || limit <= 0 || limit > 1000000) {
        throw new Error("Invalid limit: must be between 1 and 1000000");
      }
      if (refillRate && (refillRate <= 0 || refillRate > 100000)) {
        throw new Error("Invalid refillRate: must be between 1 and 100000");
      }

      const client = redisClient.getClient();
      const bucketKey = this._getBucketKey(apiKey);
      const metadataKey = this._getMetadataKey(apiKey);
      const actualRefillRate = refillRate || this.refillRate;

      const bucket: TokenBucket = {
        tokens: limit,
        lastRefill: Date.now(),
        capacity: limit,
      };

      // Use a pipeline to update both bucket and metadata atomically
      const pipeline = client.multi();

      // Update bucket
      pipeline.setEx(bucketKey, this.bucketTTL, JSON.stringify(bucket));

      // Update metadata for persistent limits
      pipeline.hSet(metadataKey, {
        maxBurst: limit.toString(),
        refillRate: actualRefillRate.toString(),
        tokensPerWindow: limit.toString(),
      });

      await pipeline.exec();

      logger.info("Custom rate limit set", {
        apiKey: apiKey.substring(0, 8) + "***",
        limit,
        refillRate: actualRefillRate,
      });

      return {
        success: true,
        message: "Custom rate limit applied",
        limit,
        refillRate: actualRefillRate,
      };
    } catch (error) {
      logger.error("Error setting custom limit", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Remove custom rate limit for an API key (revert to defaults)
   */
  async removeCustomLimit(apiKey: string): Promise<CustomLimitResult> {
    try {
      const client = redisClient.getClient();
      const bucketKey = this._getBucketKey(apiKey);
      const metadataKey = this._getMetadataKey(apiKey);

      const pipeline = client.multi();
      pipeline.del(bucketKey);
      pipeline.del(metadataKey);
      await pipeline.exec();

      logger.info("Custom rate limit removed", {
        apiKey: apiKey.substring(0, 8) + "***",
      });

      return {
        success: true,
        message: "Custom rate limit removed, reverted to defaults",
      };
    } catch (error) {
      logger.error("Error removing custom limit", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

export default new TokenBucketService();
