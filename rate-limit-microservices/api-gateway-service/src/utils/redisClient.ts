import { createClient, type RedisClientType } from "redis";
import config from "../config/gatewayService.config.js";
import Logger from "./logger.js";

const logger = new Logger(config.serviceName, config.logLevel);

/**
 * Redis client singleton for API Gateway
 * Used for API key validation caching
 */
class RedisClientWrapper {
  private client: RedisClientType | null;
  private isConnected: boolean;

  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<RedisClientType> {
    try {
      const redisHost = process.env.REDIS_HOST || "localhost";
      const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

      this.client = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
        },
        password: process.env.REDIS_PASSWORD || undefined,
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
  getClient(): RedisClientType {
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
