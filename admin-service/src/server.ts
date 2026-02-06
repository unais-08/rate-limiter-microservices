import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/index.js";
import redisClient from "./config/redis.js";
import prisma from "./config/database.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import { authMiddleware, login } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = config.port;

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
  });
});

// Protected routes (require authentication)
app.use("/api/v1/admin", authMiddleware, apiKeyRoutes);
app.use("/api/v1/admin/monitoring", authMiddleware, monitoringRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Initialize and start server
const startServer = async (): Promise<void> => {
  try {
    // Check PostgreSQL connection via Prisma
    console.log("🔍 Checking PostgreSQL connection...");
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma");

    // Connect to Redis
    console.log("🔍 Connecting to Redis...");
    await redisClient.connect();
    console.log("✅ Redis connected");

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Admin Service running on port ${PORT}`);
      console.log("");
      console.log("📝 Available endpoints:");
      console.log("  POST   /api/v1/admin/login");
      console.log("");
      console.log("  API Key Management:");
      console.log("  POST   /api/v1/admin/keys");
      console.log("  GET    /api/v1/admin/keys");
      console.log("  GET    /api/v1/admin/keys/stats");
      console.log(
        "  POST   /api/v1/admin/keys/:apiKey/validate  ← For API Gateway",
      );
      console.log("  GET    /api/v1/admin/keys/:apiKey");
      console.log("  PUT    /api/v1/admin/keys/:apiKey");
      console.log("  DELETE /api/v1/admin/keys/:apiKey");
      console.log("  POST   /api/v1/admin/keys/:apiKey/reset");
      console.log("");
      console.log("  Monitoring:");
      console.log("  GET    /api/v1/admin/monitoring/health");
      console.log("  GET    /api/v1/admin/monitoring/metrics");
      console.log("");
      console.log("  GET    /health");
      console.log("");
      console.log("🔐 Default login:");
      console.log("   Username: admin");
      console.log("   Password: admin123");
      console.log("");
      console.log("💾 Using Prisma ORM for PostgreSQL");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await redisClient.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await redisClient.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
