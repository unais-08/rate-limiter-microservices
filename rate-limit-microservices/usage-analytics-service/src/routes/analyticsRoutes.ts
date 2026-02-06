import { Router } from "express";
import analyticsController from "../controllers/analyticsController.js";

const router = Router();

/**
 * POST /api/analytics/log
 * Log a new request (called by API Gateway)
 */
router.post("/log", analyticsController.logRequest.bind(analyticsController));

/**
 * GET /api/analytics/api-keys
 * Get analytics for all API keys
 */
router.get(
  "/api-keys",
  analyticsController.getAllApiKeysAnalytics.bind(analyticsController),
);

/**
 * GET /api/analytics/api-keys/:apiKey
 * Get analytics for a specific API key
 */
router.get(
  "/api-keys/:apiKey",
  analyticsController.getApiKeyAnalytics.bind(analyticsController),
);

/**
 * GET /api/analytics/endpoints
 * Get analytics for all endpoints
 */
router.get(
  "/endpoints",
  analyticsController.getEndpointAnalytics.bind(analyticsController),
);

/**
 * GET /api/analytics/time-series
 * Get time-series data (requests per hour/minute/day)
 * Query params: hours, interval, apiKey
 */
router.get(
  "/time-series",
  analyticsController.getTimeSeriesData.bind(analyticsController),
);

/**
 * GET /api/analytics/top-rate-limited
 * Get top rate-limited API keys
 */
router.get(
  "/top-rate-limited",
  analyticsController.getTopRateLimitedKeys.bind(analyticsController),
);

/**
 * GET /api/analytics/system-stats
 * Get overall system statistics
 */
router.get(
  "/system-stats",
  analyticsController.getSystemStats.bind(analyticsController),
);

export default router;
