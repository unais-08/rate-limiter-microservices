import jwt from "jsonwebtoken";
import config from "../config/index.js";

/**
 * Simple authentication middleware
 * In production, use proper JWT with database-backed users
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No authorization token provided",
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
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
export const login = (req, res) => {
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

      return res.json({
        success: true,
        token,
        expiresIn: "24h",
      });
    }

    return res.status(401).json({
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
