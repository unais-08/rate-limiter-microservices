import backendProxy from "../services/backendProxy.js";
import { asyncHandler } from "../utils/errorHandler.js";
import Logger from "../utils/logger.js";
import config from "../config/gatewayService.config.js";
import type { GatewayRequest } from "../types/index.js";
import type { Response } from "express";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Gateway Controller
 * Handles proxying requests to backend service after rate limit checks pass
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
    });

    // Forward request to backend
    const backendResponse = await backendProxy.forwardRequest(req);

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
