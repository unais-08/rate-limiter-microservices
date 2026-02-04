import redisClient from "../utils/redisClient.js";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Token Bucket Rate Limiter Service (ATOMIC VERSION)
 *
 * Uses Redis Lua scripts for atomic operations to prevent race conditions
 * when multiple requests arrive simultaneously.
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
   * Check if request is allowed and consume a token (ATOMIC)
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

      // Lua script for atomic token bucket check and update
      // This prevents race conditions when multiple requests come simultaneously
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local tokens_requested = tonumber(ARGV[2])
        local capacity = tonumber(ARGV[3])
        local refill_rate = tonumber(ARGV[4])
        local default_tokens = tonumber(ARGV[5])
        
        local bucket = redis.call('GET', key)
        local current_tokens, last_refill
        
        if not bucket then
          -- First request - create new bucket
          current_tokens = default_tokens
          last_refill = now
        else
          -- Parse existing bucket
          local data = cjson.decode(bucket)
          current_tokens = data.tokens
          last_refill = data.lastRefill
          
          -- Calculate refill
          local time_passed = (now - last_refill) / 1000
          local tokens_to_add = math.floor(time_passed * refill_rate)
          
          if tokens_to_add > 0 then
            current_tokens = math.min(capacity, current_tokens + tokens_to_add)
            -- Update lastRefill by time consumed for tokens added
            local time_for_tokens = tokens_to_add / refill_rate
            last_refill = last_refill + (time_for_tokens * 1000)
          end
        end
        
        -- Check if enough tokens
        local allowed = 0
        if current_tokens >= tokens_requested then
          allowed = 1
          current_tokens = current_tokens - tokens_requested
        end
        
        -- Save updated bucket
        local new_bucket = cjson.encode({
          tokens = current_tokens,
          lastRefill = last_refill,
          capacity = capacity
        })
        redis.call('SETEX', key, 3600, new_bucket)
        
        -- Return: allowed, remaining_tokens
        return {allowed, current_tokens}
      `;

      // Execute Lua script atomically
      const result = await client.eval(luaScript, {
        keys: [key],
        arguments: [
          now.toString(),
          tokens.toString(),
          this.maxBurst.toString(),
          this.refillRate.toString(),
          this.defaultTokens.toString(),
        ],
      });

      const allowed = result[0] === 1;
      const remaining = result[1];

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

      // Calculate when enough tokens will be available
      const tokensNeeded = allowed ? 0 : tokens - remaining;
      const resetIn = Math.ceil(tokensNeeded / this.refillRate);

      return {
        allowed,
        remaining: Math.max(0, remaining),
        resetIn,
        limit: this.maxBurst,
        requestedTokens: tokens,
      };
    } catch (error) {
      logger.error("Error checking rate limit", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error.message,
        stack: error.stack,
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
        apiKey: apiKey.substring(0, 8) + "***",
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
        error: error.message,
      });
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

      logger.info("Custom rate limit set", {
        apiKey: apiKey.substring(0, 8) + "***",
        limit,
        refillRate,
      });

      return {
        success: true,
        message: "Custom rate limit applied",
        limit,
        refillRate: bucket.refillRate,
      };
    } catch (error) {
      logger.error("Error setting custom limit", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error.message,
      });
      throw error;
    }
  }
}

export default new TokenBucketService();
