import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/index.js";
import Logger from "./utils/logger.js";
import { errorHandler } from "./utils/errorHandler.js";
import routes from "./routes/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Initialize Express application
 */
const createApp = () => {
  const app = express();

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

  // Trust proxy (for X-Forwarded-* headers)
  app.set("trust proxy", true);

  // Health check endpoint (no auth required)
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      service: config.serviceName,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        rateLimiter: config.rateLimiterService.url,
        backend: config.backendService.url,
      },
    });
  });

  // Mount routes
  app.use("/", routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: "Route not found",
        statusCode: 404,
        path: req.originalUrl,
        hint: "Protected endpoints are under /api/*",
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
