import { Router } from "express";
import {
  getEndpoints,
  getEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  testEndpoint,
} from "../controllers/backendEndpointController.js";

const router = Router();

/**
 * Backend Endpoints Management Routes
 *
 * These routes allow users to configure their own backend services
 * that the API Gateway will proxy requests to.
 *
 * Flow:
 * 1. User creates an endpoint with a slug (e.g., "my-api")
 * 2. User configures their API key to use this endpoint
 * 3. When requests come through gateway with the API key,
 *    they are routed to: /{slug}/... -> user's targetUrl
 */

// GET /api/v1/admin/endpoints - List all endpoints
router.get("/", getEndpoints);

// GET /api/v1/admin/endpoints/:endpointId - Get specific endpoint
router.get("/:endpointId", getEndpoint);

// POST /api/v1/admin/endpoints - Create new endpoint
router.post("/", createEndpoint);

// PUT /api/v1/admin/endpoints/:endpointId - Update endpoint
router.put("/:endpointId", updateEndpoint);

// DELETE /api/v1/admin/endpoints/:endpointId - Delete endpoint
router.delete("/:endpointId", deleteEndpoint);

// POST /api/v1/admin/endpoints/:endpointId/test - Test endpoint connectivity
router.post("/:endpointId/test", testEndpoint);

export default router;
