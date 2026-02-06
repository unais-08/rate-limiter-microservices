import { createClient } from "redis";
import config from "../config/rateLimit.config.js";
import Logger from "../utils/logger.js";
import type { RedisClient } from "../types/index.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Redis client singleton
 */
class RedisClientWrapper {
  private client: RedisClient | null;
  private isConnected: boolean;

  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<RedisClient> {
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
      this.client.on("error", (err: Error) => {
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
      logger.error("Failed to connect to Redis", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): RedisClient {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected. Call connect() first.");
    }
    return this.client;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info("Redis connection closed");
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export default new RedisClientWrapper();
