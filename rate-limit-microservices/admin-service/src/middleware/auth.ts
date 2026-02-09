import { Request, Response, NextFunction } from "express";
import authService from "../services/authService.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:auth");

interface JwtPayload {
  userId: string;
  email: string;
  plan: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantContext?: {
        userId: string;
        email: string;
        plan: string;
      };
    }
  }
}

/**
 * Authentication middleware - extracts and validates JWT token
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No authorization token provided",
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;

      // Set tenant context (user-based tenancy)
      req.tenantContext = {
        userId: decoded.userId,
        email: decoded.email,
        plan: decoded.plan,
      };

      next();
    } catch (_err) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  } catch (error) {
    logger.error("Auth middleware error", { error });
    res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
};

/**
 * Register endpoint
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: "Email, password, and name are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Registration error", { error });
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";

    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Login endpoint
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Login error", { error });

    res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }
};

/**
 * Get current user endpoint
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.tenantContext) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    const user = await authService.getUserById(req.tenantContext.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Get current user error", { error });

    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
};
