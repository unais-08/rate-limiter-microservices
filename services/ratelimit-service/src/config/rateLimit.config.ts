import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { Config, LogLevel } from "../types/index.js";
import Logger from "../utils/logger.js";

// Load environment variables with .env.local priority for local development
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(serviceRoot, ".env.local") });
dotenv.config({ path: path.join(serviceRoot, ".env") });
const logger = new Logger("rate-limiter-service", "debug");
const config: Config = {
  port: parseInt(process.env.PORT || "3001", 10),
  env: process.env.NODE_ENV || "development",
  serviceName: "rate-limiter-service",
  logLevel: (process.env.LOG_LEVEL as LogLevel) || "info",

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
  },

  // Rate limiting defaults
  rateLimit: {
    // Default tokens per API key
    defaultTokens: parseInt("2", 10),
    // Token refill rate (tokens per second)
    refillRate: parseFloat("0.2"),
    // Maximum burst capacity
    maxBurst: parseInt("2", 10),
  },
};

/**
 * Validate critical configuration
 */
const validateConfig = (): void => {
  const required: Array<keyof Config | string> = ["redis.host", "redis.port"];
  const missing = required.filter((key) => {
    const keys = key.split(".");
    let value: unknown = config;
    for (const k of keys) {
      value = (value as Record<string, unknown>)[k];
    }
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }
  logger.debug("Environment variables loaded", { rateLimit: config.rateLimit });
};

validateConfig();

export default config;
