import createApp from "./app.js";
import config from "./config/index.js";
import Logger from "./utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Start the server
 */
const startServer = async () => {
  try {
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} started successfully`, {
        port: config.port,
        env: config.env,
        nodeVersion: process.version,
        rateLimiterService: config.rateLimiterService.url,
        backendService: config.backendService.url,
      });

      logger.info("API Gateway is ready to accept requests", {
        apiKeyHeader: config.apiKey.headerName,
        apiKeyRequired: config.apiKey.required,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection", { reason, promise });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
