import express, { type Router, type Request, type Response } from "express";
import rateLimitRoutes from "./rateLimit.route.js";

const router: Router = express.Router();

/**
 * Mount all API route modules
 */
router.use("/v1/ratelimit", rateLimitRoutes);

// API info endpoint
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Rate Limiter Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      checkLimit: "POST /api/v1/ratelimit/check",
      getStatus: "GET /api/v1/ratelimit/status/:apiKey",
      reset: "POST /api/v1/ratelimit/reset",
      customLimit: "POST /api/v1/ratelimit/custom-limit",
    },
    algorithm: "Token Bucket",
  });
});

export default router;
