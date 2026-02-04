import { query } from "../config/database.js";

class AnalyticsService {
  /**
   * Log a single API request
   */
  async logRequest(requestData) {
    const {
      apiKey,
      endpoint,
      method,
      statusCode,
      responseTimeMs,
      rateLimitHit = false,
    } = requestData;

    try {
      const result = await query(
        `INSERT INTO request_logs 
         (api_key, endpoint, method, status_code, response_time_ms, rate_limit_hit, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [apiKey, endpoint, method, statusCode, responseTimeMs, rateLimitHit],
      );

      // Update aggregated metrics asynchronously (don't wait)
      this.updateMetrics(requestData).catch((err) => {
        console.error("Error updating metrics:", err);
      });

      return result.rows[0];
    } catch (error) {
      console.error("❌ Error logging request:", error.message);
      throw error;
    }
  }

  /**
   * Update aggregated metrics tables
   */
  async updateMetrics(requestData) {
    const { apiKey, endpoint, method, responseTimeMs, rateLimitHit } =
      requestData;

    // Update API key metrics
    await query(
      `INSERT INTO api_key_metrics (api_key, total_requests, total_rate_limited, avg_response_time_ms, last_request_at)
       VALUES ($1, 1, $2, $3, NOW())
       ON CONFLICT (api_key)
       DO UPDATE SET
         total_requests = api_key_metrics.total_requests + 1,
         total_rate_limited = api_key_metrics.total_rate_limited + $2,
         avg_response_time_ms = (api_key_metrics.avg_response_time_ms * api_key_metrics.total_requests + $3) / (api_key_metrics.total_requests + 1),
         last_request_at = NOW(),
         updated_at = NOW()`,
      [apiKey, rateLimitHit ? 1 : 0, responseTimeMs],
    );

    // Update endpoint metrics
    await query(
      `INSERT INTO endpoint_metrics (endpoint, method, total_requests, avg_response_time_ms, last_request_at)
       VALUES ($1, $2, 1, $3, NOW())
       ON CONFLICT (endpoint, method)
       DO UPDATE SET
         total_requests = endpoint_metrics.total_requests + 1,
         avg_response_time_ms = (endpoint_metrics.avg_response_time_ms * endpoint_metrics.total_requests + $3) / (endpoint_metrics.total_requests + 1),
         last_request_at = NOW(),
         updated_at = NOW()`,
      [endpoint, method, responseTimeMs],
    );
  }

  /**
   * Get analytics for a specific API key
   */
  async getApiKeyAnalytics(apiKey, options = {}) {
    const { limit = 100, offset = 0 } = options;

    try {
      // Get aggregated metrics
      const metricsResult = await query(
        "SELECT * FROM api_key_metrics WHERE api_key = $1",
        [apiKey],
      );

      // Get recent requests
      const requestsResult = await query(
        `SELECT * FROM request_logs 
         WHERE api_key = $1 
         ORDER BY timestamp DESC 
         LIMIT $2 OFFSET $3`,
        [apiKey, limit, offset],
      );

      // Get rate limit stats
      const rateLimitResult = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE rate_limit_hit = TRUE) as rate_limited_count,
           COUNT(*) as total_count,
           ROUND((COUNT(*) FILTER (WHERE rate_limit_hit = TRUE)::numeric / NULLIF(COUNT(*), 0) * 100), 2) as rate_limit_percentage
         FROM request_logs 
         WHERE api_key = $1`,
        [apiKey],
      );

      return {
        metrics: metricsResult.rows[0] || null,
        recentRequests: requestsResult.rows,
        rateLimitStats: rateLimitResult.rows[0],
      };
    } catch (error) {
      console.error("❌ Error getting API key analytics:", error.message);
      throw error;
    }
  }

  /**
   * Get analytics for all API keys
   */
  async getAllApiKeysAnalytics(options = {}) {
    const { limit = 50, offset = 0 } = options;

    try {
      const result = await query(
        `SELECT * FROM api_key_metrics 
         ORDER BY total_requests DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );

      return result.rows;
    } catch (error) {
      console.error("❌ Error getting all API keys analytics:", error.message);
      throw error;
    }
  }

  /**
   * Get endpoint analytics
   */
  async getEndpointAnalytics(options = {}) {
    const { limit = 50, offset = 0 } = options;

    try {
      const result = await query(
        `SELECT * FROM endpoint_metrics 
         ORDER BY total_requests DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );

      return result.rows;
    } catch (error) {
      console.error("❌ Error getting endpoint analytics:", error.message);
      throw error;
    }
  }

  /**
   * Get time-series data (requests per time bucket)
   */
  async getTimeSeriesData(options = {}) {
    const {
      hours = 24,
      interval = "hour", // 'hour', 'minute', 'day'
      apiKey = null,
    } = options;

    try {
      let queryText = `
        SELECT 
          DATE_TRUNC($1, timestamp) as time_bucket,
          COUNT(*) as request_count,
          COUNT(*) FILTER (WHERE rate_limit_hit = TRUE) as rate_limited_count,
          AVG(response_time_ms)::integer as avg_response_time
        FROM request_logs
        WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      `;

      const params = [interval];

      if (apiKey) {
        queryText += " AND api_key = $2";
        params.push(apiKey);
      }

      queryText += " GROUP BY time_bucket ORDER BY time_bucket";

      const result = await query(queryText, params);

      return result.rows;
    } catch (error) {
      console.error("❌ Error getting time-series data:", error.message);
      throw error;
    }
  }

  /**
   * Get top rate-limited API keys
   */
  async getTopRateLimitedKeys(limit = 10) {
    try {
      const result = await query(
        `SELECT 
           api_key,
           total_rate_limited,
           total_requests,
           ROUND((total_rate_limited::numeric / NULLIF(total_requests, 0) * 100), 2) as rate_limit_percentage
         FROM api_key_metrics
         WHERE total_rate_limited > 0
         ORDER BY total_rate_limited DESC
         LIMIT $1`,
        [limit],
      );

      return result.rows;
    } catch (error) {
      console.error("❌ Error getting top rate-limited keys:", error.message);
      throw error;
    }
  }

  /**
   * Get overall system statistics
   */
  async getSystemStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(DISTINCT api_key) as unique_api_keys,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE rate_limit_hit = TRUE) as total_rate_limited,
          AVG(response_time_ms)::integer as avg_response_time,
          MIN(timestamp) as first_request_at,
          MAX(timestamp) as last_request_at
        FROM request_logs
      `);

      return result.rows[0];
    } catch (error) {
      console.error("❌ Error getting system stats:", error.message);
      throw error;
    }
  }
}

export default new AnalyticsService();
