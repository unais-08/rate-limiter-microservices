import express, { type Router } from "express";
import { validateApiKey } from "../middleware/apiKeyValidator.js";
import { rateLimitMiddleware } from "../middleware/rateLimiter.js";
import {
  responseTimeMiddleware,
  logRequestAnalytics,
} from "../middleware/analytics.js";
import { proxyToBackend } from "../controllers/gateway.controller.js";

const router: Router = express.Router();

/**
 * Gateway Routes
 * All requests to /api/* go through:
 * 1. Response time tracking (start timer)
 * 2. API key validation
 * 3. Rate limit check
 * 4. Proxy to backend
 * 5. Analytics logging (after response)
 */

// Apply middleware chain and proxy all /api/* requests
router.all(
  "/api/*",
  responseTimeMiddleware,
  validateApiKey,
  rateLimitMiddleware,
  logRequestAnalytics,
  proxyToBackend,
);

export default router;
