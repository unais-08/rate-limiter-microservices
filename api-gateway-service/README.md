# API Gateway Service

The **API Gateway** is the central entry point for all client requests. It handles authentication, rate limiting, and routes requests to protected backend services.

## 🎯 Purpose

This service acts as a **gatekeeper** that:

1. Validates API keys
2. Checks rate limits (communicates with Rate Limiter Service)
3. Forwards allowed requests to Backend Service
4. Blocks abusive traffic

## 🏗️ Architecture

```
Client → API Gateway → Rate Limiter Service → Decision
              ↓              (Check limits)         ↓
              ↓                                  Allowed?
              ↓                                     ↓
              ↓─────────────────────────────────→  Yes
              │                                     ↓
              └──→ Backend Service ──→ Response → Client

If blocked (429):
Client ← API Gateway ← Rate Limiter Decision
         (Return 429)
```

## 📂 Project Structure

```
api-gateway-service/
├── src/
│   ├── app.js                          # Express app setup
│   ├── server.js                       # Server lifecycle
│   ├── config/
│   │   └── index.js                    # Configuration
│   ├── controllers/
│   │   └── gatewayController.js        # Request handlers
│   ├── routes/
│   │   ├── index.js                    # Main router
│   │   └── gatewayRoutes.js            # Gateway routes
│   ├── services/
│   │   ├── rateLimiterClient.js        # Rate limiter communication
│   │   └── backendProxy.js             # Backend forwarding
│   ├── middleware/
│   │   ├── apiKeyValidator.js          # API key validation
│   │   └── rateLimiter.js              # Rate limit checking
│   ├── utils/
│   │   ├── logger.js                   # Structured logging
│   │   └── errorHandler.js             # Error handling
│   └── middleware/
├── package.json
├── .env.example
└── README.md
```

## 🚀 Installation & Setup

```bash
cd api-gateway-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env if needed (default settings work for local development)

# Start the gateway
npm start
```

## ⚙️ Configuration

| Variable              | Description                  | Default                 |
| --------------------- | ---------------------------- | ----------------------- |
| `PORT`                | Gateway port                 | `3000`                  |
| `RATE_LIMITER_URL`    | Rate limiter service URL     | `http://localhost:3002` |
| `BACKEND_SERVICE_URL` | Backend service URL          | `http://localhost:3001` |
| `API_KEY_HEADER`      | Header name for API key      | `X-API-Key`             |
| `API_KEY_REQUIRED`    | Require API key for requests | `true`                  |

## 📡 API Usage

### Making Requests Through Gateway

All backend endpoints are accessible via `/api/*`:

```bash
# Health check (no API key required)
curl http://localhost:3000/health

# Get user (requires API key)
curl http://localhost:3000/api/v1/users/123 \
  -H "X-API-Key: user_abc123"

# List resources
curl http://localhost:3000/api/v1/resources?limit=5 \
  -H "X-API-Key: user_abc123"

# Create resource
curl -X POST http://localhost:3000/api/v1/resources \
  -H "X-API-Key: user_abc123" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Resource"}'
```

### API Key Format

For MVP, any string with 8+ characters works as an API key:

- ✅ `user_abc123`
- ✅ `test_key_12345`
- ✅ `myapikey1234`
- ❌ `short` (too short)

## 🔐 Request Flow

### Successful Request:

```
1. Client → Gateway: GET /api/v1/users/123
              Header: X-API-Key: user_abc123

2. Gateway validates API key: ✅ Valid format

3. Gateway → Rate Limiter: "Can user_abc123 make a request?"

4. Rate Limiter checks Redis:
   - Has tokens? ✅ Yes (9 remaining)
   - Returns: { allowed: true, remaining: 9 }

5. Gateway → Backend: GET /api/v1/users/123
              Headers: X-Gateway-API-Key, X-Forwarded-By

6. Backend processes request → Returns data

7. Gateway → Client: 200 OK + data
              Headers: X-RateLimit-Limit, X-RateLimit-Remaining
```

### Rate Limited Request:

```
1. Client → Gateway: GET /api/v1/users/123
              Header: X-API-Key: abusive_user

2. Gateway validates API key: ✅ Valid format

3. Gateway → Rate Limiter: "Can abusive_user make a request?"

4. Rate Limiter checks Redis:
   - Has tokens? ❌ No (0 remaining)
   - Returns: { allowed: false, resetIn: 5 }

5. Gateway → Client: 429 Too Many Requests
              Headers: X-RateLimit-Remaining: 0
                      X-RateLimit-Reset: 5
              Body: { error: "Rate limit exceeded", retryAfter: 5 }
```

## 🛡️ Security Features

### 1. API Key Validation

- Checks for `X-API-Key` header
- Validates format (minimum 8 characters)
- Attaches key to request for downstream use

### 2. Rate Limiting

- Calls Rate Limiter Service before processing
- Adds rate limit headers to all responses
- Blocks requests that exceed limits

### 3. Request Sanitization

- Filters hop-by-hop headers
- Adds gateway metadata headers
- Tracks original client IP

### 4. Error Handling

- Structured error responses
- Fail-open/fail-closed configuration
- Proper HTTP status codes

## 📊 Response Headers

All proxied requests include:

```
X-RateLimit-Limit: 10          # Maximum requests allowed
X-RateLimit-Remaining: 7       # Requests remaining
X-RateLimit-Reset: 3           # Seconds until reset
X-Gateway-Processed: true      # Indicates gateway processing
```

## 🧪 Testing the Gateway

### Test Script:

```bash
#!/bin/bash

API_KEY="test_user_12345"
GATEWAY="http://localhost:3000"

echo "Test 1: Health check (no API key needed)"
curl -s $GATEWAY/health | grep -o '"status":"[^"]*"'

echo "\nTest 2: Request without API key (should fail)"
curl -s $GATEWAY/api/v1/users/123

echo "\nTest 3: Valid request with API key"
curl -s $GATEWAY/api/v1/users/123 \
  -H "X-API-Key: $API_KEY"

echo "\nTest 4: Make 10 requests rapidly"
for i in {1..10}; do
  echo "Request $i:"
  curl -s $GATEWAY/api/v1/resources \
    -H "X-API-Key: $API_KEY" \
    | grep -o '"remaining":[0-9]*'
done

echo "\nTest 5: 11th request (should be rate limited)"
curl -s $GATEWAY/api/v1/resources \
  -H "X-API-Key: $API_KEY"
```

## 🔄 Middleware Chain

Every request goes through this pipeline:

```javascript
Request
  ↓
[validateApiKey]       // Check API key exists & valid format
  ↓
[rateLimitMiddleware]  // Call rate limiter, check if allowed
  ↓
[proxyToBackend]       // Forward to backend service
  ↓
Response
```

## 🚨 Error Responses

### 401 Unauthorized (Missing/Invalid API Key)

```json
{
  "success": false,
  "error": {
    "message": "Missing X-API-Key header",
    "statusCode": 401
  }
}
```

### 429 Too Many Requests (Rate Limited)

```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "statusCode": 429,
    "remaining": 0,
    "resetIn": 5,
    "retryAfter": 5
  }
}
```

### 503 Service Unavailable (Backend Down)

```json
{
  "success": false,
  "error": {
    "message": "Backend service unavailable",
    "statusCode": 503
  }
}
```

## 🎯 Production Considerations

### Fail-Open vs Fail-Closed

If Rate Limiter Service is down:

**Development (Fail-Open):**

- Allows requests through
- Logs warning
- Continues serving traffic

**Production (Fail-Closed):**

- Blocks all requests (safer)
- Returns 503 error
- Prevents uncontrolled traffic

Configure in `src/services/rateLimiterClient.js`:

```javascript
if (config.env === "production") {
  return { allowed: false }; // Fail-closed
} else {
  return { allowed: true }; // Fail-open
}
```

### Monitoring

Key metrics to track:

- Request rate (requests/second)
- Rate limit hit rate (% of requests blocked)
- Backend response times
- Gateway error rate
- API key usage patterns

### Scaling

- **Horizontal**: Run multiple gateway instances
- **Load Balancer**: Place in front of gateways
- **Caching**: Add Redis cache for API key validation
- **Connection Pooling**: Reuse HTTP connections to services

## 🔗 Service Dependencies

**Required Services:**

1. ✅ Backend Service (port 3001)
2. ✅ Rate Limiter Service (port 3002)
3. ✅ Redis (for rate limiter)

**Start All Services:**

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend-service && npm start

# Terminal 3: Rate Limiter
cd rate-limiter-service && npm start

# Terminal 4: Gateway
cd api-gateway-service && npm start
```

## 🎉 Next Steps

With the API Gateway complete, you have the core protection layer working!

**Coming Next:**

- Usage Analytics Service (logs request patterns)
- Admin Service (manage API keys, view stats)

## License

MIT
