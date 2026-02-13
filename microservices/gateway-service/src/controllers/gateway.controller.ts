import backendProxy from "../services/backendProxy.js";
import dynamicProxyService from "../services/dynamicProxyService.js";
import { asyncHandler } from "../utils/errorHandler.js";
import Logger from "../utils/logger.js";
import config from "../config/gatewayService.config.js";
import type { GatewayRequest } from "../types/index.js";
import type { Response } from "express";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Gateway Controller
 * Handles proxying requests to backend service after rate limit checks pass
 *
 * Routing:
 * - /api/v1/s/{slug}/... → User's configured backend endpoint
 * - /api/v1/service/{slug}/... → User's configured backend endpoint
 * - /api/v1/... → Default backend service (for demo/testing)
 */

/**
 * Proxy request to backend service
 */
export const proxyToBackend = asyncHandler(
  async (req: GatewayRequest, res: Response): Promise<void> => {
    // At this point:
    // - API key is validated (by validateApiKey middleware)
    // - Rate limit check passed (by rateLimitMiddleware)
    // - Request is allowed to proceed

    logger.debug("Proxying request to backend", {
      method: req.method,
      path: req.path,
      apiKey: req.apiKey?.substring(0, 8) + "***",
      userId: req.apiKeyMetadata?.userId,
    });

    let backendResponse;

    // Check if this is a dynamic route to user's backend
    // Strip /api prefix to check - route is /api/v1/s/{slug}/...
    const pathWithoutApiPrefix = req.path.replace(/^\/api\/v1/, "");

    if (dynamicProxyService.isDynamicRoute(pathWithoutApiPrefix)) {
      // Route to user's configured backend
      const userId = req.apiKeyMetadata?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: "API key does not have an associated user",
            statusCode: 401,
          },
        });
        return;
      }

      // Pass the original request with the modified path for routing
      backendResponse = await dynamicProxyService.forwardRequest(
        req,
        userId,
        pathWithoutApiPrefix,
      );
    } else {
      // Route to default backend service (demo/testing)
      backendResponse = await backendProxy.forwardRequest(req);
    }

    // Set response headers from backend
    if (backendResponse.headers) {
      Object.entries(backendResponse.headers).forEach(([key, value]) => {
        // Skip certain headers that shouldn't be forwarded
        if (
          !["content-encoding", "transfer-encoding"].includes(key.toLowerCase())
        ) {
          res.set(key, value);
        }
      });
    }

    // Add gateway metadata header
    res.set("X-Gateway-Processed", "true");

    // Send backend response to client
    res.status(backendResponse.status).json(backendResponse.data);
  },
);
