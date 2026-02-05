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
router.get("/users", (req, res) => {
  // Simple endpoint for testing rate limiting
  res.json({
    success: true,
    data: {
      users: [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" },
        { id: 3, name: "Charlie", email: "charlie@example.com" },
      ],
      count: 3,
    },
  });
});

router.get("/users/:userId", getUserData);

// Data processing endpoint
router.post("/process", processData);

// Resource CRUD endpoints
router.get("/resources", listResources);
router.post("/resources", createResource);
router.put("/resources/:resourceId", updateResource);
router.delete("/resources/:resourceId", deleteResource);

export default router;
