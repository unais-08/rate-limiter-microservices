import { Request, Response, NextFunction } from "express";
import Logger from "../utils/logger.js";
import config from "../config/rateLimit.config.js";

const logger = new Logger(config.serviceName, config.logLevel);

// Default internal service secret (should be set via env in production)
const INTERNAL_SERVICE_SECRET =
  process.env.INTERNAL_SERVICE_SECRET || "internal-service-secret-dev";

declare global {
  namespace Express {
    interface Request {
      isInternal?: boolean;
    }
  }
}

/**
 * Internal service authentication middleware
 * Protects admin endpoints from unauthorized access
 * Only allows calls from other internal services with valid token
 */
export const requireInternalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const internalToken = req.headers["x-internal-service-token"];

  if (internalToken === INTERNAL_SERVICE_SECRET) {
    req.isInternal = true;
    next();
    return;
  }

  logger.warn("Unauthorized internal service call attempt", {
    path: req.path,
    ip: req.ip,
  });

  res.status(401).json({
    success: false,
    error: "Unauthorized - Internal service token required",
  });
};
