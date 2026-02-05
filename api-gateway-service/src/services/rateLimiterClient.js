import axios from "axios";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Rate Limiter Client
 * Communicates with the Rate Limiter Service
 */
class RateLimiterClient {
  constructor() {
    this.baseURL = config.rateLimiterService.url;
    this.timeout = config.rateLimiterService.timeout;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Check if a request is allowed for the given API key
   * @param {string} apiKey - The API key to check
   * @param {number} tokens - Number of tokens to consume (default: 1)
   * @returns {Promise<Object>} - Rate limit check result
   */
  async checkLimit(apiKey, tokens = 1) {
    try {
      const response = await this.client.post("/api/v1/ratelimit/check", {
        apiKey,
        tokens,
      });

      logger.debug("Rate limit check result", {
        apiKey: apiKey.substring(0, 8) + "***",
        allowed: response.data.allowed,
        remaining: response.data.data?.remaining,
      });

      return {
        allowed: response.data.allowed,
        remaining: response.data.data?.remaining || 0,
        limit: response.data.data?.limit || 0,
        resetIn: response.data.data?.resetIn || 0,
      };
    } catch (error) {
      // Handle 429 Too Many Requests normally - IT IS NOT AN ERROR
      if (error.response && error.response.status === 429) {
        logger.warn("Rate limit exceeded (429 received from service)", {
          apiKey: apiKey.substring(0, 8) + "***",
        });
        return {
          allowed: false,
          remaining: error.response.data?.data?.remaining || 0,
          limit: error.response.data?.data?.limit || 0,
          resetIn: error.response.data?.data?.resetIn || 0,
        };
      }

      logger.error("Rate limiter service error", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error.message,
        code: error.code,
      });

      // If rate limiter is down, decide to fail-open or fail-closed
      // Fail-open: Allow the request (less secure but keeps service running)
      // Fail-closed: Block the request (more secure but can cause downtime)

      // CRITICAL: Log this error prominently so the user knows why requests are allowed/blocked
      logger.error("CRITICAL: Rate Limiter Service Unreachable", {
        details: "Ensure rate-limiter-service is running on port 3002",
        url: this.baseURL,
      });

      if (config.env === "production") {
        // In production, fail-closed for security
        logger.warn("Rate limiter unavailable - BLOCKING request", {
          apiKey: apiKey.substring(0, 8) + "***",
        });
        return {
          allowed: false,
          remaining: 0,
          limit: 0,
          resetIn: 60,
          error: "Rate limiter service unavailable",
        };
      } else {
        // In development, fail-open for convenience BUT warn heavily
        logger.warn(
          "DEV MODE: Rate limiter unavailable - ALLOWING request (Fail Open)",
          {
            apiKey: apiKey.substring(0, 8) + "***",
            note: "Requests will NOT be limited until service is restored",
          },
        );
        return {
          allowed: true,
          remaining: 999,
          limit: 1000,
          resetIn: 0,
          error: "Rate limiter service unavailable",
        };
      }
    }
  }

  /**
   * Get current rate limit status for an API key
   * @param {string} apiKey - The API key to check
   * @returns {Promise<Object>} - Current status
   */
  async getStatus(apiKey) {
    try {
      const response = await this.client.get(
        `/api/v1/ratelimit/status/${apiKey}`,
      );
      return response.data.data;
    } catch (error) {
      logger.error("Failed to get rate limit status", {
        apiKey: apiKey.substring(0, 8) + "***",
        error: error.message,
      });
      throw error;
    }
  }
}

export default new RateLimiterClient();
