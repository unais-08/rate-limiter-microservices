import tokenBucketService from "../services/tokenBucketService.js";
import { AppError, asyncHandler } from "../utils/errorHandler.js";
import Logger from "../utils/logger.js";
import config from "../config/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Check if a request should be allowed based on rate limit
 *
 * This is the main endpoint that API Gateway will call
 */
export const checkRateLimit = asyncHandler(async (req, res) => {
  const { apiKey, tokens = 1 } = req.body;

  if (!apiKey) {
    throw new AppError("API key is required", 400);
  }

  if (tokens < 1 || tokens > 100) {
    throw new AppError("Tokens must be between 1 and 100", 400);
  }

  // Check rate limit
  const result = await tokenBucketService.checkLimit(apiKey, tokens);

  // Set rate limit headers
  res.set({
    "X-RateLimit-Limit": result.limit,
    "X-RateLimit-Remaining": result.remaining,
    "X-RateLimit-Reset": result.resetIn,
  });

  if (result.allowed) {
    logger.info("Rate limit check - ALLOWED", {
      apiKey: apiKey.substring(0, 8) + "***",
      remaining: result.remaining,
    });

    res.status(200).json({
      success: true,
      allowed: true,
      data: {
        remaining: result.remaining,
        limit: result.limit,
        resetIn: result.resetIn,
      },
    });
  } else {
    logger.warn("Rate limit check - BLOCKED", {
      apiKey: apiKey.substring(0, 8) + "***",
      resetIn: result.resetIn,
    });

    res.status(429).json({
      success: false,
      allowed: false,
      error: {
        message: "Rate limit exceeded",
        statusCode: 429,
        remaining: result.remaining,
        resetIn: result.resetIn,
      },
    });
  }
});

/**
 * Get current rate limit status for an API key
 */
export const getRateLimitStatus = asyncHandler(async (req, res) => {
  const { apiKey } = req.params;

  if (!apiKey) {
    throw new AppError("API key is required", 400);
  }

  const status = await tokenBucketService.getStatus(apiKey);

  res.status(200).json({
    success: true,
    data: {
      apiKey: apiKey.substring(0, 8) + "***",
      tokens: status.tokens,
      capacity: status.capacity,
      refillRate: status.refillRate,
      lastRefill: status.lastRefill,
    },
  });
});

/**
 * Reset rate limit bucket for an API key (admin function)
 */
export const resetRateLimit = asyncHandler(async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    throw new AppError("API key is required", 400);
  }

  const result = await tokenBucketService.resetBucket(apiKey);

  logger.info("Rate limit reset", { apiKey: apiKey.substring(0, 8) + "***" });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Set custom rate limit for specific API key (admin function)
 */
export const setCustomRateLimit = asyncHandler(async (req, res) => {
  const { apiKey, limit, refillRate } = req.body;

  if (!apiKey) {
    throw new AppError("API key is required", 400);
  }

  if (!limit || limit < 1) {
    throw new AppError("Limit must be a positive number", 400);
  }

  const result = await tokenBucketService.setCustomLimit(
    apiKey,
    limit,
    refillRate,
  );

  logger.info("Custom rate limit set", {
    apiKey: apiKey.substring(0, 8) + "***",
    limit,
    refillRate,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});
