import dotenv from "dotenv";
import { type Server } from "http";
import createApp from "./app.js";
import prisma from "./config/database.js";
import Logger from "./utils/logger.js";

dotenv.config();

const logger = new Logger("usage-analytics-service:server");
const PORT = parseInt(process.env.PORT || "3003", 10);

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    const app = await createApp();

    const server: Server = app.listen(PORT, () => {
      logger.info("Usage Analytics Service started successfully", {
        port: PORT,
        env: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
        logger.info("HTTP server closed");

        // Disconnect from PostgreSQL
        await prisma.$disconnect();

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Unhandled Rejection", { reason, promise });
      process.exit(1);
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

// Start the server
startServer();
