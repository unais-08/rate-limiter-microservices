import { Router, Request, Response } from "express";
import apiKeyController from "../controllers/apiKeyController.js";
import backendEndpointService from "../services/backendEndpointService.js";

const router = Router();

/**
 * POST /api/v1/internal/validate/:apiKey
 * Validate API key - Internal endpoint for service-to-service calls
 * No authentication required - should be protected by network/IP restrictions
 * Called by API Gateway when Redis cache misses
 */
router.post(
  "/validate/:apiKey",
  apiKeyController.validateApiKey.bind(apiKeyController),
);

/**
 * GET /api/v1/internal/endpoint/:userId/:slug
 * Get backend endpoint by user ID and slug - Internal endpoint
 * Used by API Gateway to resolve where to proxy requests
 */
router.get(
  "/endpoint/:userId/:slug",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, slug } = req.params;

      const endpoint = await backendEndpointService.getEndpointBySlug(
        userId,
        slug,
      );

      if (!endpoint) {
        res.status(404).json({
          success: false,
          error: "Endpoint not found",
        });
        return;
      }

      res.json({
        success: true,
        data: endpoint,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  },
);

/**
 * GET /api/v1/internal/endpoints/:userId
 * Get all backend endpoints for a user - Internal endpoint
 * Used by API Gateway to know available routes for a user
 */
router.get("/endpoints/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const endpoints = await backendEndpointService.getEndpoints(userId);

    res.json({
      success: true,
      data: endpoints,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;
