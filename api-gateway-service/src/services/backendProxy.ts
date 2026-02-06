import axios, { type AxiosInstance, type Method } from "axios";
import config from "../config/gatewayService.config.js";
import Logger from "../utils/logger.js";
import type {
  BackendResponse,
  PreparedRequest,
  GatewayRequest,
} from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Backend Service Proxy
 * Forwards requests to the protected backend service
 */
class BackendProxy {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly client: AxiosInstance;

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
   * @param req - Express request object
   * @returns Backend response
   */
  async forwardRequest(req: GatewayRequest): Promise<BackendResponse> {
    try {
      const { method, path, query, body, headers } = this._prepareRequest(req);

      logger.debug("Forwarding request to backend", {
        method,
        path,
        apiKey: req.apiKey?.substring(0, 8) + "***",
      });

      const response = await this.client.request({
        method: method as Method,
        url: path,
        params: query,
        data: body,
        headers,
      });

      logger.info("Request proxied to backend successfully", {
        method,
        path,
        status: response.status,
        apiKey: req.apiKey?.substring(0, 8) + "***",
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string | string[]>,
      };
    } catch (error) {
      logger.error("Request proxied to backend failed", {
        method: req.method,
        path: req.path,
        apiKey: req.apiKey?.substring(0, 8) + "***",
        error: error instanceof Error ? error.message : "Unknown error",
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
      });

      // Return error response from backend or construct one
      if (axios.isAxiosError(error) && error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers as Record<string, string | string[]>,
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
          headers: {},
        };
      }
    }
  }

  /**
   * Prepare request for forwarding
   * @param req - Express request
   * @returns Prepared request data
   */
  private _prepareRequest(req: GatewayRequest): PreparedRequest {
    // Forward the full path to backend
    const path = req.path;

    // Get query parameters
    const query = req.query as Record<string, unknown>;

    // Get request body
    const body = req.body;

    // Forward relevant headers (but filter out hop-by-hop headers)
    const headers = this._filterHeaders(req.headers);

    // Add gateway metadata headers
    headers["X-Forwarded-By"] = "api-gateway";
    headers["X-Gateway-API-Key"] =
      req.apiKey?.substring(0, 8) + "***" || "none";
    headers["X-Original-IP"] = req.ip || "unknown";

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
   * @param headers - Original headers
   * @returns Filtered headers
   */
  private _filterHeaders(
    headers: Record<string, unknown>,
  ): Record<string, string> {
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

    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (
        !hopByHopHeaders.includes(key.toLowerCase()) &&
        typeof value === "string"
      ) {
        filtered[key] = value;
      }
    }

    return filtered;
  }
}

export default new BackendProxy();
