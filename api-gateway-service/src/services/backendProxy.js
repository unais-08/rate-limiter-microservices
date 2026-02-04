import axios from "axios";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Backend Service Proxy
 * Forwards requests to the protected backend service
 */
class BackendProxy {
  constructor() {
    this.baseURL = config.backendService.url;
    this.timeout = config.backendService.timeout;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
    });
  }

  /**
   * Forward request to backend service
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} - Backend response
   */
  async forwardRequest(req) {
    try {
      const { method, path, query, body, headers } = this._prepareRequest(req);

      logger.debug("Forwarding request to backend", {
        method,
        path,
        apiKey: req.apiKey?.substring(0, 8) + "***",
      });

      const response = await this.client.request({
        method,
        url: path,
        params: query,
        data: body,
        headers,
      });

      logger.info("Backend request successful", {
        method,
        path,
        status: response.status,
        apiKey: req.apiKey?.substring(0, 8) + "***",
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      logger.error("Backend request failed", {
        method: req.method,
        path: req.path,
        apiKey: req.apiKey?.substring(0, 8) + "***",
        error: error.message,
        status: error.response?.status,
      });

      // Return error response from backend or construct one
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        };
      } else {
        // Backend service is down or unreachable
        return {
          status: 503,
          data: {
            success: false,
            error: {
              message: "Backend service unavailable",
              statusCode: 503,
            },
          },
        };
      }
    }
  }

  /**
   * Prepare request for forwarding
   * @param {Object} req - Express request
   * @returns {Object} - Prepared request data
   */
  _prepareRequest(req) {
    // Extract path (remove /api prefix if gateway uses it)
    const path = req.path;

    // Get query parameters
    const query = req.query;

    // Get request body
    const body = req.body;

    // Forward relevant headers (but filter out hop-by-hop headers)
    const headers = this._filterHeaders(req.headers);

    // Add gateway metadata headers
    headers["X-Forwarded-By"] = "api-gateway";
    headers["X-Gateway-API-Key"] = req.apiKey?.substring(0, 8) + "***";
    headers["X-Original-IP"] = req.ip;

    return {
      method: req.method,
      path,
      query,
      body,
      headers,
    };
  }

  /**
   * Filter out hop-by-hop and sensitive headers
   * @param {Object} headers - Original headers
   * @returns {Object} - Filtered headers
   */
  _filterHeaders(headers) {
    const hopByHopHeaders = [
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailers",
      "transfer-encoding",
      "upgrade",
      "host", // Will be set by axios
    ];

    const filtered = {};
    for (const [key, value] of Object.entries(headers)) {
      if (!hopByHopHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }

    return filtered;
  }
}

export default new BackendProxy();
