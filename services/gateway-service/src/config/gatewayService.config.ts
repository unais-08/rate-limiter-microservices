import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { Config, LogLevel } from "../types/index.js";

// Load environment variables with .env.local priority for local development
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(serviceRoot, ".env.local") });
dotenv.config({ path: path.join(serviceRoot, ".env") });

const config: Config = {
  port: parseInt(process.env.PORT || "3000", 10),
  env: process.env.NODE_ENV || "development",
  serviceName: "api-gateway-service",
  logLevel: (process.env.LOG_LEVEL as LogLevel) || "info",

  // Rate Limiter Service
  rateLimiterService: {
    url: process.env.RATE_LIMITER_URL || "http://localhost:3001",
    timeout: parseInt(process.env.RATE_LIMITER_TIMEOUT || "5000", 10),
  },

  // Backend Service
  backendService: {
    url: process.env.BACKEND_SERVICE_URL || "http://localhost:5000",
    timeout: parseInt(process.env.BACKEND_TIMEOUT || "30000", 10),
  },

  // API Key configuration
  apiKey: {
    headerName: process.env.API_KEY_HEADER || "X-API-Key",
    required: process.env.API_KEY_REQUIRED !== "false", // default true
  },
};

/**
 * Validate critical configuration
 */
const validateConfig = (): void => {
  const required: Array<keyof Config | string> = [
    "rateLimiterService.url",
    "backendService.url",
  ];
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
};

validateConfig();

export default config;
