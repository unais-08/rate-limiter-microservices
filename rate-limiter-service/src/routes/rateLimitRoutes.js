import express from "express";
import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  setCustomRateLimit,
} from "../controllers/rateLimitController.js";

const router = express.Router();

/**
 * Rate Limiter API routes
 */

// Main endpoint - check if request is allowed
router.post("/check", checkRateLimit);

// Get current status for an API key
router.get("/status/:apiKey", getRateLimitStatus);

// Admin endpoints
router.post("/reset", resetRateLimit);
router.post("/custom-limit", setCustomRateLimit);

export default router;
