-- Usage Analytics Database Schema
-- Database: rate_limiter_analytics

-- Main request logs table - stores every API request
CREATE TABLE IF NOT EXISTS request_logs (
  id SERIAL PRIMARY KEY,
  api_key VARCHAR(255) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  rate_limit_hit BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_api_key ON request_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_endpoint ON request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_timestamp ON request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hit ON request_logs(rate_limit_hit);

-- Aggregated API key metrics table
CREATE TABLE IF NOT EXISTS api_key_metrics (
  id SERIAL PRIMARY KEY,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_rate_limited INTEGER DEFAULT 0,
  avg_response_time_ms FLOAT DEFAULT 0,
  last_request_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated endpoint metrics table
CREATE TABLE IF NOT EXISTS endpoint_metrics (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  total_requests INTEGER DEFAULT 0,
  avg_response_time_ms FLOAT DEFAULT 0,
  last_request_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint, method)
);

-- Sample queries:
-- 1. Get all requests for a specific API key
-- SELECT * FROM request_logs WHERE api_key = 'test-api-key-12345' ORDER BY timestamp DESC LIMIT 100;

-- 2. Count rate-limited requests per API key
-- SELECT api_key, COUNT(*) as rate_limited_count 
-- FROM request_logs 
-- WHERE rate_limit_hit = TRUE 
-- GROUP BY api_key;

-- 3. Average response time per endpoint
-- SELECT endpoint, method, AVG(response_time_ms) as avg_response_time
-- FROM request_logs
-- GROUP BY endpoint, method
-- ORDER BY avg_response_time DESC;

-- 4. Requests per hour in last 24 hours
-- SELECT 
--   DATE_TRUNC('hour', timestamp) as hour,
--   COUNT(*) as request_count
-- FROM request_logs
-- WHERE timestamp > NOW() - INTERVAL '24 hours'
-- GROUP BY hour
-- ORDER BY hour;
