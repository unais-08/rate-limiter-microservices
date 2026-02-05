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
    this.bucketTTL = config.rateLimit.bucketTTL || 3600; // TTL in seconds
    this.failOpen = config.rateLimit?.failOpen ?? true; // Fail open by default
  }

  /**
   * Get Redis key for an API key's token bucket
   */
  _getBucketKey(apiKey) {
    return `ratelimit:bucket:${apiKey}`;
  }

  /**
   * Get Redis key for an API key's metadata
   */
  _getMetadataKey(apiKey) {
    return `apikey:${apiKey}:metadata`;
  }

  /**
   * Check if request is allowed and consume a token (ATOMIC)
   *
   * @param {string} apiKey - The API key to check
   * @param {number} tokens - Number of tokens to consume (default: 1)
   * @returns {Object} - { allowed: boolean, remaining: number, resetIn: number, limit: number }
   */
  async checkLimit(apiKey, tokens = 1) {
    try {
      const client = redisClient.getClient();
      const bucketKey = this._getBucketKey(apiKey);
      const metadataKey = this._getMetadataKey(apiKey);
      const now = Date.now();

      // Lua script for atomic token bucket check and update
      // This prevents race conditions when multiple requests come simultaneously
      // and fetches metadata atomically within the script
      const luaScript = `
        local bucket_key = KEYS[1]
        local metadata_key = KEYS[2]
        local now = tonumber(ARGV[1])
        local tokens_requested = tonumber(ARGV[2])
        local default_capacity = tonumber(ARGV[3])
        local default_refill_rate = tonumber(ARGV[4])
        local default_tokens = tonumber(ARGV[5])
        local ttl = tonumber(ARGV[6])
        
        -- Fetch metadata atomically
        local metadata = redis.call('HGETALL', metadata_key)
        local capacity = default_capacity
        local refill_rate = default_refill_rate
        local initial_tokens = default_tokens
        
        -- Parse metadata (HGETALL returns flat array: key1, val1, key2, val2...)
        for i = 1, #metadata, 2 do
          if metadata[i] == 'maxBurst' then
            local val = tonumber(metadata[i+1])
            if val and val > 0 and val <= 1000000 then capacity = val end
          elseif metadata[i] == 'refillRate' then
            local val = tonumber(metadata[i+1])
            if val and val > 0 and val <= 100000 then refill_rate = val end
          elseif metadata[i] == 'tokensPerWindow' then
            local val = tonumber(metadata[i+1])
            if val and val > 0 and val <= 1000000 then initial_tokens = val end
          end
        end
        
        local bucket = redis.call('GET', bucket_key)
        local current_tokens, last_refill
        
        if not bucket then
          -- First request - create new bucket
          current_tokens = initial_tokens
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
            -- FIX: Use current time instead of incremental update to prevent drift
            last_refill = now
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
        redis.call('SETEX', bucket_key, ttl, new_bucket)
        
        -- Return: allowed, remaining_tokens, refill_rate, capacity
        return {allowed, current_tokens, refill_rate, capacity}
      `;

      // Execute Lua script atomically
      const result = await client.eval(luaScript, {
        keys: [bucketKey, metadataKey],
        arguments: [
          now.toString(),
          tokens.toString(),
          this.maxBurst.toString(),
          this.refillRate.toString(),
          this.defaultTokens.toString(),
          this.bucketTTL.toString(),
        ],
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
        error: error.message,
        stack: error.stack,
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
  async getStatus(apiKey) {
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
        const metadata = await client.hGetAll(metadataKey);

        if (metadata && Object.keys(metadata).length > 0) {
          if (metadata.maxBurst) {
            const val = parseInt(metadata.maxBurst);
            if (!isNaN(val) && val > 0 && val <= 1000000) {
              capacity = val;
            }
          }
          if (metadata.refillRate) {
            const val = parseInt(metadata.refillRate);
            if (!isNaN(val) && val > 0 && val <= 100000) {
              refillRate = val;
            }
          }
          if (metadata.tokensPerWindow) {
            const val = parseInt(metadata.tokensPerWindow);
            if (!isNaN(val) && val > 0 && val <= 1000000) {
              defaultTokens = val;
            }
          }
        }
      } catch (err) {
        logger.warn("Failed to fetch API key metadata, using defaults", {
          error: err.message,
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

      const bucket = JSON.parse(bucketData);

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
   * Note: This updates the bucket but should be used in conjunction with
   * updating the metadata hash for persistent custom limits
   */
  async setCustomLimit(apiKey, limit, refillRate) {
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

      const bucket = {
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
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove custom rate limit for an API key (revert to defaults)
   */
  async removeCustomLimit(apiKey) {
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
        error: error.message,
      });
      throw error;
    }
  }
}

export default new TokenBucketService();
