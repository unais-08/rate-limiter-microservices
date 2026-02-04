# Usage Analytics Service

**Port:** 3003  
**Purpose:** Collects, stores, and analyzes API usage metrics from the API Gateway

## What This Service Does (Simple Explanation)

Think of this service as a **detailed logbook and statistics calculator** for your API:

1. **Records Every Request**: Every time someone uses your API through the gateway, this service writes down:
   - Who made the request (API key)
   - What endpoint they called
   - How long it took to respond
   - Whether they got blocked by rate limiting

2. **Stores Everything in PostgreSQL**: All this data is saved in a database so you can look back at history

3. **Provides Analytics Reports**: You can ask questions like:
   - "Which API key makes the most requests?"
   - "Which endpoint is slowest?"
   - "How many requests got blocked by rate limiting?"
   - "Show me request patterns over time"

## Architecture

```
┌─────────────┐
│ API Gateway │ ─────┐
└─────────────┘      │ (Logs every request)
                     │
                     ▼
           ┌──────────────────────┐
           │ Analytics Service    │
           │ (Port 3003)         │
           └──────────────────────┘
                     │
                     │ (Stores data)
                     ▼
           ┌──────────────────────┐
           │ PostgreSQL Database  │
           │ (Port 5432)         │
           └──────────────────────┘
```

## Database Schema

### request_logs

Stores every individual API request:

```sql
- id: Auto-increment primary key
- api_key: Which API key made the request
- endpoint: URL endpoint called
- method: HTTP method (GET, POST, etc.)
- status_code: Response status (200, 429, 500, etc.)
- response_time_ms: How long the request took
- rate_limit_hit: TRUE if request was blocked
- timestamp: When the request happened
```

### api_key_metrics

Aggregated statistics per API key:

```sql
- api_key: The API key
- total_requests: Total number of requests
- total_rate_limited: How many got blocked
- avg_response_time_ms: Average response time
- last_request_at: Most recent request time
```

### endpoint_metrics

Aggregated statistics per endpoint:

```sql
- endpoint: The URL endpoint
- method: HTTP method
- total_requests: Total number of requests
- avg_response_time_ms: Average response time
- last_request_at: Most recent request time
```

## Prerequisites

### 1. Install PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql shell:
CREATE DATABASE rate_limiter_analytics;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE rate_limiter_analytics TO postgres;
\q
```

Or simply:

```bash
sudo -u postgres createdb rate_limiter_analytics
```

## Installation

```bash
cd usage-analytics-service
npm install
```

## Configuration

Edit `.env` file:

```env
PORT=3003
NODE_ENV=development

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=rate_limiter_analytics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

SERVICE_NAME=usage-analytics-service
```

## Running the Service

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The service will:

1. Connect to PostgreSQL
2. Automatically create all necessary tables (if they don't exist)
3. Start listening on port 3003

## API Endpoints

### 1. Log a Request (Called by API Gateway)

```bash
POST /api/analytics/log

Request Body:
{
  "apiKey": "test-api-key-12345",
  "endpoint": "/api/users",
  "method": "GET",
  "statusCode": 200,
  "responseTimeMs": 145,
  "rateLimitHit": false
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "api_key": "test-api-key-12345",
    "endpoint": "/api/users",
    ...
  }
}
```

### 2. Get Analytics for Specific API Key

```bash
GET /api/analytics/api-keys/:apiKey

Example:
curl http://localhost:3003/api/analytics/api-keys/test-api-key-12345

Response:
{
  "success": true,
  "data": {
    "metrics": {
      "api_key": "test-api-key-12345",
      "total_requests": 150,
      "total_rate_limited": 18,
      "avg_response_time_ms": 142.5,
      "last_request_at": "2024-01-15T10:30:00Z"
    },
    "recentRequests": [...],
    "rateLimitStats": {
      "rate_limited_count": 18,
      "total_count": 150,
      "rate_limit_percentage": 12.00
    }
  }
}
```

### 3. Get All API Keys Analytics

```bash
GET /api/analytics/api-keys?limit=50&offset=0

curl http://localhost:3003/api/analytics/api-keys
```

### 4. Get Endpoint Analytics

```bash
GET /api/analytics/endpoints?limit=50&offset=0

curl http://localhost:3003/api/analytics/endpoints

Response:
[
  {
    "endpoint": "/api/users",
    "method": "GET",
    "total_requests": 500,
    "avg_response_time_ms": 120.5
  },
  ...
]
```

### 5. Get Time-Series Data

```bash
GET /api/analytics/time-series?hours=24&interval=hour&apiKey=test-key

Parameters:
- hours: How many hours back to look (default: 24)
- interval: 'hour', 'minute', or 'day' (default: hour)
- apiKey: Optional filter for specific API key

Example:
curl "http://localhost:3003/api/analytics/time-series?hours=6&interval=hour"

Response:
[
  {
    "time_bucket": "2024-01-15T10:00:00Z",
    "request_count": 45,
    "rate_limited_count": 3,
    "avg_response_time": 135
  },
  ...
]
```

### 6. Get Top Rate-Limited Keys

```bash
GET /api/analytics/top-rate-limited?limit=10

curl http://localhost:3003/api/analytics/top-rate-limited

Response:
[
  {
    "api_key": "abusive-key-xyz",
    "total_rate_limited": 1523,
    "total_requests": 2000,
    "rate_limit_percentage": 76.15
  },
  ...
]
```

### 7. Get System Statistics

```bash
GET /api/analytics/system-stats

curl http://localhost:3003/api/analytics/system-stats

Response:
{
  "success": true,
  "data": {
    "unique_api_keys": 25,
    "total_requests": 15420,
    "total_rate_limited": 342,
    "avg_response_time": 145,
    "first_request_at": "2024-01-10T08:00:00Z",
    "last_request_at": "2024-01-15T12:00:00Z"
  }
}
```

### 8. Health Check

```bash
GET /health

curl http://localhost:3003/health
```

## Integration with API Gateway

The API Gateway automatically logs requests to this service:

1. **Every request** that comes through the gateway (whether allowed or blocked) is logged
2. Logging happens **asynchronously** - it won't slow down your API
3. If analytics service is down, requests still work (logging just fails silently)

You can disable analytics logging by setting in gateway's `.env`:

```env
ANALYTICS_ENABLED=false
```

## Use Cases

### 1. Monitor API Usage

Track which API keys are using your service most:

```bash
curl http://localhost:3003/api/analytics/api-keys | jq '.data | sort_by(-.total_requests) | .[0:5]'
```

### 2. Identify Abusive Users

Find API keys that hit rate limits frequently:

```bash
curl http://localhost:3003/api/analytics/top-rate-limited?limit=5
```

### 3. Performance Monitoring

Check which endpoints are slowest:

```bash
curl http://localhost:3003/api/analytics/endpoints | jq '.data | sort_by(-.avg_response_time_ms) | .[0:5]'
```

### 4. Usage Trends

View request patterns over time:

```bash
curl "http://localhost:3003/api/analytics/time-series?hours=24&interval=hour"
```

### 5. Generate Reports

Get detailed report for specific API key:

```bash
curl http://localhost:3003/api/analytics/api-keys/test-api-key-12345 | jq .
```

## Database Queries

You can also query PostgreSQL directly:

```bash
# Connect to database
psql -U postgres -d rate_limiter_analytics

# Recent requests
SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT 10;

# Requests per API key
SELECT api_key, COUNT(*) FROM request_logs GROUP BY api_key;

# Rate-limited requests
SELECT * FROM request_logs WHERE rate_limit_hit = TRUE;

# Busiest endpoints
SELECT endpoint, method, COUNT(*) as count
FROM request_logs
GROUP BY endpoint, method
ORDER BY count DESC;
```

## Monitoring

Watch live logs:

```bash
# In the service directory
npm run dev

# Watch PostgreSQL queries (if enabled in config)
tail -f /var/log/postgresql/postgresql-*.log
```

## Troubleshooting

### Cannot connect to PostgreSQL

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Start it: `sudo systemctl start postgresql`
3. Verify connection: `psql -U postgres -c "SELECT version();"`

### Permission denied

```
Error: permission denied for database rate_limiter_analytics
```

**Solution:**

```bash
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE rate_limiter_analytics TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

### Tables not created

**Solution:** The service auto-creates tables on startup. Check logs for errors. Or manually run:

```bash
psql -U postgres -d rate_limiter_analytics -f src/database/schema.sql
```

## Next Steps

After setting up the Analytics Service, you can:

1. ✅ See real-time metrics as requests flow through your system
2. 🔧 Build dashboards using the analytics endpoints
3. 📊 Set up alerts for unusual patterns (many rate-limited requests)
4. 📈 Generate usage reports for billing or capacity planning
5. 🎯 Move on to building the **Admin Service** (final piece!)
