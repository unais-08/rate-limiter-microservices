import express, { Request, Response, Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import apiKeyRoutes from "./routes/apiKey.routes.js";
import monitoringRoutes from "./routes/monitoring.routes.js";
import internalRoutes from "./routes/internal.route.js";
import { authMiddleware, login } from "./middleware/auth.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import redisClient from "./config/redis.js";
import prisma from "./config/database.js";
import Logger from "./utils/logger.js";

const logger = new Logger("admin-service:app");

/**
 * Create and configure Express application
 */
const createApp = async (): Promise<Express> => {
  // Connect to PostgreSQL
  logger.debug("Connecting to PostgreSQL...");
  await prisma.$connect();
  logger.info("PostgreSQL connected via Prisma");

  // Connect to Redis
  logger.debug("Connecting to Redis...");
  await redisClient.connect();
  logger.info("Redis connected");

  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  // Public routes
  app.post("/api/v1/admin/login", login);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "admin-service",
      timestamp: new Date().toISOString(),
      PORT: process.env.PORT || 3004,
    });
  });

  // Internal routes (no authentication) - for service-to-service calls
  // Should be protected by network/IP restrictions in production
  app.use("/api/v1/internal", internalRoutes);
  // Protected routes (require authentication)
  app.use("/api/v1/admin", authMiddleware, apiKeyRoutes);
  app.use("/api/v1/admin/monitoring", authMiddleware, monitoringRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
