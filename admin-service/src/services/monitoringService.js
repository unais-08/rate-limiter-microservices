import axios from "axios";
import config from "../config/index.js";

class MonitoringService {
  /**
   * Check health of all services
   */
  async checkAllServicesHealth() {
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
            status: "healthy",
            responseTime: response.headers["x-response-time"] || "N/A",
            data: response.data,
          };
        } catch (error) {
          return {
            name: service.name,
            port: service.port,
            status: "unhealthy",
            error: error.message,
          };
        }
      }),
    );

    return results.map((result) => result.value || result.reason);
  }

  /**
   * Get system-wide metrics from analytics
   */
  async getSystemMetrics() {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/system-stats`,
        {
          timeout: 5000,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch system metrics:", error.message);
      return null;
    }
  }

  /**
   * Get top rate-limited API keys
   */
  async getTopRateLimitedKeys(limit = 10) {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/top-rate-limited?limit=${limit}`,
        { timeout: 5000 },
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch top rate-limited keys:", error.message);
      return [];
    }
  }

  /**
   * Get time-series data
   */
  async getTimeSeriesData(hours = 24, interval = "hour") {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/time-series?hours=${hours}&interval=${interval}`,
        { timeout: 5000 },
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch time-series data:", error.message);
      return [];
    }
  }

  /**
   * Get all endpoint analytics
   */
  async getEndpointAnalytics() {
    try {
      const response = await axios.get(
        `${config.analyticsUrl}/api/v1/analytics/endpoints`,
        {
          timeout: 5000,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch endpoint analytics:", error.message);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData() {
    const [servicesHealth, systemMetrics, topRateLimited, timeSeries] =
      await Promise.all([
        this.checkAllServicesHealth(),
        this.getSystemMetrics(),
        this.getTopRateLimitedKeys(5),
        this.getTimeSeriesData(24, "hour"),
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
