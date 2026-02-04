# Rate Limiter Service

The core microservice that implements rate limiting using the **Token Bucket algorithm** with Redis for distributed state management.

## 🎯 What This Service Does

This service acts as a decision maker: "Should this request be allowed or blocked?"

**The API Gateway asks:** "Can API key `abc123` make a request?"  
**This service answers:** "Yes, allow it" or "No, rate limit exceeded"

## 🪣 Token Bucket Algorithm (Simple Explanation)

Think of it like a coin bucket at an arcade:

1. **You start with 100 coins (tokens)** in your bucket
2. **Each game (API request) costs 1 coin**
3. **The machine refills your bucket slowly**: 10 coins every second
4. **Maximum capacity**: Your bucket can only hold 100 coins

### Real Example:

```
Time 0:00 - You have 100 tokens
Time 0:01 - You play 50 games → 50 tokens left
Time 0:05 - Wait 4 seconds → Refilled 40 tokens (10/sec) → Now have 90 tokens
Time 0:06 - You play 150 games rapidly:
            - First 90 games allowed (consume all tokens)
            - Next 60 games BLOCKED ❌ (bucket empty)
Time 0:12 - Wait 6 seconds → Refilled 60 tokens → Now have 60 tokens
```

### Why Token Bucket?

- **Allows bursts**: User can make 100 requests quickly if they saved tokens
- **Smooth refills**: Tokens come back gradually, not all at once
- **Fair**: Everyone gets the same refill rate
- **Simple**: Easy to understand and implement

## 📂 Architecture

```
rate-limiter-service/
├── src/
│   ├── app.js                          # Express app + Redis connection
│   ├── server.js                       # Server lifecycle
│   ├── config/
│   │   └── index.js                    # Configuration (Redis, limits)
│   ├── controllers/
│   │   └── rateLimitController.js      # Request handlers
│   ├── routes/
│   │   ├── index.js                    # Main router
│   │   └── rateLimitRoutes.js          # Rate limit endpoints
│   ├── services/
│   │   └── tokenBucketService.js       # 🔥 Core algorithm logic
│   ├── utils/
│   │   ├── logger.js                   # Structured logging
│   │   ├── errorHandler.js             # Error handling
│   │   └── redisClient.js              # Redis connection manager
│   └── middleware/
├── package.json
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### 1. Check Rate Limit (Main Endpoint)

```http
POST /api/v1/ratelimit/check
Content-Type: application/json

{
  "apiKey": "user_abc123",
  "tokens": 1
}
```

**Response (Allowed):**

```json
{
  "success": true,
  "allowed": true,
  "data": {
    "remaining": 99,
    "limit": 100,
    "resetIn": 0
  }
}
```

**Response (Blocked):**

```json
{
  "success": false,
  "allowed": false,
  "error": {
    "message": "Rate limit exceeded",
    "statusCode": 429,
    "remaining": 0,
    "resetIn": 5
  }
}
```

### 2. Get Status

```http
GET /api/v1/ratelimit/status/:apiKey
```

Returns current token count without consuming tokens.

### 3. Reset Bucket (Admin)

```http
POST /api/v1/ratelimit/reset
Content-Type: application/json

{
  "apiKey": "user_abc123"
}
```

### 4. Set Custom Limit (Admin)

```http
POST /api/v1/ratelimit/custom-limit
Content-Type: application/json

{
  "apiKey": "premium_user",
  "limit": 1000,
  "refillRate": 50
}
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- Redis server running

### Install Redis (if not installed)

**Linux/macOS:**

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

**Or use Docker:**

```bash
docker run -d -p 6379:6379 redis:alpine
```

### Install Service

```bash
cd rate-limiter-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Redis (if not already running)
redis-server &

# Start the service
npm start
```

## 🧪 Testing

### Test with curl:

```bash
# Check if service is healthy
curl http://localhost:3002/health

# Check rate limit (first time)
curl -X POST http://localhost:3002/api/v1/ratelimit/check \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test_user_123"}'

# Make 100 requests rapidly (exhaust tokens)
for i in {1..100}; do
  curl -X POST http://localhost:3002/api/v1/ratelimit/check \
    -H "Content-Type: application/json" \
    -d '{"apiKey": "test_user_123"}'
done

# 101st request should be blocked
curl -X POST http://localhost:3002/api/v1/ratelimit/check \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test_user_123"}'

# Check status
curl http://localhost:3002/api/v1/ratelimit/status/test_user_123
```

## ⚙️ Configuration

| Variable         | Description             | Default     |
| ---------------- | ----------------------- | ----------- |
| `PORT`           | Service port            | `3002`      |
| `REDIS_HOST`     | Redis hostname          | `localhost` |
| `REDIS_PORT`     | Redis port              | `6379`      |
| `DEFAULT_TOKENS` | Starting tokens per key | `100`       |
| `REFILL_RATE`    | Tokens per second       | `10`        |
| `MAX_BURST`      | Maximum token capacity  | `100`       |

### Rate Limit Examples:

**Strict (APIs with heavy processing):**

```env
DEFAULT_TOKENS=50
REFILL_RATE=5
MAX_BURST=50
# Result: 50 requests/10 seconds, max 50 burst
```

**Moderate (default):**

```env
DEFAULT_TOKENS=100
REFILL_RATE=10
MAX_BURST=100
# Result: 100 requests/10 seconds, max 100 burst
```

**Generous (read-heavy APIs):**

```env
DEFAULT_TOKENS=500
REFILL_RATE=50
MAX_BURST=500
# Result: 500 requests/10 seconds, max 500 burst
```

## 🔍 How Token Bucket Service Works

### Storage in Redis:

```javascript
// Key: ratelimit:bucket:user_abc123
{
  "tokens": 87,              // Current tokens available
  "lastRefill": 1738752000000, // Last refill timestamp
  "capacity": 100            // Maximum tokens
}
```

### Algorithm Flow:

1. **Request comes in** with API key
2. **Fetch bucket** from Redis (or create new one)
3. **Calculate refill**:
   - Time passed × refill rate = tokens to add
   - Example: 5 seconds × 10 tokens/sec = 50 tokens
4. **Update bucket**: Add tokens (max = capacity)
5. **Check availability**: tokens >= requested?
6. **If yes**: Consume tokens, save to Redis, return allowed
7. **If no**: Return blocked with reset time

### Why Redis?

- **Fast**: In-memory database, microsecond response times
- **Distributed**: Multiple gateway instances can share state
- **Atomic**: Operations are thread-safe
- **TTL**: Buckets expire after 1 hour of inactivity (saves memory)

## 🎭 Integration Example

This service doesn't handle client requests directly. The **API Gateway** calls it:

```
Client Request → API Gateway → Rate Limiter Service → Decision
                      ↓                                   ↓
                  If allowed                          If blocked
                      ↓                                   ↓
               Backend Service                      Return 429
```

## 🛡️ Production Considerations

### Fail-Open vs Fail-Closed

In `tokenBucketService.js`, if Redis fails:

```javascript
// Current: Fail-Open (allow requests)
return { allowed: true, ... };

// For strict security: Fail-Closed (block requests)
return { allowed: false, ... };
```

### Monitoring

Key metrics to track:

- Redis connection status
- Average token consumption per key
- Number of blocked requests
- Redis memory usage

### Scaling

- **Horizontal**: Run multiple instances, all share Redis
- **Redis Cluster**: For high availability
- **Caching**: Add local cache for frequently checked keys

## 📈 Next Steps

This service is complete and ready to be called by the **API Gateway**.

**Coming next:**

- API Gateway (intercepts client requests, calls this service)
- Usage Analytics (logs request patterns)
- Admin Service (manage API keys and limits)

## 🐛 Troubleshooting

**Redis connection failed:**

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

**Rate limit not working:**

```bash
# Check Redis keys
redis-cli
> KEYS ratelimit:*
> GET ratelimit:bucket:your_api_key
```

**Service won't start:**

```bash
# Check if port is in use
lsof -i :3002

# Check logs
npm start
```

## License

MIT
