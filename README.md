# 🚀 API Rate Limiter - Microservices Project

A production-ready API Rate Limiter system built with microservices architecture, featuring a Token Bucket algorithm, real-time analytics, and a modern React/Next.js dashboard.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Services](#services)
- [Development](#development)
- [Technologies](#technologies)
- [Features](#features)

## 🏗️ Architecture Overview

This project consists of **6 services** working together:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Next.js Dashboard)                       │
│                        Port: 3000                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│            (Request Routing + Rate Limiting)                 │
│                        Port: 3000                            │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ↓                    ↓                    ↓
┌────────────────┐  ┌────────────────┐  ┌────────────────────┐
│  Rate Limiter  │  │ Admin Service  │  │ Usage Analytics    │
│   (Redis +     │  │ (API Keys +    │  │ (Logs + Metrics)   │
│ Token Bucket)  │  │  Auth)         │  │                    │
│   Port: 3002   │  │  Port: 3004    │  │   Port: 3003       │
└────────────────┘  └────────────────┘  └────────────────────┘
                              │
                              ↓
                    ┌────────────────┐
                    │ Backend Service│
                    │ (Protected API)│
                    │   Port: 3001   │
                    └────────────────┘
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** (for Admin & Analytics services)
- **Redis** (for Rate Limiter)

### Option 1: Run All Services (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/unais-08/rate-limiter-microservices.git
cd rate-limiter-microservices

# 2. Install concurrently (for running all services)
npm install

# 3. Install dependencies for all services
npm run install:all

# 4. Setup databases (PostgreSQL & Redis must be running)
# Follow database setup in each service's README

# 5. Run all services in development mode
npm run dev
```

This will start all 6 services with color-coded output:

- 🔵 **Admin Service** on port 3004
- 🟣 **API Gateway** on port 3000
- 🔵 **Rate Limiter** on port 3002
- 🟢 **Analytics** on port 3003
- 🟡 **Backend** on port 3001
- 🔴 **Frontend** on port 3000 (Next.js)

### Option 2: VS Code Tasks (Separate Terminals)

1. Open the project in VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type `Tasks: Run Task`
4. Select `🚀 Start All Services`

This will open each service in its own dedicated terminal panel.

### Option 3: Manual Start (Individual Services)

```bash
# Terminal 1 - Admin Service
cd rate-limit-microservices/admin-service
npm install
npm run dev

# Terminal 2 - API Gateway
cd rate-limit-microservices/api-gateway-service
npm install
npm run dev

# Terminal 3 - Rate Limiter
cd rate-limit-microservices/rate-limiter-service
npm install
npm run dev

# Terminal 4 - Analytics
cd rate-limit-microservices/usage-analytics-service
npm install
npm run dev

# Terminal 5 - Backend
cd backend-service
npm install
npm run dev

# Terminal 6 - Frontend
cd frontend
npm install
npm run dev
```

## 🎯 Services

### 1. Frontend (Next.js Dashboard)

**Port:** 3000 (Next.js dev server)  
**Tech:** Next.js 14, React, TypeScript, Tailwind CSS, Recharts, Axios

**Features:**

- API Key Management (CRUD operations)
- Real-time Usage Analytics with charts
- System Monitoring Dashboard
- API Rate Limit Simulator
- Clean, interview-ready UI

**Location:** `/frontend`

### 2. API Gateway

**Port:** 3000 (Express)  
**Tech:** Node.js, Express, TypeScript

**Responsibilities:**

- Single entry point for all API requests
- API Key validation (with Redis caching)
- Rate limit enforcement (calls Rate Limiter service)
- Request proxying to Backend service
- Analytics logging (async)

**Location:** `/rate-limit-microservices/api-gateway-service`

### 3. Admin Service

**Port:** 3004  
**Tech:** Node.js, Express, TypeScript, Prisma, PostgreSQL

**Responsibilities:**

- API Key management (Create, Read, Update, Delete)
- User authentication (JWT)
- Rate limit configuration
- System monitoring endpoints

**Location:** `/rate-limit-microservices/admin-service`

### 4. Rate Limiter Service

**Port:** 3002  
**Tech:** Node.js, Express, TypeScript, Redis

**Responsibilities:**

- Token Bucket algorithm implementation
- Rate limit checks (sync)
- Token consumption and refill
- Redis-based state management

**Location:** `/rate-limit-microservices/rate-limiter-service`

### 5. Usage Analytics Service

**Port:** 3003  
**Tech:** Node.js, Express, TypeScript, Prisma, PostgreSQL

**Responsibilities:**

- Request logging (from API Gateway)
- Time-series data aggregation
- API key metrics calculation
- Endpoint analytics
- Dashboard data provision

**Location:** `/rate-limit-microservices/usage-analytics-service`

### 6. Backend Service

**Port:** 3001  
**Tech:** Node.js, Express

**Responsibilities:**

- Protected API endpoints (users, orders, products)
- Simulates a real backend API
- Used for testing rate limits

**Location:** `/backend-service`

## 💻 Development

### Available Scripts

```bash
# Run all services
npm run dev

# Install dependencies for all services
npm run install:all

# Build all services
npm run build:all

# Run individual service
npm run dev:admin      # Admin Service
npm run dev:gateway    # API Gateway
npm run dev:ratelimiter # Rate Limiter
npm run dev:analytics  # Analytics Service
npm run dev:backend    # Backend Service
npm run dev:frontend   # Frontend
```

### Environment Variables

Each service requires its own `.env` file. See individual service READMEs for details.

**Key Environment Files:**

- `/rate-limit-microservices/admin-service/.env`
- `/rate-limit-microservices/api-gateway-service/.env`
- `/rate-limit-microservices/rate-limiter-service/.env`
- `/rate-limit-microservices/usage-analytics-service/.env`
- `/backend-service/.env`
- `/frontend/.env.local`

### Database Setup

**PostgreSQL (Admin & Analytics):**

```bash
# Admin Service
cd rate-limit-microservices/admin-service
npx prisma migrate dev
npx prisma generate

# Analytics Service
cd rate-limit-microservices/usage-analytics-service
npx prisma migrate dev
npx prisma generate
```

**Redis (Rate Limiter):**

```bash
# Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine

# Or use local Redis installation
redis-server
```

## 🛠️ Technologies

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM for PostgreSQL
- **Redis** - In-memory data store
- **Axios** - HTTP client
- **JWT** - Authentication

### Frontend

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Infrastructure

- **PostgreSQL** - Relational database
- **Redis** - Cache & rate limiting state

## ✨ Features

### Rate Limiting

- **Token Bucket Algorithm** - Industry-standard rate limiting
- **Configurable Limits** - Per API key configuration
- **Burst Support** - Handle traffic spikes
- **Redis-backed** - Fast, distributed state management

### Analytics

- **Real-time Metrics** - Live request tracking
- **Time-series Data** - Historical analysis
- **Per-key Analytics** - Individual API key insights
- **Endpoint Metrics** - Performance by endpoint

### Dashboard

- **Modern UI** - Clean, professional design
- **Interactive Charts** - Line, bar, pie charts
- **Filters** - Time range and API key filters
- **Simulator** - Test rate limits in real-time
- **Responsive** - Works on all devices

### Security

- **JWT Authentication** - Secure admin access
- **API Key Validation** - Cached for performance
- **CORS Configuration** - Controlled access
- **Input Validation** - Request sanitization

## 📊 Data Flow

### Request Flow

```
1. Client → API Gateway (with X-API-Key header)
2. Gateway → Validate API Key (Redis cache or Admin Service)
3. Gateway → Check Rate Limit (Rate Limiter Service)
4. Gateway → Proxy to Backend (if allowed)
5. Gateway → Log to Analytics (async)
6. Gateway → Return Response
```

### Rate Limit Check

```
1. Extract API key from request
2. Query Redis for token bucket state
3. Calculate available tokens based on refill rate
4. Consume 1 token if available
5. Return allow/deny decision
6. Update bucket state in Redis
```

## 🎓 Learning & Interview Points

This project demonstrates:

- **Microservices Architecture** - Service separation, API design
- **Distributed Systems** - Inter-service communication
- **Rate Limiting Algorithms** - Token bucket implementation
- **Database Design** - Prisma schema, indexing
- **Caching Strategies** - Redis for performance
- **Real-time Analytics** - Time-series data aggregation
- **Full-stack Development** - Backend + Frontend
- **TypeScript** - Type-safe development
- **RESTful APIs** - Best practices
- **Error Handling** - Graceful degradation

## 📝 API Endpoints

### Admin Service (3004)

- `POST /api/v1/admin/login` - Authentication
- `GET /api/v1/admin/keys` - List API keys
- `POST /api/v1/admin/keys` - Create API key
- `PUT /api/v1/admin/keys/:key` - Update API key
- `DELETE /api/v1/admin/keys/:key` - Delete API key

### API Gateway (3000)

- `ALL /api/*` - Proxied requests (rate-limited)

### Analytics Service (3003)

- `GET /api/v1/analytics/system-stats` - System statistics
- `GET /api/v1/analytics/time-series` - Time-series data
- `GET /api/v1/analytics/api-keys/:key` - Per-key analytics

### Rate Limiter Service (3002)

- `POST /api/v1/ratelimit/check` - Check rate limit (internal)

### Backend Service (3001)

- `GET /api/v1/users` - Get users
- `GET /api/v1/orders` - Get orders
- `GET /api/v1/products` - Get products

## 🐛 Troubleshooting

### Services won't start

- Check if PostgreSQL and Redis are running
- Verify environment variables are set
- Check if ports are already in use

### Database errors

- Run Prisma migrations: `npx prisma migrate dev`
- Check database connection strings

### Redis connection errors

- Verify Redis is running: `redis-cli ping`
- Check Redis connection string

### Frontend can't connect

- Ensure all backend services are running
- Check CORS configuration
- Verify API URLs in `.env.local`

## 📚 Documentation

Detailed documentation for each service:

- [Frontend README](./frontend/FRONTEND_README.md)
- [Admin Service](./rate-limit-microservices/admin-service/README.md)
- [API Gateway](./rate-limit-microservices/api-gateway-service/README.md)
- [Rate Limiter](./rate-limit-microservices/rate-limiter-service/README.md)
- [Analytics Service](./rate-limit-microservices/usage-analytics-service/README.md)

## 🤝 Contributing

This is a learning project. Feel free to:

- Report issues
- Suggest improvements
- Submit pull requests

## 📄 License

MIT License - see LICENSE.md

## 👤 Author

**unais-08**

- GitHub: [@unais-08](https://github.com/unais-08)

---

**Built for learning, interviews, and production readiness** 🚀
