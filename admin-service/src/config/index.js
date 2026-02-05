import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || "development",

  // Admin Auth
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",

  // Service URLs
  rateLimiterUrl: process.env.RATE_LIMITER_URL || "http://localhost:3002",
  analyticsUrl: process.env.ANALYTICS_URL || "http://localhost:3003",
  gatewayUrl: process.env.GATEWAY_URL || "http://localhost:3000",

  // Redis
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },

  // PostgreSQL
  postgres: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || "rate_limiter_analytics",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
  },

  // Service
  serviceName: process.env.SERVICE_NAME || "admin-service",
  logLevel: process.env.LOG_LEVEL || "info",
};
