import { Router } from "express";
import redisClient from "../config/redis.js";
import prisma from "../config/database.js";
import monitoringController from "../controllers/monitoringController.js";

const router = Router();

/**
 * GET /api/admin/monitoring/health
 * Get health status (local service health)
 */
router.get("/health", async (_req, res) => {
  try {
    const redisConnected = redisClient.isClientConnected();

    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (_error) {
      dbConnected = false;
    }

    res.json({
      success: true,
      status: redisConnected && dbConnected ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisConnected ? "connected" : "disconnected",
        database: dbConnected ? "connected" : "disconnected",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check health",
    });
  }
});

/**
 * GET /api/admin/monitoring/metrics
 * Get system metrics
 */
router.get(
  "/metrics",
  monitoringController.getSystemMetrics.bind(monitoringController),
);

/**
 * GET /api/admin/monitoring/dashboard
 * Get comprehensive dashboard data
 */
router.get(
  "/dashboard",
  monitoringController.getDashboard.bind(monitoringController),
);

/**
 * GET /api/admin/monitoring/time-series
 * Get time-series analytics data
 */
router.get(
  "/time-series",
  monitoringController.getTimeSeries.bind(monitoringController),
);

/**
 * GET /api/admin/monitoring/endpoints
 * Get endpoint analytics
 */
router.get(
  "/endpoints",
  monitoringController.getEndpointAnalytics.bind(monitoringController),
);

/**
 * GET /api/admin/monitoring/top-rate-limited
 * Get top rate-limited API keys
 */
router.get(
  "/top-rate-limited",
  monitoringController.getTopRateLimited.bind(monitoringController),
);

export default router;
