import monitoringService from "../services/monitoringService.js";

class MonitoringController {
  /**
   * Get health of all services
   */
  async getServicesHealth(req, res) {
    try {
      const health = await monitoringService.checkAllServicesHealth();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      console.error("Error checking services health:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check services health",
      });
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(req, res) {
    try {
      const metrics = await monitoringService.getSystemMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Error getting system metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system metrics",
      });
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboard(req, res) {
    try {
      const dashboard = await monitoringService.getDashboardData();

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get dashboard data",
      });
    }
  }

  /**
   * Get time-series data
   */
  async getTimeSeries(req, res) {
    try {
      const { hours = 24, interval = "hour" } = req.query;

      const data = await monitoringService.getTimeSeriesData(
        parseInt(hours),
        interval,
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error getting time-series data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get time-series data",
      });
    }
  }

  /**
   * Get endpoint analytics
   */
  async getEndpointAnalytics(req, res) {
    try {
      const data = await monitoringService.getEndpointAnalytics();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error getting endpoint analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get endpoint analytics",
      });
    }
  }

  /**
   * Get top rate-limited keys
   */
  async getTopRateLimited(req, res) {
    try {
      const { limit = 10 } = req.query;

      const data = await monitoringService.getTopRateLimitedKeys(
        parseInt(limit),
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error getting top rate-limited keys:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get top rate-limited keys",
      });
    }
  }
}

export default new MonitoringController();
