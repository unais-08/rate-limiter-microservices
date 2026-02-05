# Rate Limiter Microservices - API Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000` (API Gateway)  
**Authentication:** X-API-Key header (except Admin login)

---

## Table of Contents

1. [API Gateway](#api-gateway)
2. [Backend Service](#backend-service)
3. [Admin Service](#admin-service)
4. [Analytics Service](#analytics-service)
5. [Rate Limiter Service](#rate-limiter-service)
6. [Common Responses](#common-responses)

---

## API Gateway

**Base URL:** `http://localhost:3000`

All requests to protected backend endpoints must go through the API Gateway with a valid API key.

### Gateway Information

```http
GET /
```

**Response:**

```json
{
  "success": true,
  "message": "API Gateway Service",
  "version": "1.0.0",
  "description": "Centralized API gateway with rate limiting",
  "usage": {
    "authentication": "Include X-API-Key header in your requests",
    "example": "curl -H 'X-API-Key: your_key_here' http://gateway/api/v1/users/123"
  },
  "endpoints": {
    "backend": "/api/*",
    "health": "/health"
  }
}
```

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "service": "api-gateway-service",
  "status": "healthy",
  "timestamp": "2026-02-05T07:16:51.498Z",
  "uptime": 123.45
}
```

### Rate Limit Headers

All proxied requests include rate limit information in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 45
```

---

## Backend Service

**Direct URL:** `http://localhost:3001/api/v1`  
**Via Gateway:** `http://localhost:3000/api/v1` ⭐ (Recommended)

> **Note:** All backend endpoints should be accessed through the API Gateway for rate limiting and analytics.

### Users

#### Get All Users

```http
GET /api/v1/users
```

**Headers:**

```
X-API-Key: your_api_key_here
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com"
      },
      {
        "id": 2,
        "name": "Bob",
        "email": "bob@example.com"
      },
      {
        "id": 3,
        "name": "Charlie",
        "email": "charlie@example.com"
      }
    ],
    "count": 3
  }
}
```

**Use Case:** Testing rate limiting, user listing for applications.

**cURL Example:**

```bash
curl -H "X-API-Key: sk_2e04973a51d2d923d6416c568a6a39e47ef2d0ba2725a6fd" \
  http://localhost:3000/api/v1/users
```

---

#### Get User by ID

```http
GET /api/v1/users/:userId
```

**Headers:**

```
X-API-Key: your_api_key_here
```

**Path Parameters:**

- `userId` (string, required) - User ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "userId": "123",
    "message": "User data retrieved successfully",
    "timestamp": "2026-02-05T07:30:00.000Z",
    "userData": {
      "id": "123",
      "profile": "User profile data"
    }
  }
}
```

**Response:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

**Use Case:** Retrieve detailed information for a specific user.

**cURL Example:**

```bash
curl -H "X-API-Key: your_api_key_here" \
  http://localhost:3000/api/v1/users/123
```

---

### Data Processing

#### Process Data

```http
POST /api/v1/process
```

**Headers:**

```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body:**

```json
{
  "data": "your data to process",
  "type": "text",
  "options": {
    "format": "json"
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Data processed successfully",
    "processedData": {
      "input": "your data to process",
      "result": "processed result",
      "timestamp": "2026-02-05T07:30:00.000Z"
    }
  }
}
```

**Response:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "No data provided",
    "statusCode": 400
  }
}
```

**Use Case:** Process text, images, or any data through backend pipeline.

**cURL Example:**

```bash
curl -X POST \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"data": "sample text", "type": "text"}' \
  http://localhost:3000/api/v1/process
```

---

### Resources

#### List Resources

```http
GET /api/v1/resources
```

**Headers:**

```
X-API-Key: your_api_key_here
```

**Query Parameters:**

- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 10)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "res_001",
        "name": "Resource 1",
        "type": "document",
        "createdAt": "2026-02-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
}
```

**Use Case:** List all available resources with pagination support.

---

#### Create Resource

```http
POST /api/v1/resources
```

**Headers:**

```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "New Resource",
  "type": "document",
  "description": "Resource description",
  "metadata": {
    "category": "general"
  }
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "resource": {
      "id": "res_002",
      "name": "New Resource",
      "type": "document",
      "description": "Resource description",
      "createdAt": "2026-02-05T07:30:00.000Z"
    },
    "message": "Resource created successfully"
  }
}
```

**Response:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Resource name is required",
    "statusCode": 400
  }
}
```

**Use Case:** Create new resource entries in the system.

---

#### Update Resource

```http
PUT /api/v1/resources/:resourceId
```

**Headers:**

```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Path Parameters:**

- `resourceId` (string, required) - Resource ID

**Request Body:**

```json
{
  "name": "Updated Resource Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "resource": {
      "id": "res_002",
      "name": "Updated Resource Name",
      "description": "Updated description",
      "updatedAt": "2026-02-05T07:30:00.000Z"
    },
    "message": "Resource updated successfully"
  }
}
```

**Use Case:** Update existing resource information.

---

#### Delete Resource

```http
DELETE /api/v1/resources/:resourceId
```

**Headers:**

```
X-API-Key: your_api_key_here
```

**Path Parameters:**

- `resourceId` (string, required) - Resource ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Resource deleted successfully",
    "resourceId": "res_002"
  }
}
```

**Response:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "statusCode": 404
  }
}
```

**Use Case:** Remove resources from the system.

---

## Admin Service

**Base URL:** `http://localhost:3004/api/v1/admin`  
**Authentication:** JWT Bearer Token (except login endpoint)

### Authentication

#### Login

```http
POST /api/v1/admin/login
```

**Request Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**Response:** `401 Unauthorized`

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Use Case:** Authenticate admin users to access protected admin endpoints.

**cURL Example:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  http://localhost:3004/api/v1/admin/login
```

---

### API Key Management

All API key endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Create API Key

```http
POST /api/v1/admin/keys
```

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "My Application",
  "description": "API key for production app",
  "rateLimit": 100,
  "expiresIn": "30d"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "apiKey": "sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "name": "My Application",
    "description": "API key for production app",
    "rateLimit": 100,
    "createdAt": "2026-02-05T07:30:00.000Z",
    "expiresAt": "2026-03-07T07:30:00.000Z",
    "status": "active"
  }
}
```

**Use Case:** Generate new API keys for applications or users with custom rate limits.

**cURL Example:**

```bash
curl -X POST \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","rateLimit":50}' \
  http://localhost:3004/api/v1/admin/keys
```

---

#### List All API Keys

```http
GET /api/v1/admin/keys
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `status` (string, optional) - Filter by status: `active`, `inactive`, `expired`
- `page` (integer, optional) - Page number
- `limit` (integer, optional) - Items per page

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "apiKey": "sk_a1b2c3d4...",
        "name": "My Application",
        "status": "active",
        "rateLimit": 100,
        "requestCount": 1523,
        "createdAt": "2026-02-05T07:30:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

**Use Case:** View all API keys with their usage statistics and status.

---

#### Get API Key Details

```http
GET /api/v1/admin/keys/:apiKey
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `apiKey` (string, required) - API Key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "apiKey": "sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "name": "My Application",
    "description": "API key for production app",
    "status": "active",
    "rateLimit": 100,
    "requestCount": 1523,
    "rateLimitedCount": 12,
    "createdAt": "2026-02-05T07:30:00.000Z",
    "lastUsed": "2026-02-05T09:15:00.000Z",
    "currentTokens": 85
  }
}
```

**Use Case:** Get detailed information and usage stats for a specific API key.

---

#### Update API Key

```http
PUT /api/v1/admin/keys/:apiKey
```

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**

- `apiKey` (string, required) - API Key

**Request Body:**

```json
{
  "name": "Updated App Name",
  "status": "inactive",
  "rateLimit": 200,
  "description": "Updated description"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "apiKey": "sk_a1b2c3d4...",
    "name": "Updated App Name",
    "status": "inactive",
    "rateLimit": 200,
    "updatedAt": "2026-02-05T09:30:00.000Z"
  }
}
```

**Use Case:** Modify API key configuration, change rate limits, or deactivate keys.

---

#### Delete API Key

```http
DELETE /api/v1/admin/keys/:apiKey
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `apiKey` (string, required) - API Key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "API key deleted successfully",
    "apiKey": "sk_a1b2c3d4..."
  }
}
```

**Use Case:** Permanently revoke and delete an API key.

---

#### Reset API Key Tokens

```http
POST /api/v1/admin/keys/:apiKey/reset
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `apiKey` (string, required) - API Key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Tokens reset successfully",
    "apiKey": "sk_a1b2c3d4...",
    "tokensReset": true,
    "currentTokens": 100
  }
}
```

**Use Case:** Manually reset rate limit tokens for an API key (useful for testing or support).

---

#### Get API Key Statistics

```http
GET /api/v1/admin/keys/stats
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalKeys": 15,
    "activeKeys": 12,
    "inactiveKeys": 2,
    "expiredKeys": 1,
    "totalRequests": 50234,
    "totalRateLimited": 342,
    "averageRequestsPerKey": 3348.93
  }
}
```

**Use Case:** Get overview statistics of all API keys in the system.

---

### Monitoring

#### Get Services Health

```http
GET /api/v1/admin/monitoring/health
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "services": [
      {
        "name": "API Gateway",
        "status": "healthy",
        "url": "http://localhost:3000",
        "responseTime": 15,
        "uptime": "99.98%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      },
      {
        "name": "Backend Service",
        "status": "healthy",
        "url": "http://localhost:3001",
        "responseTime": 12,
        "uptime": "99.95%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      },
      {
        "name": "Rate Limiter Service",
        "status": "healthy",
        "url": "http://localhost:3002",
        "responseTime": 8,
        "uptime": "99.99%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      },
      {
        "name": "Analytics Service",
        "status": "healthy",
        "url": "http://localhost:3003",
        "responseTime": 18,
        "uptime": "99.97%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      },
      {
        "name": "Admin Service",
        "status": "healthy",
        "url": "http://localhost:3004",
        "responseTime": 10,
        "uptime": "100%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      },
      {
        "name": "Redis",
        "status": "healthy",
        "uptime": "100%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      },
      {
        "name": "PostgreSQL",
        "status": "healthy",
        "uptime": "100%",
        "lastCheck": "2026-02-05T09:30:00.000Z"
      }
    ],
    "overall": "healthy"
  }
}
```

**Use Case:** Monitor health status of all microservices and dependencies.

---

#### Get System Metrics

```http
GET /api/v1/admin/monitoring/metrics
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 50234,
      "last24h": 8234,
      "lastHour": 342
    },
    "rateLimit": {
      "violations": 342,
      "violationRate": 0.68
    },
    "performance": {
      "avgResponseTime": 45,
      "p95ResponseTime": 120,
      "p99ResponseTime": 250
    },
    "apiKeys": {
      "total": 15,
      "active": 12
    }
  }
}
```

**Use Case:** Get comprehensive system-wide performance metrics.

---

#### Get Dashboard Data

```http
GET /api/v1/admin/monitoring/dashboard
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 50234,
      "rateLimitViolations": 342,
      "activeApiKeys": 12,
      "avgResponseTime": 45
    },
    "recentActivity": [
      {
        "apiKey": "sk_a1b2c3d4...",
        "endpoint": "/api/v1/users",
        "method": "GET",
        "statusCode": 200,
        "timestamp": "2026-02-05T09:30:00.000Z"
      }
    ],
    "topEndpoints": [
      {
        "endpoint": "/api/v1/users",
        "count": 15234
      }
    ],
    "rateLimitedKeys": [
      {
        "apiKey": "sk_x1y2z3...",
        "violations": 45
      }
    ]
  }
}
```

**Use Case:** Get comprehensive dashboard data for admin interface.

---

#### Get Time Series Data

```http
GET /api/v1/admin/monitoring/time-series
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `hours` (integer, optional) - Number of hours (default: 24)
- `interval` (string, optional) - Interval: `minute`, `hour`, `day` (default: hour)
- `apiKey` (string, optional) - Filter by specific API key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "timeSeries": [
      {
        "timestamp": "2026-02-05T08:00:00.000Z",
        "requests": 342,
        "rateLimited": 12
      },
      {
        "timestamp": "2026-02-05T09:00:00.000Z",
        "requests": 389,
        "rateLimited": 8
      }
    ],
    "interval": "hour",
    "hours": 24
  }
}
```

**Use Case:** Generate time-series charts for request patterns and rate limiting.

---

#### Get Endpoint Analytics

```http
GET /api/v1/admin/monitoring/endpoints
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "path": "/api/v1/users",
        "method": "GET",
        "totalRequests": 15234,
        "avgResponseTime": 42,
        "errorRate": 0.5
      },
      {
        "path": "/api/v1/resources",
        "method": "GET",
        "totalRequests": 8234,
        "avgResponseTime": 38,
        "errorRate": 0.3
      }
    ]
  }
}
```

**Use Case:** Analyze endpoint usage patterns and performance.

---

#### Get Top Rate Limited Keys

```http
GET /api/v1/admin/monitoring/top-rate-limited
```

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `limit` (integer, optional) - Number of results (default: 10)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "apiKey": "sk_a1b2c3d4...",
        "name": "Heavy User App",
        "violations": 145,
        "totalRequests": 2341,
        "violationRate": 6.19
      }
    ]
  }
}
```

**Use Case:** Identify API keys that frequently hit rate limits for optimization.

---

## Analytics Service

**Base URL:** `http://localhost:3003/api/v1/analytics`  
**Authentication:** Internal service (typically called by API Gateway)

### Log Request

```http
POST /api/v1/analytics/log
```

**Request Body:**

```json
{
  "apiKey": "sk_a1b2c3d4...",
  "endpoint": "/api/v1/users",
  "method": "GET",
  "statusCode": 200,
  "responseTime": 45,
  "rateLimited": false,
  "timestamp": "2026-02-05T09:30:00.000Z"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "logged": true,
    "id": "log_12345"
  }
}
```

**Use Case:** Log API request for analytics (called automatically by API Gateway).

---

### Get All API Keys Analytics

```http
GET /api/v1/analytics/api-keys
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "apiKey": "sk_a1b2c3d4...",
        "totalRequests": 1523,
        "rateLimitedRequests": 12,
        "avgResponseTime": 42,
        "lastUsed": "2026-02-05T09:30:00.000Z"
      }
    ]
  }
}
```

**Use Case:** Get aggregated analytics for all API keys.

---

### Get Specific API Key Analytics

```http
GET /api/v1/analytics/api-keys/:apiKey
```

**Path Parameters:**

- `apiKey` (string, required) - API Key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "apiKey": "sk_a1b2c3d4...",
    "totalRequests": 1523,
    "rateLimitedRequests": 12,
    "successRate": 99.2,
    "avgResponseTime": 42,
    "topEndpoints": [
      {
        "endpoint": "/api/v1/users",
        "count": 834
      }
    ],
    "lastUsed": "2026-02-05T09:30:00.000Z"
  }
}
```

**Use Case:** Get detailed analytics for a specific API key.

---

### Get Endpoint Analytics

```http
GET /api/v1/analytics/endpoints
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "endpoint": "/api/v1/users",
        "method": "GET",
        "totalRequests": 15234,
        "avgResponseTime": 42,
        "successRate": 99.5
      }
    ]
  }
}
```

**Use Case:** Analyze endpoint performance and usage patterns.

---

### Get Time Series Data

```http
GET /api/v1/analytics/time-series
```

**Query Parameters:**

- `hours` (integer, optional) - Number of hours (default: 24)
- `interval` (string, optional) - minute/hour/day (default: hour)
- `apiKey` (string, optional) - Filter by API key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "timeSeries": [
      {
        "timestamp": "2026-02-05T08:00:00.000Z",
        "requests": 342,
        "rateLimited": 12,
        "avgResponseTime": 45
      }
    ]
  }
}
```

**Use Case:** Generate time-series charts for visualization.

---

### Get Top Rate Limited Keys

```http
GET /api/v1/analytics/top-rate-limited
```

**Query Parameters:**

- `limit` (integer, optional) - Number of results (default: 10)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "apiKey": "sk_a1b2c3d4...",
        "violations": 145,
        "totalRequests": 2341
      }
    ]
  }
}
```

**Use Case:** Identify problematic API keys hitting rate limits.

---

### Get System Statistics

```http
GET /api/v1/analytics/system-stats
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalRequests": 50234,
    "totalRateLimited": 342,
    "uniqueApiKeys": 15,
    "avgResponseTime": 45,
    "timeRange": {
      "start": "2026-02-04T09:30:00.000Z",
      "end": "2026-02-05T09:30:00.000Z"
    }
  }
}
```

**Use Case:** Get overall system statistics for monitoring.

---

## Rate Limiter Service

**Base URL:** `http://localhost:3002/api/v1/rate-limit`  
**Authentication:** Internal service (typically called by API Gateway)

### Check Rate Limit

```http
POST /api/v1/rate-limit/check
```

**Request Body:**

```json
{
  "apiKey": "sk_a1b2c3d4...",
  "endpoint": "/api/v1/users"
}
```

**Response:** `200 OK` (Allowed)

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "remaining": 9,
    "limit": 10,
    "resetIn": 45
  }
}
```

**Response:** `429 Too Many Requests` (Rate Limited)

```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "statusCode": 429,
    "retryAfter": 30
  },
  "data": {
    "allowed": false,
    "remaining": 0,
    "limit": 10,
    "resetIn": 30
  }
}
```

**Use Case:** Check if request is allowed (called by API Gateway middleware).

---

### Get Rate Limit Status

```http
GET /api/v1/rate-limit/status/:apiKey
```

**Path Parameters:**

- `apiKey` (string, required) - API Key

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "apiKey": "sk_a1b2c3d4...",
    "currentTokens": 8,
    "maxTokens": 10,
    "refillRate": 2,
    "nextRefill": 25
  }
}
```

**Use Case:** Check current rate limit status for an API key.

---

### Reset Rate Limit

```http
POST /api/v1/rate-limit/reset
```

**Request Body:**

```json
{
  "apiKey": "sk_a1b2c3d4..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Rate limit reset successfully",
    "apiKey": "sk_a1b2c3d4...",
    "currentTokens": 10
  }
}
```

**Use Case:** Manually reset rate limit tokens (admin operation).

---

### Set Custom Rate Limit

```http
POST /api/v1/rate-limit/custom-limit
```

**Request Body:**

```json
{
  "apiKey": "sk_a1b2c3d4...",
  "limit": 100,
  "refillRate": 5
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Custom rate limit set successfully",
    "apiKey": "sk_a1b2c3d4...",
    "limit": 100,
    "refillRate": 5
  }
}
```

**Use Case:** Set custom rate limits for specific API keys.

---

## Common Responses

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": {}
  }
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## Rate Limiting

**Algorithm:** Token Bucket  
**Default Limit:** 10 requests per 60 seconds  
**Refill Rate:** 2 tokens per second

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 10          # Maximum requests allowed
X-RateLimit-Remaining: 9       # Requests remaining
X-RateLimit-Reset: 45          # Seconds until tokens refill
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "statusCode": 429,
    "retryAfter": 30
  }
}
```

---

## Testing Examples

### Test Rate Limiting

```bash
#!/bin/bash
API_KEY="sk_2e04973a51d2d923d6416c568a6a39e47ef2d0ba2725a6fd"

for i in {1..15}; do
  echo "Request $i:"
  curl -H "X-API-Key: $API_KEY" http://localhost:3000/api/v1/users
  sleep 0.5
done
```

**Expected:** First 10 succeed (200), last 5 get rate limited (429).

---

## Postman Collection

Import these examples into Postman for quick testing:

1. **Create Environment:**
   - `gateway_url`: `http://localhost:3000`
   - `admin_url`: `http://localhost:3004`
   - `api_key`: `your_api_key_here`
   - `jwt_token`: `your_jwt_token_here`

2. **Common Headers:**
   - Backend requests: `X-API-Key: {{api_key}}`
   - Admin requests: `Authorization: Bearer {{jwt_token}}`

---

## Architecture Flow

```
Client Request
    ↓
API Gateway (Port 3000)
    ↓
[Validate API Key]
    ↓
Rate Limiter Service (Port 3002) ← Redis
    ↓
[Check Rate Limit]
    ↓
Analytics Service (Port 3003) ← PostgreSQL
    ↓
[Log Request]
    ↓
Backend Service (Port 3001)
    ↓
[Process Request]
    ↓
Response to Client
```

---

**Documentation Version:** 1.0.0  
**Last Updated:** February 5, 2026  
**Maintained By:** Rate Limiter Microservices Team
