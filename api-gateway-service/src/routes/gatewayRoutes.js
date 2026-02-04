import express from "express";
import { validateApiKey } from "../middleware/apiKeyValidator.js";
import { rateLimitMiddleware } from "../middleware/rateLimiter.js";
import { proxyToBackend } from "../controllers/gatewayController.js";

const router = express.Router();

/**
 * Gateway Routes
 * All requests to /api/* go through:
 * 1. API key validation
 * 2. Rate limit check
 * 3. Proxy to backend
 */

// Apply middleware chain and proxy all /api/* requests
router.all("/api/*", validateApiKey, rateLimitMiddleware, proxyToBackend);

export default router;
