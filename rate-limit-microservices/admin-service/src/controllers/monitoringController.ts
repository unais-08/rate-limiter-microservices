import { Request, Response } from "express";
import monitoringService from "../services/monitoringService.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:controller");

class MonitoringController {
  /**
   * Get health of all services
   */
  async getServicesHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await monitoringService.checkAllServicesHealth();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error("Error checking services health", { error });
      res.status(500).json({
        success: false,
        error: "Failed to check services health",
      });
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await monitoringService.getSystemMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Error getting system metrics", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get system metrics",
      });
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await monitoringService.getDashboardData();

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error("Error getting dashboard data", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get dashboard data",
      });
    }
  }

  /**
   * Get time-series data
   */
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      const { hours = "24", interval = "hour" } = req.query;

      const data = await monitoringService.getTimeSeriesData(
        parseInt(hours as string, 10),
        interval as string,
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error("Error getting time-series data", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get time-series data",
      });
    }
  }

  /**
   * Get endpoint analytics
   */
  async getEndpointAnalytics(_req: Request, res: Response): Promise<void> {
    try {
      const data = await monitoringService.getEndpointAnalytics();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error("Error getting endpoint analytics", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get endpoint analytics",
      });
    }
  }

  /**
   * Get top rate-limited keys
   */
  async getTopRateLimited(req: Request, res: Response): Promise<void> {
    try {
      const { limit = "10" } = req.query;

      const data = await monitoringService.getTopRateLimitedKeys(
        parseInt(limit as string, 10),
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error("Error getting top rate-limited keys", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get top rate-limited keys",
      });
    }
  }
}

export default new MonitoringController();
