import prisma from "../config/database.js";
import type {
  LogRequest,
  TimeSeriesDataPoint,
  SystemStats,
} from "../types/index.js";

class AnalyticsService {
  /**
   * Log a single API request
   */
  async logRequest(requestData: LogRequest) {
    const {
      userId,
      apiKey,
      endpoint,
      method,
      statusCode,
      responseTimeMs,
      rateLimitHit = false,
    } = requestData;

    try {
      const result = await prisma.requestLog.create({
        data: {
          userId,
          apiKey,
          endpoint,
          method,
          statusCode,
          responseTimeMs,
          rateLimitHit,
        },
      });

      // Update aggregated metrics asynchronously (don't wait)
      this.updateMetrics(requestData).catch((err) => {
        console.error("Error updating metrics:", err);
      });

      return result;
    } catch (error) {
      console.error(
        "❌ Error logging request:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Update aggregated metrics tables
   */
  async updateMetrics(requestData: LogRequest): Promise<void> {
    const {
      userId,
      apiKey,
      endpoint,
      method,
      responseTimeMs,
      rateLimitHit = false,
    } = requestData;

    try {
      // Update API key metrics using upsert
      const existingMetric = await prisma.apiKeyMetric.findUnique({
        where: {
          userId_apiKey: {
            userId,
            apiKey,
          },
        },
      });

      if (existingMetric) {
        // Calculate new average response time
        const newTotalRequests = existingMetric.totalRequests + 1;
        const newAvgResponseTime =
          (existingMetric.avgResponseTimeMs * existingMetric.totalRequests +
            responseTimeMs) /
          newTotalRequests;

        await prisma.apiKeyMetric.update({
          where: {
            userId_apiKey: {
              userId,
              apiKey,
            },
          },
          data: {
            totalRequests: newTotalRequests,
            totalRateLimited: rateLimitHit
              ? existingMetric.totalRateLimited + 1
              : existingMetric.totalRateLimited,
            avgResponseTimeMs: newAvgResponseTime,
            lastRequestAt: new Date(),
          },
        });
      } else {
        await prisma.apiKeyMetric.create({
          data: {
            userId,
            apiKey,
            name: requestData.name || null,
            totalRequests: 1,
            totalRateLimited: rateLimitHit ? 1 : 0,
            avgResponseTimeMs: responseTimeMs,
            lastRequestAt: new Date(),
          },
        });
      }

      // Update endpoint metrics
      const existingEndpoint = await prisma.endpointMetric.findUnique({
        where: {
          userId_endpoint_method: {
            userId,
            endpoint,
            method,
          },
        },
      });

      if (existingEndpoint) {
        const newTotalRequests = existingEndpoint.totalRequests + 1;
        const newAvgResponseTime =
          (existingEndpoint.avgResponseTimeMs * existingEndpoint.totalRequests +
            responseTimeMs) /
          newTotalRequests;

        await prisma.endpointMetric.update({
          where: {
            userId_endpoint_method: {
              userId,
              endpoint,
              method,
            },
          },
          data: {
            totalRequests: newTotalRequests,
            avgResponseTimeMs: newAvgResponseTime,
            lastRequestAt: new Date(),
          },
        });
      } else {
        await prisma.endpointMetric.create({
          data: {
            userId,
            endpoint,
            method,
            totalRequests: 1,
            avgResponseTimeMs: responseTimeMs,
            lastRequestAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error in updateMetrics:", error);
    }
  }

  /**
   * Get analytics for a specific API key (user-scoped)
   */
  async getApiKeyAnalytics(
    userId: string,
    apiKey: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit = 100, offset = 0 } = options;

    try {
      // Get aggregated metrics
      const metrics = await prisma.apiKeyMetric.findUnique({
        where: {
          userId_apiKey: {
            userId,
            apiKey,
          },
        },
      });

      // Get recent requests
      const recentRequests = await prisma.requestLog.findMany({
        where: { userId, apiKey },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      });

      // Get rate limit stats
      const totalCount = await prisma.requestLog.count({
        where: { userId, apiKey },
      });

      const rateLimitedCount = await prisma.requestLog.count({
        where: { userId, apiKey, rateLimitHit: true },
      });

      const rateLimitPercentage =
        totalCount > 0
          ? Math.round((rateLimitedCount / totalCount) * 10000) / 100
          : 0;

      return {
        metrics,
        recentRequests,
        rateLimitStats: {
          rate_limited_count: rateLimitedCount,
          total_count: totalCount,
          rate_limit_percentage: rateLimitPercentage,
        },
      };
    } catch (error) {
      console.error(
        "❌ Error getting API key analytics:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Get analytics for all API keys (user-scoped)
   */
  async getAllApiKeysAnalytics(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit = 50, offset = 0 } = options;

    try {
      const results = await prisma.apiKeyMetric.findMany({
        where: { userId },
        orderBy: { totalRequests: "desc" },
        take: limit,
        skip: offset,
      });

      return results;
    } catch (error) {
      console.error(
        "❌ Error getting all API keys analytics:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Get endpoint analytics (user-scoped)
   */
  async getEndpointAnalytics(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit = 50, offset = 0 } = options;

    try {
      const results = await prisma.endpointMetric.findMany({
        where: { userId },
        orderBy: { totalRequests: "desc" },
        take: limit,
        skip: offset,
      });

      return results;
    } catch (error) {
      console.error(
        "❌ Error getting endpoint analytics:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Get time-series data (requests per time bucket) - user-scoped
   */
  async getTimeSeriesData(
    userId: string,
    options: { hours?: number; interval?: string; apiKey?: string | null } = {},
  ) {
    const { hours = 24, interval = "hour", apiKey = null } = options;

    // Validate interval to prevent SQL injection (whitelist approach)
    const validIntervals = ["minute", "hour", "day", "week", "month"];
    const safeInterval = validIntervals.includes(interval) ? interval : "hour";

    // Validate hours is a positive number
    const safeHours = Math.max(
      1,
      Math.min(parseInt(String(hours), 10) || 24, 8760),
    ); // Max 1 year

    try {
      // Use Prisma's safe parameterized query
      let result;
      if (apiKey) {
        result = await prisma.$queryRaw<TimeSeriesDataPoint[]>`
          SELECT 
            DATE_TRUNC(${safeInterval}, timestamp) as time_bucket,
            COUNT(*)::int as request_count,
            COUNT(*) FILTER (WHERE rate_limit_hit = TRUE)::int as rate_limited_count,
            COALESCE(AVG(response_time_ms)::int, 0) as avg_response_time
          FROM request_logs
          WHERE timestamp > NOW() - CAST(${safeHours + " hours"} AS INTERVAL)
          AND user_id = ${userId}
          AND api_key = ${apiKey}
          GROUP BY time_bucket
          ORDER BY time_bucket
        `;
      } else {
        result = await prisma.$queryRaw<TimeSeriesDataPoint[]>`
          SELECT 
            DATE_TRUNC(${safeInterval}, timestamp) as time_bucket,
            COUNT(*)::int as request_count,
            COUNT(*) FILTER (WHERE rate_limit_hit = TRUE)::int as rate_limited_count,
            COALESCE(AVG(response_time_ms)::int, 0) as avg_response_time
          FROM request_logs
          WHERE timestamp > NOW() - CAST(${safeHours + " hours"} AS INTERVAL)
          AND user_id = ${userId}
          GROUP BY time_bucket
          ORDER BY time_bucket
        `;
      }

      return result;
    } catch (error) {
      console.error(
        "❌ Error getting time-series data:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Get top rate-limited API keys (user-scoped)
   */
  async getTopRateLimitedKeys(userId: string, limit: number = 10) {
    try {
      const results = await prisma.apiKeyMetric.findMany({
        where: {
          userId,
          totalRateLimited: {
            gt: 0,
          },
        },
        orderBy: {
          totalRateLimited: "desc",
        },
        take: limit,
        select: {
          apiKey: true,
          name: true,
          totalRateLimited: true,
          totalRequests: true,
        },
      });

      return results.map((result: any) => ({
        api_key: result.apiKey,
        name: result.name,
        total_rate_limited: result.totalRateLimited,
        total_requests: result.totalRequests,
        rate_limit_percentage:
          result.totalRequests > 0
            ? Math.round(
                (result.totalRateLimited / result.totalRequests) * 10000,
              ) / 100
            : 0,
      }));
    } catch (error) {
      console.error(
        "❌ Error getting top rate-limited keys:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Get overall system statistics (user-scoped)
   */
  async getSystemStats(userId: string): Promise<SystemStats> {
    try {
      const [
        totalRequests,
        rateLimitedCount,
        avgResponseTime,
        uniqueApiKeys,
        timestamps,
      ] = await Promise.all([
        prisma.requestLog.count({ where: { userId } }),
        prisma.requestLog.count({ where: { userId, rateLimitHit: true } }),
        prisma.requestLog.aggregate({
          where: { userId },
          _avg: {
            responseTimeMs: true,
          },
        }),
        prisma.requestLog.findMany({
          where: { userId },
          distinct: ["apiKey"],
          select: { apiKey: true },
        }),
        prisma.requestLog.aggregate({
          where: { userId },
          _min: {
            timestamp: true,
          },
          _max: {
            timestamp: true,
          },
        }),
      ]);

      return {
        unique_api_keys: uniqueApiKeys.length,
        total_requests: totalRequests,
        total_rate_limited: rateLimitedCount,
        avg_response_time: Math.round(avgResponseTime._avg.responseTimeMs || 0),
        first_request_at: timestamps._min.timestamp,
        last_request_at: timestamps._max.timestamp,
      } as any;
    } catch (error) {
      console.error(
        "❌ Error getting system stats:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Delete all analytics data for a specific API key
   * Called when an API key is deleted from the admin service
   */
  async deleteApiKeyData(
    userId: string,
    apiKey: string,
  ): Promise<{ deletedLogs: number; deletedMetrics: number }> {
    try {
      console.log(`🗑️ Deleting analytics data for API key: ${apiKey}`);

      // Delete request logs for this API key
      const deletedLogs = await prisma.requestLog.deleteMany({
        where: {
          userId,
          apiKey,
        },
      });

      // Delete API key metrics
      const deletedMetrics = await prisma.apiKeyMetric.deleteMany({
        where: {
          userId,
          apiKey,
        },
      });

      console.log(
        `✅ Deleted ${deletedLogs.count} logs and ${deletedMetrics.count} metrics for API key: ${apiKey}`,
      );

      return {
        deletedLogs: deletedLogs.count,
        deletedMetrics: deletedMetrics.count,
      };
    } catch (error) {
      console.error(
        "❌ Error deleting API key data:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }
}

export default new AnalyticsService();
