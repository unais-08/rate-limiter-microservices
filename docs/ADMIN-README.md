# Admin Service

**Port:** 3004  
**Purpose:** Management dashboard and control panel for the entire rate limiter platform

## What This Service Does (Simple Explanation)

Think of this as the **control center** for your entire API rate limiter system:

1. **Create & Manage API Keys**: Generate new API keys for users, set their rate limits, enable/disable them
2. **Monitor Everything**: See real-time health of all services, request metrics, who's getting blocked
3. **Configure Rate Limits**: Change rate limits per API key without restarting services
4. **View Analytics**: See reports, usage patterns, top users, system statistics

It's like the **admin panel** where you control and monitor your entire infrastructure.

## Architecture

```
┌─────────────────┐
│  Admin Service  │ (Port 3004)
│  Control Panel  │
└─────────────────┘
      │
      ├──→ Redis (manage API keys, rate limits)
      ├──→ PostgreSQL (read analytics data)
      ├──→ Rate Limiter Service (monitor)
      ├──→ Analytics Service (get reports)
      └──→ API Gateway (check health)
```

## Features

### 1. API Key Management

- Create new API keys with custom rate limits
- List all API keys with their current token counts
- Update API key configurations (limits, tiers, status)
- Delete/revoke API keys
- Reset token buckets
- Get statistics (total keys, enabled/disabled, tiers)

### 2. Monitoring & Health Checks

- Check health of all services (Gateway, Rate Limiter, Analytics)
- Real-time system metrics
- Dashboard with comprehensive overview
- Time-series request data
- Endpoint performance analytics
- Top rate-limited API keys

### 3. Authentication

- Secure login with JWT tokens
- Protected endpoints (require authentication)
- Token-based access (24-hour expiry)

## Installation

```bash
cd admin-service
npm install
```

## Configuration

Edit `.env`:

```env
PORT=3004
NODE_ENV=development

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key-change-in-production

# Service URLs
RATE_LIMITER_URL=http://localhost:3002
ANALYTICS_URL=http://localhost:3003
GATEWAY_URL=http://localhost:3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=rate_limiter_analytics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Running the Service

```bash
# Start the service
npm start

# Development mode with auto-reload
npm run dev
```

## API Documentation

### Authentication

#### Login

```bash
POST /api/admin/login

Request Body:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}

# Save the token for subsequent requests:
export TOKEN="your-token-here"
```

All other endpoints require authentication:

```bash
-H "Authorization: Bearer $TOKEN"
```

---

### API Key Management

#### Create New API Key

```bash
POST /api/admin/keys
Authorization: Bearer $TOKEN
Content-Type: application/json

{
  "name": "Production API Key",
  "tier": "pro",
  "tokensPerWindow": 1000,
  "refillRate": 100,
  "maxBurst": 1000
}

Response:
{
  "success": true,
  "data": {
    "apiKey": "sk_a1b2c3d4e5f6...",
    "name": "Production API Key",
    "tier": "pro",
    "tokensPerWindow": 1000,
    "refillRate": 100,
    "maxBurst": 1000,
    "enabled": true,
    "createdAt": "2026-02-05T10:00:00Z"
  }
}
```

#### List All API Keys

```bash
GET /api/admin/keys
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "apiKey": "sk_abc123...",
      "name": "Test Key",
      "tier": "free",
      "tokens": 45.5,
      "tokensPerWindow": 100,
      "enabled": "true"
    },
    ...
  ]
}
```

#### Get Specific API Key

```bash
GET /api/admin/keys/:apiKey
Authorization: Bearer $TOKEN

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys/sk_abc123...
```

#### Update API Key

```bash
PUT /api/admin/keys/:apiKey
Authorization: Bearer $TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "tokensPerWindow": 500,
  "enabled": true
}

Response:
{
  "success": true,
  "data": {
    "apiKey": "sk_abc123...",
    "name": "Updated Name",
    "tokensPerWindow": 500,
    ...
  }
}
```

#### Delete API Key

```bash
DELETE /api/admin/keys/:apiKey
Authorization: Bearer $TOKEN

curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys/sk_abc123...

Response:
{
  "success": true,
  "message": "API key deleted"
}
```

#### Reset Tokens

```bash
POST /api/admin/keys/:apiKey/reset
Authorization: Bearer $TOKEN

# Reset tokens to full capacity
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys/sk_abc123.../reset

Response:
{
  "success": true,
  "data": {
    "success": true,
    "tokens": 100
  }
}
```

#### Get API Key Statistics

```bash
GET /api/admin/keys/stats
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": {
    "totalKeys": 15,
    "enabledKeys": 12,
    "disabledKeys": 3,
    "tierCounts": {
      "free": 10,
      "pro": 4,
      "enterprise": 1
    }
  }
}
```

---

### Monitoring & Analytics

#### Check All Services Health

```bash
GET /api/admin/monitoring/health
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": [
    {
      "name": "Rate Limiter",
      "port": 3002,
      "status": "healthy",
      "responseTime": "5ms"
    },
    {
      "name": "Analytics",
      "port": 3003,
      "status": "healthy",
      "responseTime": "3ms"
    },
    {
      "name": "API Gateway",
      "port": 3000,
      "status": "healthy",
      "responseTime": "4ms"
    }
  ]
}
```

#### Get System Metrics

```bash
GET /api/admin/monitoring/metrics
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": {
    "unique_api_keys": 15,
    "total_requests": 154230,
    "total_rate_limited": 3420,
    "avg_response_time": 142,
    "first_request_at": "2026-01-10T08:00:00Z",
    "last_request_at": "2026-02-05T10:30:00Z"
  }
}
```

#### Get Dashboard (Everything at Once)

```bash
GET /api/admin/monitoring/dashboard
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": {
    "services": [...],      // All services health
    "metrics": {...},       // System metrics
    "topRateLimited": [...], // Top 5 rate-limited keys
    "timeSeries": [...],    // Last 24 hours data
    "timestamp": "2026-02-05T10:30:00Z"
  }
}
```

#### Get Time-Series Data

```bash
GET /api/admin/monitoring/time-series?hours=24&interval=hour
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": [
    {
      "time_bucket": "2026-02-05T09:00:00Z",
      "request_count": 450,
      "rate_limited_count": 23,
      "avg_response_time": 135
    },
    ...
  ]
}
```

#### Get Endpoint Analytics

```bash
GET /api/admin/monitoring/endpoints
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": [
    {
      "endpoint": "/api/users",
      "method": "GET",
      "total_requests": 5000,
      "avg_response_time_ms": 120.5
    },
    ...
  ]
}
```

#### Get Top Rate-Limited Keys

```bash
GET /api/admin/monitoring/top-rate-limited?limit=10
Authorization: Bearer $TOKEN

Response:
{
  "success": true,
  "data": [
    {
      "api_key": "sk_abusive123...",
      "total_rate_limited": 1523,
      "total_requests": 2000,
      "rate_limit_percentage": 76.15
    },
    ...
  ]
}
```

---

## Usage Examples

### Complete Workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3004/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. Create a new API key
NEW_KEY=$(curl -s -X POST http://localhost:3004/api/admin/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New App",
    "tier": "pro",
    "tokensPerWindow": 500,
    "refillRate": 50,
    "maxBurst": 500
  }' | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

echo "New API Key: $NEW_KEY"

# 3. List all keys
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys

# 4. Check system health
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/monitoring/health

# 5. Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/monitoring/dashboard

# 6. Update the key
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokensPerWindow": 1000}' \
  http://localhost:3004/api/admin/keys/$NEW_KEY

# 7. Reset tokens
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys/$NEW_KEY/reset
```

## Integration with Other Services

The Admin Service connects to:

1. **Redis** - Directly manages API keys and rate limit configurations
2. **PostgreSQL** - Reads analytics data
3. **Rate Limiter Service** - Monitors health
4. **Analytics Service** - Fetches reports and metrics
5. **API Gateway** - Checks health status

## Security Notes

⚠️ **Important for Production:**

1. Change default admin credentials in `.env`
2. Use strong JWT secret
3. Enable HTTPS
4. Add rate limiting for login endpoint
5. Implement proper user management (database-backed)
6. Add role-based access control (RBAC)
7. Log all admin actions
8. Add IP whitelisting

## Troubleshooting

### Cannot login

```
Error: Invalid credentials
```

**Solution:** Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`

### Cannot connect to Redis

```
Error: Redis client not connected
```

**Solution:**

1. Check if Redis is running: `redis-cli ping`
2. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`

### Services show as unhealthy

```
status: "unhealthy"
```

**Solution:** Make sure all services are running:

```bash
cd /home/unais/Desktop/Ratelimiter
./start-all-services.sh
```

## Next Steps

You've now completed all 5 microservices! 🎉

**Your Complete Platform:**

1. ✅ Backend Service (3001) - Protected APIs
2. ✅ Rate Limiter Service (3002) - Token bucket algorithm
3. ✅ API Gateway (3000) - Entry point
4. ✅ Usage Analytics Service (3003) - Metrics & logging
5. ✅ Admin Service (3004) - Control panel

**What you can do now:**

- Create API keys for different tiers (free, pro, enterprise)
- Monitor real-time system health
- View usage analytics and patterns
- Manage rate limits dynamically
- Track which users are hitting limits
- Generate reports for billing

**Optional Enhancements:**

- Build a web UI dashboard (React/Vue)
- Add webhook notifications for alerts
- Implement billing integration
- Add API key rotation
- Create audit logs
- Add backup/restore functionality
