import { Request, Response, NextFunction } from "express";
import backendEndpointService from "../services/backendEndpointService.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:backendEndpointController");

/**
 * Get all backend endpoints for current user
 */
export const getEndpoints = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = (req as any).tenantContext;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const endpoints = await backendEndpointService.getEndpoints(userId);

    res.json({
      success: true,
      data: endpoints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single backend endpoint
 */
export const getEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = (req as any).tenantContext;
    const { endpointId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const endpoint = await backendEndpointService.getEndpointById(
      endpointId,
      userId,
    );

    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
      });
      return;
    }

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new backend endpoint
 */
export const createEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = (req as any).tenantContext;
    const { name, slug, targetUrl, healthCheck, authType, authConfig } =
      req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    if (!name || !slug || !targetUrl) {
      res.status(400).json({
        success: false,
        error: "Name, slug, and target URL are required",
      });
      return;
    }

    const endpoint = await backendEndpointService.createEndpoint(userId, {
      name,
      slug,
      targetUrl,
      healthCheck,
      authType,
      authConfig,
    });

    logger.info("Backend endpoint created", {
      userId,
      endpointId: endpoint.id,
      slug,
    });

    res.status(201).json({
      success: true,
      data: endpoint,
      message: "Backend endpoint created successfully",
    });
  } catch (error: any) {
    if (
      error.message.includes("already exists") ||
      error.message.includes("limit reached") ||
      error.message.includes("Invalid")
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Update a backend endpoint
 */
export const updateEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = (req as any).tenantContext;
    const { endpointId } = req.params;
    const { name, targetUrl, healthCheck, authType, authConfig, enabled } =
      req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const endpoint = await backendEndpointService.updateEndpoint(
      endpointId,
      userId,
      {
        name,
        targetUrl,
        healthCheck,
        authType,
        authConfig,
        enabled,
      },
    );

    res.json({
      success: true,
      data: endpoint,
      message: "Backend endpoint updated successfully",
    });
  } catch (error: any) {
    if (error.message === "Endpoint not found") {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    if (error.message.includes("Invalid")) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Delete a backend endpoint
 */
export const deleteEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = (req as any).tenantContext;
    const { endpointId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    await backendEndpointService.deleteEndpoint(endpointId, userId);

    res.json({
      success: true,
      message: "Backend endpoint deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Endpoint not found") {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Test endpoint connectivity
 */
export const testEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = (req as any).tenantContext;
    const { endpointId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const result = await backendEndpointService.testEndpoint(
      endpointId,
      userId,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Endpoint not found") {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
};
