import type { Request, Response, NextFunction } from "express";
import type {
  ErrorHandler as ErrorHandlerType,
  AsyncRouteHandler,
} from "../types/index.js";
import Logger from "./logger.js";

const logger = new Logger("rate-limiter-service:errorHandler");

/**
 * Custom application error class
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorHandlerType = (err, req, res, _next) => {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message;
  const isOperational = (err as AppError).isOperational ?? false;

  // Log error details
  const errorLog = {
    message: err.message,
    statusCode,
    isOperational,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  };

  if (statusCode >= 500) {
    logger.error("Server Error", errorLog);
  } else {
    logger.warn("Client Error", errorLog);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational ? message : "Internal Server Error",
      statusCode,
      timestamp: (err as AppError).timestamp,
    },
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: AsyncRouteHandler): AsyncRouteHandler => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
