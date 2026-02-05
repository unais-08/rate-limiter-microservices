import apiKeyService from "../services/apiKeyService.js";

class ApiKeyController {
  /**
   * Create a new API key
   */
  async createApiKey(req, res) {
    try {
      const { name, tier, tokensPerWindow, refillRate, maxBurst } = req.body;

      const result = await apiKeyService.createApiKey({
        name,
        tier,
        tokensPerWindow,
        refillRate,
        maxBurst,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create API key",
      });
    }
  }

  /**
   * List all API keys
   */
  async listApiKeys(req, res) {
    try {
      const keys = await apiKeyService.listApiKeys();

      res.json({
        success: true,
        count: keys.length,
        data: keys,
      });
    } catch (error) {
      console.error("Error listing API keys:", error);
      res.status(500).json({
        success: false,
        error: "Failed to list API keys",
      });
    }
  }

  /**
   * Get specific API key details
   */
  async getApiKey(req, res) {
    try {
      const { apiKey } = req.params;

      const result = await apiKeyService.getApiKey(apiKey);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "API key not found",
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting API key:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get API key",
      });
    }
  }

  /**
   * Update API key configuration
   */
  async updateApiKey(req, res) {
    try {
      const { apiKey } = req.params;
      const updates = req.body;

      const result = await apiKeyService.updateApiKey(apiKey, updates);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error updating API key:", error);

      if (error.message === "API key not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to update API key",
      });
    }
  }

  /**
   * Delete/revoke API key
   */
  async deleteApiKey(req, res) {
    try {
      const { apiKey } = req.params;

      const result = await apiKeyService.deleteApiKey(apiKey);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error deleting API key:", error);

      if (error.message === "API key not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete API key",
      });
    }
  }

  /**
   * Reset tokens for API key
   */
  async resetTokens(req, res) {
    try {
      const { apiKey } = req.params;

      const result = await apiKeyService.resetTokens(apiKey);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error resetting tokens:", error);

      if (error.message === "API key not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to reset tokens",
      });
    }
  }

  /**
   * Get API key statistics
   */
  async getStats(req, res) {
    try {
      const stats = await apiKeyService.getApiKeyStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get statistics",
      });
    }
  }
}

export default new ApiKeyController();
