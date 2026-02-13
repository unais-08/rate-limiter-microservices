import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || "development",
  serviceName: "backend-service",
  logLevel: process.env.LOG_LEVEL || "info",
};

// Validate critical configuration
const validateConfig = () => {
  const required = [];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

validateConfig();

export default config;
