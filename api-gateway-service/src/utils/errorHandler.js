/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
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
export const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message, isOperational } = err;

  // Log error details
  const errorLog = {
    message: err.message,
    statusCode,
    isOperational,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    apiKey: req.apiKey ? req.apiKey.substring(0, 8) + "***" : "none",
  };

  if (statusCode >= 500) {
    console.error("Server Error:", JSON.stringify(errorLog));
  } else {
    console.warn("Client Error:", JSON.stringify(errorLog));
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational ? message : "Internal Server Error",
      statusCode,
      timestamp: err.timestamp,
    },
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
