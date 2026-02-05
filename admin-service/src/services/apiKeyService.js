import crypto from "crypto";
import redisClient from "../config/redis.js";

class ApiKeyService {
  /**
   * Generate a new API key
   */
  generateApiKey(prefix = "sk") {
    const randomBytes = crypto.randomBytes(24).toString("hex");
    return `${prefix}_${randomBytes}`;
  }

  /**
   * Create a new API key with rate limit configuration
   */
  async createApiKey(options = {}) {
    const {
      name = "Unnamed Key",
      tier = "free",
      tokensPerWindow = 100,
      refillRate = 10,
      maxBurst = 100,
      enabled = true,
    } = options;

    const apiKey = this.generateApiKey();
    const redis = redisClient.getClient();

    // Store API key metadata
    const metadata = {
      name: String(name),
      tier: String(tier),
      tokensPerWindow: String(tokensPerWindow),
      refillRate: String(refillRate),
      maxBurst: String(maxBurst),
      enabled: String(enabled),
      createdAt: new Date().toISOString(),
      lastUsed: "null",
    };

    await redis.hSet(`apikey:${apiKey}:metadata`, metadata);

    // Initialize token bucket
    await redis.set(`apikey:${apiKey}:tokens`, tokensPerWindow);
    await redis.set(`apikey:${apiKey}:lastRefill`, Date.now());

    // Add to keys list
    await redis.sAdd("apikeys:all", apiKey);

    return {
      apiKey,
      ...metadata,
    };
  }

  /**
   * List all API keys
   */
  async listApiKeys() {
    const redis = redisClient.getClient();
    const apiKeys = await redis.sMembers("apikeys:all");

    const keysList = [];
    for (const apiKey of apiKeys) {
      const metadata = await redis.hGetAll(`apikey:${apiKey}:metadata`);
      const tokens = await redis.get(`apikey:${apiKey}:tokens`);

      keysList.push({
        apiKey,
        tokens: parseFloat(tokens) || 0,
        ...metadata,
      });
    }

    return keysList;
  }

  /**
   * Get details of a specific API key
   */
  async getApiKey(apiKey) {
    const redis = redisClient.getClient();

    const exists = await redis.sIsMember("apikeys:all", apiKey);
    if (!exists) {
      return null;
    }

    const metadata = await redis.hGetAll(`apikey:${apiKey}:metadata`);
    const tokens = await redis.get(`apikey:${apiKey}:tokens`);
    const lastRefill = await redis.get(`apikey:${apiKey}:lastRefill`);

    return {
      apiKey,
      tokens: parseFloat(tokens) || 0,
      lastRefill: parseInt(lastRefill) || Date.now(),
      ...metadata,
    };
  }

  /**
   * Update API key configuration
   */
  async updateApiKey(apiKey, updates = {}) {
    const redis = redisClient.getClient();

    const exists = await redis.sIsMember("apikeys:all", apiKey);
    if (!exists) {
      throw new Error("API key not found");
    }

    // Update metadata
    const allowedFields = [
      "name",
      "tier",
      "tokensPerWindow",
      "refillRate",
      "maxBurst",
      "enabled",
    ];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await redis.hSet(`apikey:${apiKey}:metadata`, updateData);
    }

    // If token limits changed, reset tokens
    if (updates.tokensPerWindow !== undefined) {
      await redis.set(`apikey:${apiKey}:tokens`, updates.tokensPerWindow);
    }

    return await this.getApiKey(apiKey);
  }

  /**
   * Delete/revoke an API key
   */
  async deleteApiKey(apiKey) {
    const redis = redisClient.getClient();

    const exists = await redis.sIsMember("apikeys:all", apiKey);
    if (!exists) {
      throw new Error("API key not found");
    }

    // Remove from keys list
    await redis.sRem("apikeys:all", apiKey);

    // Delete all related keys
    await redis.del(`apikey:${apiKey}:metadata`);
    await redis.del(`apikey:${apiKey}:tokens`);
    await redis.del(`apikey:${apiKey}:lastRefill`);

    return { success: true, message: "API key deleted" };
  }

  /**
   * Reset tokens for an API key
   */
  async resetTokens(apiKey) {
    const redis = redisClient.getClient();

    const metadata = await redis.hGetAll(`apikey:${apiKey}:metadata`);
    if (!metadata.tokensPerWindow) {
      throw new Error("API key not found");
    }

    await redis.set(`apikey:${apiKey}:tokens`, metadata.tokensPerWindow);
    await redis.set(`apikey:${apiKey}:lastRefill`, Date.now());

    return { success: true, tokens: metadata.tokensPerWindow };
  }

  /**
   * Get API key statistics
   */
  async getApiKeyStats() {
    const redis = redisClient.getClient();
    const apiKeys = await redis.sMembers("apikeys:all");

    let totalKeys = apiKeys.length;
    let enabledKeys = 0;
    let disabledKeys = 0;
    let tierCounts = {};

    for (const apiKey of apiKeys) {
      const metadata = await redis.hGetAll(`apikey:${apiKey}:metadata`);

      if (metadata.enabled === "true") {
        enabledKeys++;
      } else {
        disabledKeys++;
      }

      const tier = metadata.tier || "unknown";
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }

    return {
      totalKeys,
      enabledKeys,
      disabledKeys,
      tierCounts,
    };
  }
}

export default new ApiKeyService();
