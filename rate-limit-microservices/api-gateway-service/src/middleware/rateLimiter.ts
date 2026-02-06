import rateLimiterClient from "../services/rateLimiterClient.js";
import config from "../config/gatewayService.config.js";
import Logger from "../utils/logger.js";
import type { AsyncRouteHandler } from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Rate Limiting Middleware
 *
 * Checks with the Rate Limiter Service before allowing requests through
 * Adds rate limit headers to response
 */
export const rateLimitMiddleware: AsyncRouteHandler = async (
  req,
  res,
  next,
) => {
  const apiKey = req.apiKey;

  if (!apiKey) {
    // If no API key, skip rate limiting (shouldn't happen if validateApiKey runs first)
    logger.warn("Rate limit check skipped - no API key");
    return next();
  }

  try {
    // Check rate limit with Rate Limiter Service
    const result = await rateLimiterClient.checkLimit(apiKey);

    // Add rate limit headers to response
    res.set({
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetIn.toString(),
    });

    if (result.allowed) {
      // Request allowed - proceed
      logger.info("Request allowed through gateway", {
        apiKey: apiKey.substring(0, 8) + "***",
        path: req.path,
        method: req.method,
        remaining: result.remaining,
      });

      next();
    } else {
      // Rate limit exceeded - block request
      logger.warn("Request blocked - rate limit exceeded", {
        apiKey: apiKey.substring(0, 8) + "***",
        path: req.path,
        method: req.method,
        resetIn: result.resetIn,
      });

      res.status(429).json({
        success: false,
        error: {
          message: "Rate limit exceeded",
          statusCode: 429,
          remaining: result.remaining,
          resetIn: result.resetIn,
          retryAfter: result.resetIn,
        },
      });
    }
  } catch (error) {
    logger.error("Rate limit check failed", {
      apiKey: apiKey.substring(0, 8) + "***",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });

    // Pass error to error handler
    next(error);
  }
};
