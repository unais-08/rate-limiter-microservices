import express from "express";
import backendRoutes from "./backendRoutes.js";

const router = express.Router();

/**
 * Mount all API route modules
 */
router.use("/v1", backendRoutes);

// API info endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      users: "/api/v1/users/:userId",
      process: "/api/v1/process",
      resources: {
        list: "/api/v1/resources",
        create: "/api/v1/resources",
        update: "/api/v1/resources/:resourceId",
        delete: "/api/v1/resources/:resourceId",
      },
    },
  });
});

export default router;
