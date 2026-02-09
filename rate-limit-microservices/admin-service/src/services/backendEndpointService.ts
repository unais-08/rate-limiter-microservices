import prisma from "../config/database.js";
import redisClient from "../config/redis.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:backendEndpointService");

// Cache key prefix for endpoint lookups
const ENDPOINT_CACHE_PREFIX = "endpoint:";
const ENDPOINT_CACHE_TTL = 300; // 5 minutes

export interface CreateEndpointInput {
  name: string;
  slug: string;
  targetUrl: string;
  healthCheck?: string;
  authType?: "none" | "bearer" | "basic" | "api-key";
  authConfig?: Record<string, any>;
}

export interface UpdateEndpointInput {
  name?: string;
  targetUrl?: string;
  healthCheck?: string;
  authType?: "none" | "bearer" | "basic" | "api-key";
  authConfig?: Record<string, any>;
  enabled?: boolean;
}

/**
 * Backend Endpoint Service
 * Manages user's backend endpoints for request proxying
 */
class BackendEndpointService {
  /**
   * Get all endpoints for a user
   */
  async getEndpoints(userId: string) {
    const endpoints = await prisma.backendEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return endpoints;
  }

  /**
   * Get a single endpoint by ID
   */
  async getEndpointById(endpointId: string, userId: string) {
    const endpoint = await prisma.backendEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    return endpoint;
  }

  /**
   * Get endpoint by slug (for routing)
   */
  async getEndpointBySlug(userId: string, slug: string) {
    // Try cache first
    const cacheKey = `${ENDPOINT_CACHE_PREFIX}${userId}:${slug}`;
    try {
      const redis = redisClient.getClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug("Endpoint cache hit", { userId, slug });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn("Redis cache error", { error });
    }

    // Query database
    const endpoint = await prisma.backendEndpoint.findFirst({
      where: {
        userId,
        slug,
        enabled: true,
      },
    });

    // Cache result
    if (endpoint) {
      try {
        const redis = redisClient.getClient();
        await redis.setEx(
          cacheKey,
          ENDPOINT_CACHE_TTL,
          JSON.stringify(endpoint),
        );
      } catch (error) {
        logger.warn("Redis cache set error", { error });
      }
    }

    return endpoint;
  }

  /**
   * Create a new backend endpoint
   */
  async createEndpoint(userId: string, input: CreateEndpointInput) {
    // Validate slug format (alphanumeric, hyphens, lowercase)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(input.slug)) {
      throw new Error(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
    }

    // Check for duplicate slug for this user
    const existingSlug = await prisma.backendEndpoint.findFirst({
      where: {
        userId,
        slug: input.slug,
      },
    });

    if (existingSlug) {
      throw new Error(`Endpoint with slug "${input.slug}" already exists`);
    }

    // Validate target URL
    try {
      new URL(input.targetUrl);
    } catch {
      throw new Error("Invalid target URL format");
    }

    // Check user quota
    const quota = await prisma.quota.findUnique({ where: { userId } });
    const maxEndpoints = quota?.maxEndpoints || 10;

    const currentCount = await prisma.backendEndpoint.count({
      where: { userId },
    });

    if (currentCount >= maxEndpoints) {
      throw new Error(
        `Maximum endpoints limit reached (${maxEndpoints}). Upgrade your plan for more.`,
      );
    }

    const endpoint = await prisma.backendEndpoint.create({
      data: {
        userId,
        name: input.name,
        slug: input.slug,
        targetUrl: input.targetUrl,
        healthCheck: input.healthCheck,
        authType: input.authType || "none",
        authConfig: input.authConfig || undefined,
      },
    });

    logger.info("Backend endpoint created", {
      endpointId: endpoint.id,
      userId,
      slug: input.slug,
    });

    return endpoint;
  }

  /**
   * Update a backend endpoint
   */
  async updateEndpoint(
    endpointId: string,
    userId: string,
    input: UpdateEndpointInput,
  ) {
    // Verify ownership
    const existing = await prisma.backendEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Endpoint not found");
    }

    // Validate target URL if provided
    if (input.targetUrl) {
      try {
        new URL(input.targetUrl);
      } catch {
        throw new Error("Invalid target URL format");
      }
    }

    const endpoint = await prisma.backendEndpoint.update({
      where: { id: endpointId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.targetUrl !== undefined && { targetUrl: input.targetUrl }),
        ...(input.healthCheck !== undefined && {
          healthCheck: input.healthCheck,
        }),
        ...(input.authType !== undefined && { authType: input.authType }),
        ...(input.authConfig !== undefined && { authConfig: input.authConfig }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
      },
    });

    // Invalidate cache
    await this.invalidateCache(userId, existing.slug);

    logger.info("Backend endpoint updated", {
      endpointId,
      userId,
    });

    return endpoint;
  }

  /**
   * Delete a backend endpoint
   */
  async deleteEndpoint(endpointId: string, userId: string) {
    // Verify ownership
    const existing = await prisma.backendEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Endpoint not found");
    }

    await prisma.backendEndpoint.delete({
      where: { id: endpointId },
    });

    // Invalidate cache
    await this.invalidateCache(userId, existing.slug);

    logger.info("Backend endpoint deleted", {
      endpointId,
      userId,
      slug: existing.slug,
    });

    return { success: true };
  }

  /**
   * Test endpoint connectivity
   */
  async testEndpoint(endpointId: string, userId: string) {
    const endpoint = await prisma.backendEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    const testUrl = endpoint.healthCheck || endpoint.targetUrl;

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(testUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        url: testUrl,
      };
    } catch (error: any) {
      // Handle different error types
      let errorMessage = "Connection failed";

      if (error?.name === "AbortError") {
        errorMessage = "Request timeout (10s)";
      } else if (error?.cause?.code === "ECONNREFUSED") {
        errorMessage = "Connection refused - server not reachable";
      } else if (error?.cause?.code === "ENOTFOUND") {
        errorMessage = "DNS lookup failed - host not found";
      } else if (error?.cause?.code === "ETIMEDOUT") {
        errorMessage = "Connection timed out";
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      return {
        success: false,
        error: errorMessage,
        url: testUrl,
      };
    }
  }

  /**
   * Invalidate endpoint cache
   */
  private async invalidateCache(userId: string, slug: string) {
    const cacheKey = `${ENDPOINT_CACHE_PREFIX}${userId}:${slug}`;
    try {
      const redis = redisClient.getClient();
      await redis.del(cacheKey);
    } catch (error) {
      logger.warn("Failed to invalidate cache", { cacheKey, error });
    }
  }
}

export default new BackendEndpointService();
