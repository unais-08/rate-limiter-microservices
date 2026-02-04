import express from "express";
import {
  getUserData,
  processData,
  listResources,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/backendController.js";

const router = express.Router();

/**
 * Backend API routes
 * These are the protected endpoints that will be accessed via the API Gateway
 */

// User-related endpoints
router.get("/users/:userId", getUserData);

// Data processing endpoint
router.post("/process", processData);

// Resource CRUD endpoints
router.get("/resources", listResources);
router.post("/resources", createResource);
router.put("/resources/:resourceId", updateResource);
router.delete("/resources/:resourceId", deleteResource);

export default router;
