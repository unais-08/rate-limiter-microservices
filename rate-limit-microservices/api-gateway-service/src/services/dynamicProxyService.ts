import axios, { type Method } from "axios";
import config from "../config/gatewayService.config.js";
import Logger from "../utils/logger.js";
import type { BackendResponse, GatewayRequest } from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

const ADMIN_SERVICE_URL =
  process.env.ADMIN_SERVICE_URL || "http://localhost:3004";
const INTERNAL_SERVICE_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN || "internal-service-secret-token";

// Cache for endpoint configurations
interface EndpointConfig {
  id: string;
  targetUrl: string;
  authType: string;
  authConfig: Record<string, any> | null;
  cachedAt: number;
}

const endpointCache = new Map<string, EndpointConfig>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Dynamic Backend Proxy Service
 * Routes requests to user-configured backend endpoints
 *
 * URL Format: /s/{slug}/{rest-of-path}
 * Example: /s/my-api/users/123 -> User's backend at targetUrl/users/123
 */
class DynamicProxyService {
  /**
   * Check if request should be dynamically routed
   */
  isDynamicRoute(path: string): boolean {
    return path.startsWith("/s/") || path.startsWith("/service/");
  }

  /**
   * Extract slug and remaining path from request
   */
  parseRoute(path: string): { slug: string; remainingPath: string } | null {
    // Match /s/{slug}/... or /service/{slug}/...
    const match = path.match(/^\/(s|service)\/([^\/]+)(\/.*)?$/);
    if (!match) return null;

    return {
      slug: match[2],
      remainingPath: match[3] || "/",
    };
  }

  /**
   * Get endpoint configuration for a user's slug
   */
  async getEndpointConfig(
    userId: string,
    slug: string,
  ): Promise<EndpointConfig | null> {
    const cacheKey = `${userId}:${slug}`;

    // Check cache
    const cached = endpointCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      logger.debug("Endpoint config cache hit", { userId, slug });
      return cached;
    }

    // Fetch from admin service
    try {
      const response = await axios.get(
        `${ADMIN_SERVICE_URL}/api/v1/internal/endpoint/${userId}/${slug}`,
        {
          headers: {
            "x-internal-service-token": INTERNAL_SERVICE_TOKEN,
          },
          timeout: 5000,
        },
      );

      if (response.data.success && response.data.data) {
        const endpoint = response.data.data;
        const config: EndpointConfig = {
          id: endpoint.id,
          targetUrl: endpoint.targetUrl,
          authType: endpoint.authType,
          authConfig: endpoint.authConfig,
          cachedAt: Date.now(),
        };

        endpointCache.set(cacheKey, config);
        logger.info("Endpoint config cached", {
          userId,
          slug,
          targetUrl: config.targetUrl,
        });
        return config;
      }

      return null;
    } catch (error) {
      logger.error("Failed to fetch endpoint config", {
        userId,
        slug,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Forward request to user's configured backend
   * @param req - Express request object
   * @param userId - User ID from API key
   * @param routePath - The path to parse for routing (optional, defaults to req.path)
   */
  async forwardRequest(
    req: GatewayRequest,
    userId: string,
    routePath?: string,
  ): Promise<BackendResponse> {
    const pathToRoute = routePath || req.path;
    const parsed = this.parseRoute(pathToRoute);

    if (!parsed) {
      return {
        status: 400,
        data: {
          success: false,
          error: {
            message: "Invalid route format. Use /s/{slug}/{path}",
            statusCode: 400,
          },
        },
        headers: {},
      };
    }

    const { slug, remainingPath } = parsed;

    // Get endpoint configuration
    const endpointConfig = await this.getEndpointConfig(userId, slug);

    if (!endpointConfig) {
      return {
        status: 404,
        data: {
          success: false,
          error: {
            message: `No backend configured for slug "${slug}". Configure it in the dashboard.`,
            statusCode: 404,
          },
        },
        headers: {},
      };
    }

    // Build target URL
    const targetUrl =
      endpointConfig.targetUrl.replace(/\/$/, "") + remainingPath;

    logger.info("Routing to user backend", {
      userId,
      slug,
      originalPath: req.path,
      targetUrl,
      method: req.method,
    });

    try {
      // Prepare headers
      const headers = this.prepareHeaders(req, endpointConfig);

      // Make request to user's backend
      const response = await axios.request({
        method: req.method as Method,
        url: targetUrl,
        params: req.query,
        data: req.body,
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: () => true, // Accept all status codes
        maxRedirects: 5,
      });

      logger.info("Request proxied to user backend successfully", {
        userId,
        slug,
        targetUrl,
        status: response.status,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string | string[]>,
      };
    } catch (error) {
      logger.error("Failed to proxy request to user backend", {
        userId,
        slug,
        targetUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          return {
            status: 502,
            data: {
              success: false,
              error: {
                message: "Backend service connection refused",
                statusCode: 502,
              },
            },
            headers: {},
          };
        }
        if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
          return {
            status: 504,
            data: {
              success: false,
              error: {
                message: "Backend service timeout",
                statusCode: 504,
              },
            },
            headers: {},
          };
        }
      }

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

  /**
   * Prepare headers for the backend request
   */
  private prepareHeaders(
    req: GatewayRequest,
    endpointConfig: EndpointConfig,
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    // Copy relevant headers from original request
    const hopByHopHeaders = [
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailers",
      "transfer-encoding",
      "upgrade",
      "host",
      "content-length",
    ];

    // Safely iterate over headers
    if (req.headers && typeof req.headers === "object") {
      for (const [key, value] of Object.entries(req.headers)) {
        if (
          !hopByHopHeaders.includes(key.toLowerCase()) &&
          typeof value === "string"
        ) {
          headers[key] = value;
        }
      }
    }

    // Add gateway metadata
    headers["X-Forwarded-By"] = "rate-limiter-gateway";
    headers["X-Original-IP"] = req.ip || "unknown";
    headers["X-API-Key-Used"] = req.apiKey?.substring(0, 8) + "***" || "none";

    // Apply authentication based on endpoint config
    if (endpointConfig.authType !== "none" && endpointConfig.authConfig) {
      switch (endpointConfig.authType) {
        case "bearer":
          if (endpointConfig.authConfig.token) {
            headers["Authorization"] =
              `Bearer ${endpointConfig.authConfig.token}`;
          }
          break;
        case "basic":
          if (
            endpointConfig.authConfig.username &&
            endpointConfig.authConfig.password
          ) {
            const credentials = Buffer.from(
              `${endpointConfig.authConfig.username}:${endpointConfig.authConfig.password}`,
            ).toString("base64");
            headers["Authorization"] = `Basic ${credentials}`;
          }
          break;
        case "api-key":
          if (
            endpointConfig.authConfig.headerName &&
            endpointConfig.authConfig.value
          ) {
            headers[endpointConfig.authConfig.headerName] =
              endpointConfig.authConfig.value;
          }
          break;
      }
    }

    // Ensure Content-Type for body requests
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }
    }

    return headers;
  }

  /**
   * Clear cache for a specific endpoint
   */
  clearCache(userId: string, slug: string) {
    endpointCache.delete(`${userId}:${slug}`);
  }

  /**
   * Clear all cached endpoints for a user
   */
  clearUserCache(userId: string) {
    for (const key of endpointCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        endpointCache.delete(key);
      }
    }
  }
}

export default new DynamicProxyService();
