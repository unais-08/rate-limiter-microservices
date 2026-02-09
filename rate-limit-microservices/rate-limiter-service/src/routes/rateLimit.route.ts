import express, { type Router } from "express";
import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  setCustomRateLimit,
} from "../controllers/rateLimit.controller.js";
import { requireInternalAuth } from "../middleware/internalAuth.js";

const router: Router = express.Router();

/**
 * Rate Limiter API routes
 */

// Main endpoint - check if request is allowed (called by API Gateway)
router.post("/check", checkRateLimit);

// Get current status for an API key
router.get("/status/:apiKey", getRateLimitStatus);

// Admin endpoints (protected by internal service auth)
router.post("/reset", requireInternalAuth, resetRateLimit);
router.post("/custom-limit", requireInternalAuth, setCustomRateLimit);

export default router;
