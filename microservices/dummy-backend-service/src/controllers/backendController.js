import backendService from "../services/backendService.js";
import { AppError, asyncHandler } from "../utils/errorHandler.js";

/**
 * Get user data by ID
 */
export const getUserData = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const userData = await backendService.getUserData(userId);

  res.status(200).json({
    success: true,
    data: userData,
  });
});

/**
 * Process incoming data
 */
export const processData = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    throw new AppError("No data provided for processing", 400);
  }

  const result = await backendService.processData(data);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * List resources with pagination
 */
export const listResources = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  if (limit < 1 || limit > 100) {
    throw new AppError("Limit must be between 1 and 100", 400);
  }

  if (offset < 0) {
    throw new AppError("Offset must be non-negative", 400);
  }

  const result = await backendService.listResources(limit, offset);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Create a new resource
 */
export const createResource = asyncHandler(async (req, res) => {
  const { name } = req.body;

  console.log("Received createResource request with name:", name);

  if (!name) {
    throw new AppError("Resource name is required", 400);
  }

  // const result = await backendService.createResource({ name });
  const result = "simulated resource creation result";

  res.status(201).json({
    success: true,
    data: result,
  });
});

/**
 * Update an existing resource
 */
export const updateResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const updates = req.body;

  if (!resourceId) {
    throw new AppError("Resource ID is required", 400);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  const result = await backendService.updateResource(resourceId, updates);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Delete a resource
 */
export const deleteResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  if (!resourceId) {
    throw new AppError("Resource ID is required", 400);
  }

  const result = await backendService.deleteResource(resourceId);

  res.status(200).json({
    success: true,
    data: result,
  });
});
