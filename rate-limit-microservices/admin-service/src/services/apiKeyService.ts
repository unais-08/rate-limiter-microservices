import crypto from "crypto";
import redisClient from "../config/redis.js";
import prisma from "../config/database.js";
import Logger from "../utils/logger.js";
import type {
  CreateApiKeyOptions,
  UpdateApiKeyOptions,
  ApiKeyResponse,
  ValidationResult,
  ApiKeyStats,
} from "../types/index.js";

const logger = new Logger("admin-service:apiKeyService");

class ApiKeyService {
  /**
   * Generate a new API key
   */
  generateApiKey(prefix: string = "sk"): string {
    const randomBytes = crypto.randomBytes(24).toString("hex");
    return `${prefix}_${randomBytes}`;
  }

  /**
   * Create a new API key with rate limit configuration
   * Stores in PostgreSQL (source of truth) then caches in Redis
   */
  async createApiKey(
    options: CreateApiKeyOptions = {},
  ): Promise<ApiKeyResponse> {
    const {
      name = "Unnamed Key",
      userId = null,
      tier = "free",
      tokensPerWindow = 100,
      refillRate = 0.2,
      maxBurst = 100,
      enabled = true,
      description = null,
      allowedIps = [],
    } = options;

    const apiKey = this.generateApiKey();

    try {
      // Store in PostgreSQL using Prisma
      const dbRecord = await prisma.apiKey.create({
        data: {
          key: apiKey,
          name,
          userId,
          tier,
          tokensPerWindow,
          refillRate,
          maxBurst,
          enabled,
          description,
          allowedIps,
        },
      });

      // Cache in Redis for fast access
      const redis = redisClient.getClient();

      const metadata = {
        name: String(name),
        userId: String(userId || ""),
        tier: String(tier),
        tokensPerWindow: String(tokensPerWindow),
        refillRate: String(refillRate),
        maxBurst: String(maxBurst),
        enabled: String(enabled),
        createdAt: dbRecord.createdAt.toISOString(),
        lastUsed: "null",
      };

      await redis.hSet(`apikey:${apiKey}:metadata`, metadata);
      await redis.set(`apikey:${apiKey}:tokens`, tokensPerWindow);
      await redis.set(`apikey:${apiKey}:lastRefill`, Date.now().toString());
      await redis.sAdd("apikeys:all", apiKey);
      await redis.expire(`apikey:${apiKey}:metadata`, 900); // 15 minutes

      return {
        id: dbRecord.id,
        apiKey: dbRecord.key,
        name: dbRecord.name,
        userId: dbRecord.userId,
        tier: dbRecord.tier,
        tokensPerWindow: dbRecord.tokensPerWindow,
        refillRate: dbRecord.refillRate,
        maxBurst: dbRecord.maxBurst,
        enabled: dbRecord.enabled,
        createdAt: dbRecord.createdAt,
        updatedAt: dbRecord.updatedAt,
        lastUsed: dbRecord.lastUsed,
        description: dbRecord.description,
      };
    } catch (error) {
      logger.error("Error creating API key", { error });
      throw new Error(
        `Failed to create API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validate API key - queries PostgreSQL and caches result in Redis
   * Called by API Gateway when Redis cache misses
   */
  async validateApiKey(apiKey: string): Promise<ValidationResult> {
    try {
      // Query PostgreSQL using Prisma
      logger.debug("Validating API key from request", { apiKey });

      const dbRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
      });
      logger.debug("DB Record retrieved", { found: !!dbRecord });
      if (!dbRecord) {
        return { valid: false }; // Key not found
      }

      // Update last_used timestamp
      await prisma.apiKey.update({
        where: { key: apiKey },
        data: { lastUsed: new Date() },
      });

      // Cache in Redis for future requests
      const redis = redisClient.getClient();

      const metadata = {
        name: String(dbRecord.name),
        userId: String(dbRecord.userId || ""),
        tier: String(dbRecord.tier),
        tokensPerWindow: String(dbRecord.tokensPerWindow),
        refillRate: String(dbRecord.refillRate),
        maxBurst: String(dbRecord.maxBurst),
        enabled: String(dbRecord.enabled),
        createdAt: dbRecord.createdAt.toISOString(),
        lastUsed: dbRecord.lastUsed ? dbRecord.lastUsed.toISOString() : "null",
      };

      // Cache with 15-minute expiry
      await redis.hSet(`apikey:${apiKey}:metadata`, metadata);
      await redis.expire(`apikey:${apiKey}:metadata`, 900);

      // Initialize token bucket if not exists
      const tokensExist = await redis.exists(`apikey:${apiKey}:tokens`);
      if (!tokensExist) {
        await redis.set(`apikey:${apiKey}:tokens`, dbRecord.tokensPerWindow);
        await redis.set(`apikey:${apiKey}:lastRefill`, Date.now().toString());
      }

      await redis.sAdd("apikeys:all", apiKey);

      return {
        valid: dbRecord.enabled,
        metadata: {
          name: dbRecord.name,
          userId: dbRecord.userId,
          tier: dbRecord.tier,
          tokensPerWindow: dbRecord.tokensPerWindow,
          refillRate: dbRecord.refillRate,
          maxBurst: dbRecord.maxBurst,
          enabled: dbRecord.enabled,
        },
      };
    } catch (error) {
      logger.error("Error validating API key", { error });
      throw new Error(
        `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * List all API keys
   */
  async listApiKeys(): Promise<ApiKeyResponse[]> {
    try {
      const dbRecords = await prisma.apiKey.findMany({
        orderBy: { createdAt: "desc" },
      });

      const redis = redisClient.getClient();
      const keysList: ApiKeyResponse[] = [];

      for (const row of dbRecords) {
        // Try to get current tokens from Redis
        const tokens = await redis.get(`apikey:${row.key}:tokens`);

        keysList.push({
          id: row.id,
          apiKey: row.key,
          name: row.name,
          userId: row.userId,
          tier: row.tier,
          tokensPerWindow: row.tokensPerWindow,
          refillRate: row.refillRate,
          maxBurst: row.maxBurst,
          enabled: row.enabled,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          lastUsed: row.lastUsed,
          description: row.description,
          currentTokens: tokens ? parseFloat(tokens) : row.tokensPerWindow,
        });
      }

      return keysList;
    } catch (error) {
      logger.error("Error listing API keys", { error });
      throw new Error(
        `Failed to list API keys: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get details of a specific API key
   */
  async getApiKey(apiKey: string): Promise<ApiKeyResponse | null> {
    try {
      const dbRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
      });

      if (!dbRecord) {
        return null;
      }

      const redis = redisClient.getClient();

      // Get current token count from Redis
      const tokens = await redis.get(`apikey:${apiKey}:tokens`);
      const lastRefill = await redis.get(`apikey:${apiKey}:lastRefill`);

      return {
        id: dbRecord.id,
        apiKey: dbRecord.key,
        name: dbRecord.name,
        userId: dbRecord.userId,
        tier: dbRecord.tier,
        tokensPerWindow: dbRecord.tokensPerWindow,
        refillRate: dbRecord.refillRate,
        maxBurst: dbRecord.maxBurst,
        enabled: dbRecord.enabled,
        createdAt: dbRecord.createdAt,
        updatedAt: dbRecord.updatedAt,
        lastUsed: dbRecord.lastUsed,
        description: dbRecord.description,
        currentTokens: tokens ? parseFloat(tokens) : dbRecord.tokensPerWindow,
        lastRefill: lastRefill ? parseInt(lastRefill) : Date.now(),
      };
    } catch (error) {
      logger.error("Error getting API key", { error });
      throw new Error(
        `Failed to get API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update API key configuration
   */
  async updateApiKey(
    apiKey: string,
    updates: UpdateApiKeyOptions = {},
  ): Promise<ApiKeyResponse> {
    try {
      // Check if key exists
      const existing = await prisma.apiKey.findUnique({
        where: { key: apiKey },
      });

      if (!existing) {
        throw new Error("API key not found");
      }

      // Update PostgreSQL using Prisma
      const dbRecord = await prisma.apiKey.update({
        where: { key: apiKey },
        data: updates,
      });

      // Update Redis cache
      const redis = redisClient.getClient();
      const redisUpdates: Record<string, string> = {};

      if (updates.name !== undefined) redisUpdates.name = String(updates.name);
      if (updates.tier !== undefined) redisUpdates.tier = String(updates.tier);
      if (updates.tokensPerWindow !== undefined) {
        redisUpdates.tokensPerWindow = String(updates.tokensPerWindow);
        // Reset token bucket
        await redis.set(`apikey:${apiKey}:tokens`, updates.tokensPerWindow);
      }
      if (updates.refillRate !== undefined)
        redisUpdates.refillRate = String(updates.refillRate);
      if (updates.maxBurst !== undefined)
        redisUpdates.maxBurst = String(updates.maxBurst);
      if (updates.enabled !== undefined)
        redisUpdates.enabled = String(updates.enabled);

      if (Object.keys(redisUpdates).length > 0) {
        await redis.hSet(`apikey:${apiKey}:metadata`, redisUpdates);
        await redis.expire(`apikey:${apiKey}:metadata`, 900);
      }

      return {
        id: dbRecord.id,
        apiKey: dbRecord.key,
        name: dbRecord.name,
        userId: dbRecord.userId,
        tier: dbRecord.tier,
        tokensPerWindow: dbRecord.tokensPerWindow,
        refillRate: dbRecord.refillRate,
        maxBurst: dbRecord.maxBurst,
        enabled: dbRecord.enabled,
        createdAt: dbRecord.createdAt,
        updatedAt: dbRecord.updatedAt,
        lastUsed: dbRecord.lastUsed,
        description: dbRecord.description,
      };
    } catch (error) {
      logger.error("Error updating API key", { error });
      throw new Error(
        `Failed to update API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete/revoke an API key
   */
  async deleteApiKey(
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Delete from PostgreSQL
      await prisma.apiKey.delete({
        where: { key: apiKey },
      });

      // Remove from Redis cache
      const redis = redisClient.getClient();
      await redis.sRem("apikeys:all", apiKey);
      await redis.del(`apikey:${apiKey}:metadata`);
      await redis.del(`apikey:${apiKey}:tokens`);
      await redis.del(`apikey:${apiKey}:lastRefill`);

      return { success: true, message: "API key deleted" };
    } catch (error) {
      logger.error("Error deleting API key", { error });
      throw new Error(
        `Failed to delete API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Reset tokens for an API key
   */
  async resetTokens(
    apiKey: string,
  ): Promise<{ success: boolean; tokens: number }> {
    try {
      // Get token limit from PostgreSQL
      const dbRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        select: { tokensPerWindow: true },
      });

      if (!dbRecord) {
        throw new Error("API key not found");
      }

      // Reset in Redis
      const redis = redisClient.getClient();
      await redis.set(`apikey:${apiKey}:tokens`, dbRecord.tokensPerWindow);
      await redis.set(`apikey:${apiKey}:lastRefill`, Date.now().toString());

      return { success: true, tokens: dbRecord.tokensPerWindow };
    } catch (error) {
      logger.error("Error resetting tokens", { error });
      throw new Error(
        `Failed to reset tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get API key statistics
   */
  async getApiKeyStats(): Promise<ApiKeyStats> {
    try {
      const [totalKeys, enabledKeys, disabledKeys, tierGroups] =
        await Promise.all([
          prisma.apiKey.count(),
          prisma.apiKey.count({ where: { enabled: true } }),
          prisma.apiKey.count({ where: { enabled: false } }),
          prisma.apiKey.groupBy({
            by: ["tier"],
            _count: true,
          }),
        ]);

      const tierCounts: Record<string, number> = {};
      for (const group of tierGroups) {
        tierCounts[group.tier] = group._count;
      }

      return {
        totalKeys,
        enabledKeys,
        disabledKeys,
        tierCounts,
      };
    } catch (error) {
      logger.error("Error getting API key stats", { error });
      throw new Error(
        `Failed to get stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default new ApiKeyService();
