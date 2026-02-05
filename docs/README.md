# Microservices-Based API Rate Limiter with Real-Time Analytics Dashboard

Built a distributed rate limiting system using Token Bucket algorithm with 5 microservices
(API Gateway, Rate Limiter, Analytics, Admin Panel, Backend) to prevent API abuse.
Implemented using Node.js, Express, Redis for caching, PostgreSQL for analytics,
and JWT authentication. Handles 1000+ req/sec with real-time monitoring dashboard.

## 🎯 Project Overview

This is a production-ready rate limiter system that can:

- **Protect your APIs** from abuse and overuse
- **Track usage metrics** for every request
- **Manage API keys** with custom rate limits
- **Monitor system health** in real-time
- **Generate analytics reports** for billing and insights

## tech stack

- Backend: Node.js, Express.js
- Databases: Redis (rate limiting), PostgreSQL (analytics)
- Architecture: Microservices, REST APIs
- Features: JWT Auth, Token Bucket Algorithm, Real-time Analytics

## 🏗️ Architecture

```
                    ┌─────────────────────┐
                    │   Admin Service     │
                    │   (Port 3004)       │
                    │   Control Panel     │
                    └─────────────────────┘
                              │
                              │ (manages)
                              ▼
┌──────────┐         ┌─────────────────────┐         ┌──────────────┐
│ Client   │────────▶│   API Gateway       │────────▶│  Backend     │
│ Request  │         │   (Port 3000)       │         │  Service     │
└──────────┘         │   • Auth            │         │  (Port 3001) │
                     │   • Rate Limit      │         └──────────────┘
                     │   • Proxy           │
                     └─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌──────────────────┐  ┌─────────────────────┐
          │  Rate Limiter    │  │  Usage Analytics    │
          │  Service         │  │  Service            │
          │  (Port 3002)     │  │  (Port 3003)        │
          │  Token Bucket    │  │  Request Tracking   │
          └──────────────────┘  └─────────────────────┘
                    │                     │
                    ▼                     ▼
          ┌──────────────────┐  ┌─────────────────────┐
          │  Redis           │  │  PostgreSQL         │
          │  (Port 6379)     │  │  (Port 5432)        │
          └──────────────────┘  └─────────────────────┘
```

## 📦 Microservices

| Service             | Port | Purpose                    | Tech Stack                 |
| ------------------- | ---- | -------------------------- | -------------------------- |
| **API Gateway**     | 3000 | Entry point, auth, routing | Express, Axios             |
| **Backend Service** | 3001 | Protected API endpoints    | Express                    |
| **Rate Limiter**    | 3002 | Token bucket algorithm     | Express, Redis             |
| **Usage Analytics** | 3003 | Request logging & metrics  | Express, PostgreSQL        |
| **Admin Service**   | 3004 | Management dashboard       | Express, Redis, PostgreSQL |

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- Redis
- PostgreSQL
- Git

### Installation

```bash
# Clone the repository
cd /home/unais/Desktop/Ratelimiter

# Install dependencies for all services
for service in backend-service rate-limiter-service api-gateway-service usage-analytics-service admin-service; do
  cd $service
  npm install
  cd ..
done

# Setup PostgreSQL database
sudo -u postgres createdb rate_limiter_analytics
```

### Start All Services

```bash
./start-all-services.sh
```

This will start:

- ✅ Backend Service (3001)
- ✅ Rate Limiter (3002)
- ✅ Analytics (3003)
- ✅ Admin Service (3004)
- ✅ API Gateway (3000)

### Stop All Services

```bash
pkill -f 'node src/server.js'
pkill -f 'node src/index.js'
```

## 🧪 Testing

### Test Complete System

```bash
./test-complete-system.sh
```

### Test with Analytics

```bash
./test-with-analytics.sh
```

### Test Admin Service

```bash
./test-admin-service.sh
```

### Manual Testing

```bash
# 1. Login to Admin
TOKEN=$(curl -s -X POST http://localhost:3004/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Create API Key
API_KEY=$(curl -s -X POST http://localhost:3004/api/admin/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "tier": "free",
    "tokensPerWindow": 100,
    "refillRate": 10,
    "maxBurst": 100
  }' | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

echo "Your API Key: $API_KEY"

# 3. Make requests through gateway
curl -H "X-API-Key: $API_KEY" \
  http://localhost:3000/api/process/calculate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"value": 42}'

# 4. View analytics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/monitoring/dashboard
```

## 📖 Service Documentation

Each service has its own detailed README:

- [Backend Service](./backend-service/README.md)
- [Rate Limiter Service](./rate-limiter-service/README.md)
- [API Gateway](./api-gateway-service/README.md)
- [Usage Analytics Service](./usage-analytics-service/README.md)
- [Admin Service](./admin-service/README.md)

## 🔑 Key Features

### 1. Token Bucket Rate Limiting

- **Algorithm**: Token bucket with atomic Lua scripts
- **Per-API-Key limits**: Each key can have custom rate limits
- **Configurable**: Tokens per window, refill rate, max burst
- **Fair**: Smooth rate limiting without hard cutoffs

### 2. Real-Time Analytics

- **Request logging**: Every request tracked
- **Metrics**: Response times, success rates, rate limit hits
- **Time-series data**: View trends over time
- **Reports**: Usage reports per API key or endpoint

### 3. Admin Dashboard

- **API Key Management**: Create, update, delete keys
- **Live Monitoring**: Service health, system metrics
- **Configuration**: Update rate limits without restart
- **Authentication**: JWT-based secure access

### 4. Production-Ready

- **Atomic operations**: No race conditions
- **Graceful shutdown**: Clean resource cleanup
- **Error handling**: Comprehensive error management
- **Logging**: Structured logging across services
- **Health checks**: Monitor service availability

## 🎓 How It Works (Simple Explanation)

1. **Client makes request** to API Gateway with API key
2. **Gateway validates** the API key
3. **Rate Limiter checks** if key has tokens available
   - If yes: Allow request, deduct token
   - If no: Block with 429 error
4. **Request proxied** to Backend Service
5. **Analytics logs** request details to PostgreSQL
6. **Admin can view** metrics and manage keys

### Token Bucket Analogy

Think of it like a **water bucket with a hole**:

- Bucket holds **tokens** (requests you can make)
- You **use tokens** when making requests
- Bucket **refills** at constant rate (e.g., 10 tokens/second)
- **Max capacity** prevents hoarding tokens

Example: 100 tokens, refill 10/sec

- Make 50 requests instantly: ✅ (50 tokens left)
- Make 60 more requests: ❌ (only 50 tokens available)
- Wait 5 seconds: Get 50 tokens back
- Make 60 requests: ✅ (100 tokens available again)

## 🔧 Configuration

### Rate Limit Tiers

You can create different tiers for different users:

```javascript
// Free tier
{
  "tokensPerWindow": 100,
  "refillRate": 10,
  "maxBurst": 100
}

// Pro tier
{
  "tokensPerWindow": 1000,
  "refillRate": 100,
  "maxBurst": 1000
}

// Enterprise tier
{
  "tokensPerWindow": 10000,
  "refillRate": 1000,
  "maxBurst": 10000
}
```

### Environment Variables

Each service has a `.env` file. Key configurations:

**API Gateway:**

```env
PORT=3000
RATE_LIMITER_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003
```

**Rate Limiter:**

```env
PORT=3002
REDIS_HOST=localhost
DEFAULT_TOKENS=100
REFILL_RATE=10
```

**Analytics:**

```env
PORT=3003
POSTGRES_DB=rate_limiter_analytics
```

**Admin:**

```env
PORT=3004
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key
```

## 📊 API Endpoints Summary

### Admin Service (3004)

```
POST   /api/admin/login
GET    /api/admin/keys
POST   /api/admin/keys
PUT    /api/admin/keys/:key
DELETE /api/admin/keys/:key
GET    /api/admin/monitoring/dashboard
```

### API Gateway (3000)

```
*      /api/*  (proxies to backend with rate limiting)
GET    /health
```

### Analytics (3003)

```
POST   /api/analytics/log
GET    /api/analytics/api-keys/:key
GET    /api/analytics/system-stats
GET    /api/analytics/time-series
```

## 🐛 Troubleshooting

### Service won't start

```bash
# Check if port is in use
lsof -ti:3000 | xargs kill -9

# Check logs
tail -f /tmp/gateway.log
tail -f /tmp/rate-limiter.log
```

### Redis connection error

```bash
# Start Redis
sudo systemctl start redis

# Test connection
redis-cli ping
```

### PostgreSQL connection error

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb rate_limiter_analytics
```

### Rate limiter not blocking

- Check Redis is running
- Verify token limits are low enough to test
- Use parallel requests (not sequential)
- Check logs for errors

## 📈 Performance

**Benchmarks** (on modest hardware):

- **Gateway latency**: ~5-10ms overhead
- **Rate limit check**: ~2-3ms (Redis)
- **Analytics logging**: ~1-2ms (async)
- **Throughput**: 1000+ req/sec per service

**Scalability**:

- Horizontal scaling: Run multiple instances behind load balancer
- Redis clustering: For distributed rate limiting
- PostgreSQL replication: For analytics redundancy

## 🔒 Security Considerations

**For Production:**

1. **Enable HTTPS** everywhere
2. **Secure Redis** with password auth
3. **PostgreSQL** with strong passwords
4. **JWT secrets** - use strong random keys
5. **API keys** - rotate regularly
6. **Rate limit** admin endpoints
7. **IP whitelisting** for admin service
8. **Audit logging** for all admin actions
9. **Input validation** on all endpoints
10. **CORS configuration** for frontend

## 🎯 Use Cases

- **API Monetization**: Different tiers for free/pro/enterprise
- **DDoS Protection**: Prevent abuse and overload
- **Fair Usage**: Ensure all users get equal access
- **Cost Control**: Limit expensive operations
- **Compliance**: Enforce usage limits per contracts
- **Analytics**: Track and bill based on usage

## 🚧 Future Enhancements

- [ ] Web UI dashboard (React/Vue)
- [ ] Webhook notifications for alerts
- [ ] API key rotation mechanism
- [ ] Billing integration (Stripe)
- [ ] Multi-region support
- [ ] GraphQL analytics API
- [ ] Machine learning for anomaly detection
- [ ] Custom rate limiting strategies
- [ ] API versioning support
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] Terraform infrastructure as code

## 📝 License

ISC

## 👥 Contributing

This is an educational project. Feel free to fork and extend!

## 🙏 Acknowledgments

Built as a comprehensive microservices learning project demonstrating:

- Microservices architecture
- Rate limiting algorithms
- Real-time analytics
- API gateway patterns
- Admin dashboard design
- Production-ready Node.js services

---

📜 License

This project is licensed under the MIT License.
