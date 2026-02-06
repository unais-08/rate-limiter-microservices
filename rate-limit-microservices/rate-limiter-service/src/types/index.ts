import type { RedisClientType } from "redis";
import type { Request, Response, NextFunction } from "express";

/**
 * Log levels enum
 */
export type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * Logger metadata
 */
export interface LogMetadata {
  readonly [key: string]: unknown;
}

/**
 * Configuration types
 */
export interface RedisConfig {
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly db: number;
}

export interface RateLimitConfig {
  readonly defaultTokens: number;
  readonly refillRate: number;
  readonly maxBurst: number;
  readonly bucketTTL?: number;
  readonly failOpen?: boolean;
}

export interface Config {
  readonly port: number;
  readonly env: string;
  readonly serviceName: string;
  readonly logLevel: LogLevel;
  readonly redis: RedisConfig;
  readonly rateLimit: RateLimitConfig;
}

/**
 * Token bucket data structure
 */
export interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetIn: number;
  readonly limit: number;
  readonly requestedTokens?: number;
  readonly error?: string;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  readonly tokens: number;
  readonly capacity: number;
  readonly refillRate: number;
  readonly lastRefill?: number;
}

/**
 * API Key metadata
 */
export interface ApiKeyMetadata {
  maxBurst?: string;
  refillRate?: string;
  tokensPerWindow?: string;
}

/**
 * Custom limit set result
 */
export interface CustomLimitResult {
  readonly success: boolean;
  readonly message: string;
  readonly limit?: number;
  readonly refillRate?: number;
}

/**
 * Lua script result type
 */
export type LuaScriptResult = [number, number, number, number];

/**
 * Redis client type
 */
export type RedisClient = RedisClientType;

/**
 * Error response
 */
export interface ErrorResponse {
  readonly success: false;
  readonly error: {
    readonly message: string;
    readonly statusCode: number;
    readonly timestamp?: string;
  };
}

/**
 * Success response
 */
export interface SuccessResponse<T = unknown> {
  readonly success: true;
  readonly data?: T;
  readonly message?: string;
}

/**
 * Express middleware types
 */
export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export type ErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
