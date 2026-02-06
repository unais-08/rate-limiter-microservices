import { createClient, RedisClientType } from "redis";
import config from "./index.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:redis");

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<RedisClientType> {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
      });

      this.client.on("error", (err) => {
        logger.error("Redis Client Error", { error: err });
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Connected to Redis");
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error("Failed to connect to Redis", {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Disconnected from Redis");
    }
  }

  getClient(): RedisClientType {
    if (!this.isConnected || !this.client) {
      throw new Error("Redis client is not connected. Call connect() first.");
    }
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

export default new RedisClient();
