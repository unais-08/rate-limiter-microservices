import { Request, Response, NextFunction } from "express";

// Simple internal service authentication
// In production, use proper JWT or service tokens

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isInternal?: boolean;
    }
  }
}

// Default internal service secret (should be set via env in production)
const INTERNAL_SERVICE_SECRET =
  process.env.INTERNAL_SERVICE_SECRET || "internal-service-secret-dev";

/**
 * Extract userId from request headers or body
 * Supports:
 * 1. Internal service-to-service calls (from API Gateway) via x-internal-service-token header
 * 2. Direct calls with userId in request body (for POST /log endpoint)
 * 3. Query parameter fallback for GET endpoints
 */
export const extractUserId = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  // For internal service-to-service calls (from API Gateway)
  const internalToken = req.headers["x-internal-service-token"];

  if (internalToken === INTERNAL_SERVICE_SECRET) {
    req.isInternal = true;
    // API Gateway should send userId in header or body
    req.userId =
      (req.headers["x-user-id"] as string) ||
      req.body?.userId ||
      (req.query.userId as string);
    next();
    return;
  }

  // For POST requests (like /log), get userId from body
  if (req.method === "POST" && req.body?.userId) {
    req.userId = req.body.userId;
    next();
    return;
  }

  // For GET requests, allow userId from query parameter
  // Note: In production, this should be authenticated via JWT
  if (req.query.userId) {
    req.userId = req.query.userId as string;
    next();
    return;
  }

  // No userId found - let the controller handle the error
  next();
};

/**
 * Require userId to be present
 */
export const requireUserId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.userId) {
    res.status(400).json({
      success: false,
      error: "User ID is required",
    });
    return;
  }
  next();
};
