import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import prisma from "./config/database.js";
import Logger from "./utils/logger.js";

dotenv.config();

const logger = new Logger("usage-analytics-service", "info");
const app = express();
const PORT = parseInt(process.env.PORT || "3003", 10);

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
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database via Prisma
    await prisma.$connect();
    logger.success("Connected to PostgreSQL via Prisma");

    // Start server
    app.listen(PORT, () => {
      logger.success(`Usage Analytics Service running on port ${PORT}`);
      logger.info("Available endpoints:");
      logger.info("  POST   /api/v1/analytics/log");
      logger.info("  GET    /api/v1/analytics/api-keys");
      logger.info("  GET    /api/v1/analytics/api-keys/:apiKey");
      logger.info("  GET    /api/v1/analytics/endpoints");
      logger.info("  GET    /api/v1/analytics/time-series");
      logger.info("  GET    /api/v1/analytics/top-rate-limited");
      logger.info("  GET    /api/v1/analytics/system-stats");
      logger.info("  GET    /health");
      logger.info("💾 Using Prisma ORM for PostgreSQL");
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : String(error),
      stack:
        process.env.NODE_ENV !== "production" && error instanceof Error
          ? error.stack
          : undefined,
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
