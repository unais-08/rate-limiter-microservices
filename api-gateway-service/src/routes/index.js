import express from "express";
import gatewayRoutes from "./gatewayRoutes.js";

const router = express.Router();

/**
 * Mount all route modules
 */
router.use(gatewayRoutes);

// Gateway info endpoint (no auth required)
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway Service",
    version: "1.0.0",
    description: "Centralized API gateway with rate limiting",
    usage: {
      authentication: "Include X-API-Key header in your requests",
      example:
        "curl -H 'X-API-Key: your_key_here' http://gateway/api/v1/users/123",
    },
    endpoints: {
      backend: "/api/*",
      health: "/health",
    },
  });
});

export default router;
