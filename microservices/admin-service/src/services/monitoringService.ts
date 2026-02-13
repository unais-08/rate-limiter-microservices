import axios from "axios";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:monitoringService");

interface ServiceHealth {
  name: string;
  port: number;
  status: "healthy" | "unhealthy";
  responseTime?: string;
  data?: any;
  error?: string;
}

interface DashboardData {
  services: ServiceHealth[];
  metrics: any;
  topRateLimited: any[];
  timeSeries: any[];
  timestamp: string;
}

class MonitoringService {
  /**
   * Check health of all services
   */
  async checkAllServicesHealth(): Promise<ServiceHealth[]> {
    const services = [
      {
        name: "Rate Limiter",
        url: `${config.rateLimiterUrl}/health`,
        port: 3002,
      },
      { name: "Analytics", url: `${config.analyticsUrl}/health`, port: 3003 },
      { name: "API Gateway", url: `${config.gatewayUrl}/health`, port: 3000 },
    ];

    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url, { timeout: 2000 });
          return {
            name: service.name,
            port: service.port,
            status: "healthy" as const,
            responseTime: response.headers["x-response-time"] || "N/A",
            data: response.data,
          };
        } catch (error) {
          return {
            name: service.name,
            port: service.port,
            status: "unhealthy" as const,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    return results.map((result) =>
      result.status === "fulfilled" ? result.value : result.reason,
    );
  }

  /**
   * Get system-wide metrics from analytics (scoped to user)
   */
  async getSystemMetrics(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/system-stats?userId=${userId}`,
        {
          timeout: 5000,
        },
      );
      return response.data.data;
    } catch (error) {
      logger.error("Failed to fetch system metrics", {
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Get top rate-limited API keys (scoped to user)
   */
  async getTopRateLimitedKeys(
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/top-rate-limited?userId=${userId}&limit=${limit}`,
        { timeout: 5000 },
      );
      return response.data.data;
    } catch (error) {
      logger.error("Failed to fetch top rate-limited keys", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  }

  /**
   * Get time-series data (scoped to user)
   */
  async getTimeSeriesData(
    userId: string,
    hours: number = 24,
    interval: string = "hour",
    apiKey?: string,
  ): Promise<any[]> {
    try {
      let url = `${config.analyticsUrl}/api/v1/analytics/time-series?userId=${userId}&hours=${hours}&interval=${interval}`;
      if (apiKey) {
        url += `&apiKey=${encodeURIComponent(apiKey)}`;
      }
      const response = await axios.get(url, { timeout: 5000 });
      return response.data.data;
    } catch (error) {
      logger.error("Failed to fetch time-series data", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  }

  /**
   * Get all endpoint analytics (scoped to user)
   */
  async getEndpointAnalytics(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/endpoints?userId=${userId}`,
        {
          timeout: 5000,
        },
      );
      return response.data.data;
    } catch (error) {
      logger.error("Failed to fetch endpoint analytics", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  }

  /**
   * Get comprehensive dashboard data (scoped to user)
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    const [servicesHealth, systemMetrics, topRateLimited, timeSeries] =
      await Promise.all([
        this.checkAllServicesHealth(),
        this.getSystemMetrics(userId),
        this.getTopRateLimitedKeys(userId, 5),
        this.getTimeSeriesData(userId, 24, "hour"),
      ]);

    return {
      services: servicesHealth,
      metrics: systemMetrics,
      topRateLimited,
      timeSeries,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new MonitoringService();
