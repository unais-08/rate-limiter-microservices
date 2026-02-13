import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/gatewayService.config.js";
import { errorHandler } from "./utils/errorHandler.js";
import routes from "./routes/index.js";
import redisClient from "./utils/redisClient.js";
import Logger from "./utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Initialize Express application
 */
const createApp = async (): Promise<Application> => {
  const app: Application = express();

  // Connect to Redis for API key validation
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully for API key validation");
  } catch (error) {
    logger.error("Failed to connect to Redis", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    logger.warn("API key validation will fail without Redis connection");
    // Don't throw - let the app start but warn that validation won't work
  }

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing middleware with increased limits and timeout
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // HTTP request logging
  if (config.env === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Trust proxy (for X-Forwarded-* headers)
  app.set("trust proxy", true);

  // Health check endpoint (no auth required)
  app.get("/health", (_req: Request, res: Response) => {
    const redisStatus = redisClient.isReady() ? "connected" : "disconnected";

    res.status(200).json({
      success: true,
      service: config.serviceName,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: redisStatus,
      services: {
        rateLimiter: config.rateLimiterService.url,
        backend: config.backendService.url,
      },
    });
  });

  // Mount routes
  app.use("/", routes);

  // 404 handler
  app.use((req: Request, res: Response) => {
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
