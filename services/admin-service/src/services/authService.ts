import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger("admin-service:auth-service");

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  plan: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData) {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and quota in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          plan: "free",
        },
      });

      // Create default quota for user
      await tx.quota.create({
        data: {
          userId: newUser.id,
          maxApiKeys: 5,
          maxRequestsPerDay: 10000,
          maxEndpoints: 10,
        },
      });

      return newUser;
    });

    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
    });

    // Generate JWT token
    const token = this._generateToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      token,
      expiresIn: "24h",
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });

    // Generate JWT token
    const token = this._generateToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      token,
      expiresIn: "24h",
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        quota: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      quota: user.quota,
    };
  }

  /**
   * Generate JWT token
   */
  private _generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: "24h",
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
}

export default new AuthService();
