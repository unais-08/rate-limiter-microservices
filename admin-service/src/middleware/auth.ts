import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

interface JwtPayload {
  username: string;
  role: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Simple authentication middleware
 * In production, use proper JWT with database-backed users
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
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (_err) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
};

/**
 * Login endpoint (not middleware, but related)
 */
export const login = (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body;

    // Simple hardcoded check (in production, use database with hashed passwords)
    if (
      username === config.adminUsername &&
      password === config.adminPassword
    ) {
      const token = jwt.sign({ username, role: "admin" }, config.jwtSecret, {
        expiresIn: "24h",
      });

      res.json({
        success: true,
        token,
        expiresIn: "24h",
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
};
