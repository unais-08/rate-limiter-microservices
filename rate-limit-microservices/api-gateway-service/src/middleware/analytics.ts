import analyticsClient from "../services/analyticsClient.js";
import type { RouteHandler, AnalyticsRequestData } from "../types/index.js";
import type { Response } from "express";

/**
 * Analytics Logging Middleware
 *
 * Captures request/response metrics and logs them to the Analytics Service
 * This middleware should be added AFTER all processing is done
 */
export const analyticsMiddleware: RouteHandler = (req, res, next) => {
  // Capture start time
  const startTime = Date.now();

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  // Override res.json to capture response before sending
  res.json = function (body: unknown): Response {
    // Calculate response time
    const responseTimeMs = Date.now() - startTime;

    // Log to analytics service (async, non-blocking)
    const analyticsData: AnalyticsRequestData = {
      apiKey: req.apiKey || "unknown",
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      responseTimeMs,
      rateLimitHit: res.statusCode === 429,
    };

    // Send to analytics service (don't wait for response)
    analyticsClient.logRequest(analyticsData).catch(() => {
      // Already logged in client, just catch to prevent unhandled promise rejection
    });

    // Call original json method to send response
    return originalJson(body);
  };

  next();
};

/**
 * Response Time Tracking Middleware
 * Alternative simpler version that just tracks timing
 */
export const responseTimeMiddleware: RouteHandler = (req, _res, next) => {
  req.startTime = Date.now();
  next();
};

/**
 * Final Analytics Logger
 * Use with response-time middleware
 * Place this at the very end of middleware chain
 */
export const logRequestAnalytics: RouteHandler = (req, res, next) => {
  // This runs after response is sent
  res.on("finish", () => {
    const responseTimeMs = Date.now() - (req.startTime || Date.now());

    const analyticsData: AnalyticsRequestData = {
      apiKey: req.apiKey || "unknown",
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      responseTimeMs,
      rateLimitHit: res.statusCode === 429,
    };

    // Log asynchronously (fire and forget)
    analyticsClient.logRequest(analyticsData).catch(() => {
      // Silently fail - analytics shouldn't affect main flow
    });
  });

  next();
};
