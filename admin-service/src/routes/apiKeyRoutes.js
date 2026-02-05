import express from "express";
import apiKeyController from "../controllers/apiKeyController.js";

const router = express.Router();

/**
 * POST /api/admin/keys
 * Create a new API key
 */
router.post("/keys", apiKeyController.createApiKey);

/**
 * GET /api/admin/keys
 * List all API keys
 */
router.get("/keys", apiKeyController.listApiKeys);

/**
 * GET /api/admin/keys/stats
 * Get API key statistics
 */
router.get("/keys/stats", apiKeyController.getStats);

/**
 * GET /api/admin/keys/:apiKey
 * Get specific API key details
 */
router.get("/keys/:apiKey", apiKeyController.getApiKey);

/**
 * PUT /api/admin/keys/:apiKey
 * Update API key configuration
 */
router.put("/keys/:apiKey", apiKeyController.updateApiKey);

/**
 * DELETE /api/admin/keys/:apiKey
 * Delete/revoke API key
 */
router.delete("/keys/:apiKey", apiKeyController.deleteApiKey);

/**
 * POST /api/admin/keys/:apiKey/reset
 * Reset tokens for API key
 */
router.post("/keys/:apiKey/reset", apiKeyController.resetTokens);

export default router;
