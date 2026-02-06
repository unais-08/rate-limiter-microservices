import config from "../config/gatewayService.config.js";
import Logger from "../utils/logger.js";
import { AppError } from "../utils/errorHandler.js";
import apiKeyValidationService from "../services/apiKeyValidationService.js";
import type { RouteHandler } from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * API Key Validation Middleware
 *
 * Extracts and validates API key from request headers
 * Validates against Redis (Admin Service's source of truth)
 * Adds apiKey and metadata to request object for downstream use
 */
export const validateApiKey: RouteHandler = async (req, _res, next) => {
  const apiKey = req.headers[config.apiKey.headerName.toLowerCase()] as
    | string
    | undefined;

  // Check if API key is required
  if (config.apiKey.required && !apiKey) {
    logger.warn("Missing API key", {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    return next(
      new AppError(`Missing ${config.apiKey.headerName} header`, 401),
    );
  }

  // Basic format validation
  if (apiKey) {
    // Check format (example: should not be empty or too short)
    if (apiKey.length < 8) {
      logger.warn("Invalid API key format", {
        apiKey: apiKey.substring(0, 4) + "***",
        path: req.path,
      });

      return next(new AppError("Invalid API key format", 401));
    }

    // Quick check: Is this key in negative cache (known invalid)?
    const isInvalid = await apiKeyValidationService.isInNegativeCache(apiKey);
    if (isInvalid) {
      logger.warn("API key in negative cache", {
        apiKey: apiKey.substring(0, 8) + "***",
        path: req.path,
      });
      return next(new AppError("Invalid API key", 401));
    }

    // Validate API key against Redis (Admin Service's storage)
    const verification = await apiKeyValidationService.validateApiKey(apiKey);

    if (!verification.valid) {
      logger.warn("API key validation failed", {
        apiKey: apiKey.substring(0, 8) + "***",
        path: req.path,
      });
      return next(new AppError("Invalid or disabled API key", 401));
    }

    logger.debug("API key validated", {
      apiKey: apiKey.substring(0, 8) + "***",
      path: req.path,
      ip: req.ip,
      tier: verification.tier,
    });

    // Attach API key and metadata to request for use in other middleware
    req.apiKey = apiKey;
    req.apiKeyMetadata = verification;
  }

  next();
};
