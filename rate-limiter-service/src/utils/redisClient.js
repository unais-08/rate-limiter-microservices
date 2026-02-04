import { createClient } from "redis";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Redis client singleton
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password,
        database: config.redis.db,
      });

      // Error handling
      this.client.on("error", (err) => {
        logger.error("Redis Client Error", { error: err.message });
      });

      this.client.on("connect", () => {
        logger.info("Redis client connecting...");
      });

      this.client.on("ready", () => {
        logger.info("Redis client connected and ready");
        this.isConnected = true;
      });

      this.client.on("reconnecting", () => {
        logger.warn("Redis client reconnecting...");
      });

      this.client.on("end", () => {
        logger.warn("Redis client disconnected");
        this.isConnected = false;
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      logger.error("Failed to connect to Redis", { error: error.message });
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected. Call connect() first.");
    }
    return this.client;
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.info("Redis connection closed");
    }
  }

  /**
   * Check if connected
   */
  isReady() {
    return this.isConnected;
  }
}

// Export singleton instance
export default new RedisClient();
