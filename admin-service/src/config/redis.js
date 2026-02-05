import { createClient } from "redis";
import config from "../config/index.js";

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
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
        console.error("❌ Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("✅ Connected to Redis");
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log("🔌 Disconnected from Redis");
    }
  }

  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error("Redis client not connected");
    }
    return this.client;
  }
}

export default new RedisClient();
