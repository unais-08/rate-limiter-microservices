/**
 * Lua script for atomic token bucket check and update
 * This prevents race conditions when multiple requests come simultaneously
 * and fetches metadata atomically within the script
 */
export const luaScript = `
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
