import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/index.js";
import Logger from "./utils/logger.js";
import { errorHandler } from "./utils/errorHandler.js";
import redisClient from "./utils/redisClient.js";
import apiRoutes from "./routes/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Initialize Express application
 */
const createApp = async () => {
  const app = express();

  // Connect to Redis first
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.error("Failed to connect to Redis", { error: error.message });
    throw error;
  }

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logging
  if (config.env === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Health check endpoint
  app.get("/health", async (req, res) => {
    const redisStatus = redisClient.isReady() ? "connected" : "disconnected";

    res.status(200).json({
      success: true,
      service: config.serviceName,
      status: "healthy",
      redis: redisStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use("/api", apiRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: "Resource not found",
        statusCode: 404,
        path: req.originalUrl,
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
