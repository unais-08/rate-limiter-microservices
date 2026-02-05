import express from "express";
import monitoringController from "../controllers/monitoringController.js";

const router = express.Router();

/**
 * GET /api/admin/monitoring/health
 * Check health of all services
 */
router.get("/health", monitoringController.getServicesHealth);

/**
 * GET /api/admin/monitoring/metrics
 * Get system-wide metrics
 */
router.get("/metrics", monitoringController.getSystemMetrics);

/**
 * GET /api/admin/monitoring/dashboard
 * Get comprehensive dashboard data
 */
router.get("/dashboard", monitoringController.getDashboard);

/**
 * GET /api/admin/monitoring/time-series
 * Get time-series data
 */
router.get("/time-series", monitoringController.getTimeSeries);

/**
 * GET /api/admin/monitoring/endpoints
 * Get endpoint analytics
 */
router.get("/endpoints", monitoringController.getEndpointAnalytics);

/**
 * GET /api/admin/monitoring/top-rate-limited
 * Get top rate-limited API keys
 */
router.get("/top-rate-limited", monitoringController.getTopRateLimited);

export default router;
