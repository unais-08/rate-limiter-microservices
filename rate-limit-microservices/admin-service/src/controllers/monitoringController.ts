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
   * Get system metrics (scoped to user)
   */
  async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenantContext) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const metrics = await monitoringService.getSystemMetrics(
        req.tenantContext.userId,
      );

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
   * Get dashboard data (scoped to user)
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenantContext) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const dashboard = await monitoringService.getDashboardData(
        req.tenantContext.userId,
      );

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
   * Get time-series data (scoped to user)
   */
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenantContext) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { hours = "24", interval = "hour", apiKey } = req.query;

      const data = await monitoringService.getTimeSeriesData(
        req.tenantContext.userId,
        parseInt(hours as string, 10),
        interval as string,
        apiKey as string | undefined,
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
   * Get endpoint analytics (scoped to user)
   */
  async getEndpointAnalytics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenantContext) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const data = await monitoringService.getEndpointAnalytics(
        req.tenantContext.userId,
      );

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
   * Get top rate-limited keys (scoped to user)
   */
  async getTopRateLimited(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tenantContext) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { limit = "10" } = req.query;

      const data = await monitoringService.getTopRateLimitedKeys(
        req.tenantContext.userId,
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
