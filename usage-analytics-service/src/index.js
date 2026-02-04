import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { initializeDatabase, closePool } from "./config/database.js";
import logger from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "usage-analytics-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/analytics", analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      logger.success(`Usage Analytics Service running on port ${PORT}`);
      logger.info("Available endpoints:");
      logger.info("  POST   /api/analytics/log");
      logger.info("  GET    /api/analytics/api-keys");
      logger.info("  GET    /api/analytics/api-keys/:apiKey");
      logger.info("  GET    /api/analytics/endpoints");
      logger.info("  GET    /api/analytics/time-series");
      logger.info("  GET    /api/analytics/top-rate-limited");
      logger.info("  GET    /api/analytics/system-stats");
      logger.info("  GET    /health");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await closePool();
  process.exit(0);
});

// Start the server
startServer();
