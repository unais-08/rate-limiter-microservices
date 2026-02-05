import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3002,
  env: process.env.NODE_ENV || "development",
  serviceName: "rate-limiter-service",
  logLevel: process.env.LOG_LEVEL || "info",

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // Rate limiting defaults
  rateLimit: {
    // Default tokens per API key
    defaultTokens: parseInt(process.env.DEFAULT_TOKENS) || 10,
    // Token refill rate (tokens per second)
    refillRate: parseInt(process.env.REFILL_RATE) || 1,
    // Maximum burst capacity
    maxBurst: parseInt(process.env.MAX_BURST) || 10,
  },
};

// Validate critical configuration
const validateConfig = () => {
  const required = ["redis.host", "redis.port"];
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
