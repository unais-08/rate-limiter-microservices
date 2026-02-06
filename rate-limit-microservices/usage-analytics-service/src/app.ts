import express, { Request, Response, Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import analyticsRoutes from "./routes/analytics.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import prisma from "./config/database.js";
import Logger from "./utils/logger.js";

const logger = new Logger("usage-analytics-service:app");

/**
 * Create and configure Express application
 */
const createApp = async (): Promise<Express> => {
  // Connect to PostgreSQL via Prisma
  logger.debug("Connecting to PostgreSQL...");
  await prisma.$connect();
  logger.info("PostgreSQL connected via Prisma");

  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "usage-analytics-service",
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use("/api/v1/analytics", analyticsRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
