import dotenv from "dotenv";
import { type Server } from "http";
import createApp from "./app.js";
import config from "./config/index.js";
import redisClient from "./config/redis.js";
import prisma from "./config/database.js";
import Logger from "./utils/logger.js";

dotenv.config();

const logger = new Logger("admin-service:server");

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    const app = await createApp();

    const server: Server = app.listen(config.port, () => {
      logger.info("Admin Service started successfully", {
        port: config.port,
        env: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
      });

      logger.debug("Admin Service is ready to accept requests", {
        defaultUsername: "admin",
        defaultPassword: "admin123",
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
        logger.info("HTTP server closed");

        // Disconnect from Redis
        await redisClient.disconnect();

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

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    process.on(
      "unhandledRejection",
      (reason: unknown, promise: Promise<unknown>) => {
        logger.error("Unhandled Rejection", { reason, promise });
        process.exit(1);
      },
    );
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
