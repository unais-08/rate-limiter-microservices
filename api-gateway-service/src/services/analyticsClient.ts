import axios from "axios";
import config from "../config/gatewayService.config.js";
import Logger from "../utils/logger.js";
import type { AnalyticsRequestData } from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Analytics Service Client
 * Communicates with Usage Analytics Service to log request metrics
 */
class AnalyticsClient {
  private readonly analyticsServiceUrl: string;
  private readonly enabled: boolean;

  constructor() {
    this.analyticsServiceUrl =
      process.env.ANALYTICS_SERVICE_URL || "http://localhost:3003";
    this.enabled = process.env.ANALYTICS_ENABLED !== "false";
  }

  /**
   * Log a request to the analytics service
   * This is non-blocking - errors won't affect the main request flow
   */
  async logRequest(requestData: AnalyticsRequestData): Promise<unknown> {
    if (!this.enabled) {
      return undefined;
    }

    try {
      const response = await axios.post(
        `${this.analyticsServiceUrl}/api/v1/analytics/log`,
        requestData,
        {
          timeout: 2000, // 2 second timeout
        },
      );

      logger.debug("Request logged to analytics service", {
        apiKey: requestData.apiKey?.substring(0, 8) + "***",
        endpoint: requestData.endpoint,
      });

      return response.data;
    } catch (error) {
      // Don't throw - analytics failures shouldn't block requests
      logger.warn("Failed to log request to analytics service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return undefined;
    }
  }

  /**
   * Get analytics for an API key
   */
  async getApiKeyAnalytics(apiKey: string): Promise<unknown> {
    try {
      const response = await axios.get(
        `${this.analyticsServiceUrl}/api/v1/analytics/api-keys/${apiKey}`,
        {
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Failed to get API key analytics", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<unknown> {
    try {
      const response = await axios.get(
        `${this.analyticsServiceUrl}/api/v1/analytics/system-stats`,
        {
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Failed to get system stats", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

export default new AnalyticsClient();
