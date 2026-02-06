import { Request, Response } from "express";
import analyticsService from "../services/analyticsService.js";

class AnalyticsController {
  /**
   * Log a new request (called by API Gateway)
   */
  async logRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;

      // Validate required fields
      const requiredFields = [
        "apiKey",
        "endpoint",
        "method",
        "statusCode",
        "responseTimeMs",
      ];
      const missingFields = requiredFields.filter(
        (field) => !(field in requestData),
      );

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
        return;
      }

      const result = await analyticsService.logRequest(requestData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ Error in logRequest:", error);
      res.status(500).json({
        success: false,
        error: "Failed to log request",
      });
    }
  }

  /**
   * Get analytics for a specific API key
   */
  async getApiKeyAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey } = req.params;
      const { limit, offset } = req.query;

      const analytics = await analyticsService.getApiKeyAnalytics(apiKey, {
        limit: parseInt(limit as string) || 100,
        offset: parseInt(offset as string) || 0,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("❌ Error in getApiKeyAnalytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get API key analytics",
      });
    }
  }

  /**
   * Get analytics for all API keys
   */
  async getAllApiKeysAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { limit, offset } = req.query;

      const analytics = await analyticsService.getAllApiKeysAnalytics({
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("❌ Error in getAllApiKeysAnalytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get all API keys analytics",
      });
    }
  }

  /**
   * Get endpoint analytics
   */
  async getEndpointAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { limit, offset } = req.query;

      const analytics = await analyticsService.getEndpointAnalytics({
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("❌ Error in getEndpointAnalytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get endpoint analytics",
      });
    }
  }

  /**
   * Get time-series data
   */
  async getTimeSeriesData(req: Request, res: Response): Promise<void> {
    try {
      const { hours, interval, apiKey } = req.query;

      const data = await analyticsService.getTimeSeriesData({
        hours: parseInt(hours as string) || 24,
        interval: (interval as string) || "hour",
        apiKey: (apiKey as string) || null,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("❌ Error in getTimeSeriesData:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get time-series data",
      });
    }
  }

  /**
   * Get top rate-limited API keys
   */
  async getTopRateLimitedKeys(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;

      const data = await analyticsService.getTopRateLimitedKeys(
        parseInt(limit as string) || 10,
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("❌ Error in getTopRateLimitedKeys:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get top rate-limited keys",
      });
    }
  }

  /**
   * Get overall system statistics
   */
  async getSystemStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getSystemStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("❌ Error in getSystemStats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system stats",
      });
    }
  }
}

export default new AnalyticsController();
