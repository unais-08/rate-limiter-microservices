import config from "../config/gatewayService.config.js";
import Logger from "../utils/logger.js";
import { AppError } from "../utils/errorHandler.js";
import type { RouteHandler, ApiKeyVerification } from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * API Key Validation Middleware
 *
 * Extracts and validates API key from request headers
 * Adds apiKey to request object for downstream use
 */
export const validateApiKey: RouteHandler = (req, _res, next) => {
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

  // Basic validation (you can add more complex validation here)
  if (apiKey) {
    // Check format (example: should not be empty or too short)
    if (apiKey.length < 8) {
      logger.warn("Invalid API key format", {
        apiKey: apiKey.substring(0, 4) + "***",
        path: req.path,
      });

      return next(new AppError("Invalid API key format", 401));
    }

    // In production, you would:
    // 1. Check against database
    // 2. Verify it's not expired
    // 3. Check permissions/scope
    // For now, we just validate format

    logger.debug("API key validated", {
      apiKey: apiKey.substring(0, 8) + "***",
      path: req.path,
      ip: req.ip,
    });

    // Attach API key to request for use in other middleware
    req.apiKey = apiKey;
  }

  next();
};

/**
 * Optional: API Key validator that checks against a database or store
 * This is a placeholder for future implementation
 */
export const verifyApiKeyInStore = async (
  apiKey: string,
): Promise<ApiKeyVerification> => {
  // TODO: Implement actual API key verification
  // - Check against database
  // - Verify not revoked
  // - Check rate limit tier
  // - Check allowed endpoints

  // For MVP, we accept any API key with valid format
  return {
    valid: true,
    userId: apiKey.split("_")[1] || "unknown",
    tier: "standard",
    permissions: ["*"],
  };
};
