import { Router } from "express";
import apiKeyController from "../controllers/apiKeyController.js";

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

export default router;