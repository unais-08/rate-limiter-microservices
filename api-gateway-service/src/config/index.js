import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  serviceName: "api-gateway-service",
  logLevel: process.env.LOG_LEVEL || "info",

  // Rate Limiter Service
  rateLimiterService: {
    url: process.env.RATE_LIMITER_URL || "http://localhost:3002",
    timeout: parseInt(process.env.RATE_LIMITER_TIMEOUT) || 5000,
  },

  // Backend Service
  backendService: {
    url: process.env.BACKEND_SERVICE_URL || "http://localhost:3001",
    timeout: parseInt(process.env.BACKEND_TIMEOUT) || 30000,
  },

  // API Key configuration
  apiKey: {
    headerName: process.env.API_KEY_HEADER || "X-API-Key",
    required: process.env.API_KEY_REQUIRED !== "false", // default true
  },
};

// Validate critical configuration
const validateConfig = () => {
  const required = ["rateLimiterService.url", "backendService.url"];
  const missing = required.filter((key) => {
    const keys = key.split(".");
    let value = config;
    for (const k of keys) {
      value = value[k];
    }
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }
};

validateConfig();

export default config;
