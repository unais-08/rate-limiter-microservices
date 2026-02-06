import { Router } from "express";
import apiKeyController from "../controllers/apiKeyController.js";

const router = Router();

/**
 * POST /api/admin/keys
 * Create a new API key
 */
router.post("/keys", apiKeyController.createApiKey.bind(apiKeyController));

/**
 * GET /api/admin/keys
 * List all API keys
 */
router.get("/keys", apiKeyController.listApiKeys.bind(apiKeyController));

/**
 * GET /api/admin/keys/stats
 * Get API key statistics
 */
router.get("/keys/stats", apiKeyController.getStats.bind(apiKeyController));

/**
 * POST /api/admin/keys/:apiKey/validate
 * Validate API key (called by API Gateway on cache miss)
 */
router.post(
  "/keys/:apiKey/validate",
  apiKeyController.validateApiKey.bind(apiKeyController),
);

/**
 * GET /api/admin/keys/:apiKey
 * Get specific API key details
 */
router.get("/keys/:apiKey", apiKeyController.getApiKey.bind(apiKeyController));

/**
 * PUT /api/admin/keys/:apiKey
 * Update API key configuration
 */
router.put(
  "/keys/:apiKey",
  apiKeyController.updateApiKey.bind(apiKeyController),
);

/**
 * DELETE /api/admin/keys/:apiKey
 * Delete/revoke API key
 */
router.delete(
  "/keys/:apiKey",
  apiKeyController.deleteApiKey.bind(apiKeyController),
);

/**
 * POST /api/admin/keys/:apiKey/reset
 * Reset tokens for API key
 */
router.post(
  "/keys/:apiKey/reset",
  apiKeyController.resetTokens.bind(apiKeyController),
);

export default router;
