import redisClient from "../utils/redisClient.js";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Token Bucket Rate Limiter Service
 *
 * HOW IT WORKS (Simple Explanation):
 *
 * Imagine you have a bucket that can hold 100 tokens (coins).
 * - Every API request costs 1 token
 * - The bucket refills slowly: 10 tokens per second
 * - If bucket is empty → request blocked (HTTP 429)
 * - If bucket has tokens → request allowed, remove 1 token
 *
 * Example:
 * 1. User starts with 100 tokens
 * 2. Makes 50 requests quickly → 50 tokens left
 * 3. Waits 5 seconds → bucket refills 50 tokens (10/sec × 5) → back to 100
 * 4. Makes 150 requests in 1 second → first 100 allowed, next 50 blocked
 */
class TokenBucketService {
  constructor() {
    this.defaultTokens = config.rateLimit.defaultTokens;
    this.refillRate = config.rateLimit.refillRate;
    this.maxBurst = config.rateLimit.maxBurst;
  }

  /**
   * Get Redis key for an API key's token bucket
   */
  _getBucketKey(apiKey) {
    return `ratelimit:bucket:${apiKey}`;
  }

  /**
   * Check if request is allowed and consume a token
   *
   * @param {string} apiKey - The API key to check
   * @param {number} tokens - Number of tokens to consume (default: 1)
   * @returns {Object} - { allowed: boolean, remaining: number, resetIn: number }
   */
  async checkLimit(apiKey, tokens = 1) {
    try {
      const client = redisClient.getClient();
      const key = this._getBucketKey(apiKey);
      const now = Date.now();

      // Get current bucket state from Redis
      const bucketData = await client.get(key);

      let bucket;

      if (!bucketData) {
        // First request - create new bucket
        bucket = {
          tokens: this.defaultTokens,
          lastRefill: now,
          capacity: this.maxBurst,
        };

        logger.debug("Created new token bucket", {
          apiKey,
          tokens: bucket.tokens,
        });
      } else {
        // Parse existing bucket
        bucket = JSON.parse(bucketData);

        // Calculate token refill
        const timePassed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = Math.floor(timePassed * this.refillRate);

        if (tokensToAdd > 0) {
          // Refill tokens (but don't exceed capacity)
          bucket.tokens = Math.min(
            bucket.capacity,
            bucket.tokens + tokensToAdd,
          );
          // Update lastRefill by the time equivalent of tokens actually added
          // This prevents losing fractional time between refills
          const timeConsumedForTokens = tokensToAdd / this.refillRate;
          bucket.lastRefill = bucket.lastRefill + timeConsumedForTokens * 1000;

          logger.debug("Refilled tokens", {
            apiKey,
            tokensAdded: tokensToAdd,
            currentTokens: bucket.tokens,
          });
        }
      }

      // Check if enough tokens available
      const allowed = bucket.tokens >= tokens;

      if (allowed) {
        // Consume tokens
        bucket.tokens -= tokens;

        logger.debug("Request allowed", {
          apiKey,
          tokensConsumed: tokens,
          tokensRemaining: bucket.tokens,
        });
      } else {
        logger.warn("Request blocked - rate limit exceeded", {
          apiKey,
          tokensNeeded: tokens,
          tokensAvailable: bucket.tokens,
        });
      }

      // Save updated bucket to Redis (expires in 1 hour of inactivity)
      // Always save, even when blocked, to persist the refilled token count
      await client.setEx(key, 3600, JSON.stringify(bucket));

      // Calculate when the bucket will have enough tokens
      const tokensNeeded = allowed ? 0 : tokens - bucket.tokens;
      const resetIn = Math.ceil(tokensNeeded / this.refillRate);

      return {
        allowed,
        remaining: Math.max(0, bucket.tokens),
        resetIn, // seconds until enough tokens available
        limit: this.maxBurst,
        requestedTokens: tokens,
      };
    } catch (error) {
      logger.error("Error checking rate limit", {
        apiKey,
        error: error.message,
      });

      // Fail open - allow request if Redis fails (or fail closed for strict security)
      return {
        allowed: true, // Change to false for fail-closed behavior
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
  async getStatus(apiKey) {
    try {
      const client = redisClient.getClient();
      const key = this._getBucketKey(apiKey);
      const now = Date.now();

      const bucketData = await client.get(key);

      if (!bucketData) {
        return {
          tokens: this.defaultTokens,
          capacity: this.maxBurst,
          refillRate: this.refillRate,
        };
      }

      const bucket = JSON.parse(bucketData);

      // Calculate refilled tokens
      const timePassed = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = Math.floor(timePassed * this.refillRate);
      const currentTokens = Math.min(
        bucket.capacity,
        bucket.tokens + tokensToAdd,
      );

      return {
        tokens: currentTokens,
        capacity: bucket.capacity,
        refillRate: this.refillRate,
        lastRefill: bucket.lastRefill,
      };
    } catch (error) {
      logger.error("Error getting bucket status", {
        apiKey,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Reset bucket for an API key (admin function)
   */
  async resetBucket(apiKey) {
    try {
      const client = redisClient.getClient();
      const key = this._getBucketKey(apiKey);

      await client.del(key);

      logger.info("Token bucket reset", { apiKey });

      return {
        success: true,
        message: "Token bucket reset successfully",
      };
    } catch (error) {
      logger.error("Error resetting bucket", { apiKey, error: error.message });
      throw error;
    }
  }

  /**
   * Set custom rate limit for specific API key
   */
  async setCustomLimit(apiKey, limit, refillRate) {
    try {
      const client = redisClient.getClient();
      const key = this._getBucketKey(apiKey);

      const bucket = {
        tokens: limit,
        lastRefill: Date.now(),
        capacity: limit,
        refillRate: refillRate || this.refillRate,
      };

      await client.setEx(key, 3600, JSON.stringify(bucket));

      logger.info("Custom rate limit set", { apiKey, limit, refillRate });

      return {
        success: true,
        message: "Custom rate limit applied",
        limit,
        refillRate: bucket.refillRate,
      };
    } catch (error) {
      logger.error("Error setting custom limit", {
        apiKey,
        error: error.message,
      });
      throw error;
    }
  }
}

export default new TokenBucketService();
