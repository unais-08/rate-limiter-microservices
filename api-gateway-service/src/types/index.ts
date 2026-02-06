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
export interface RateLimiterServiceConfig {
  readonly url: string;
  readonly timeout: number;
}

export interface BackendServiceConfig {
  readonly url: string;
  readonly timeout: number;
}

export interface ApiKeyConfig {
  readonly headerName: string;
  readonly required: boolean;
}

export interface Config {
  readonly port: number;
  readonly env: string;
  readonly serviceName: string;
  readonly logLevel: LogLevel;
  readonly rateLimiterService: RateLimiterServiceConfig;
  readonly backendService: BackendServiceConfig;
  readonly apiKey: ApiKeyConfig;
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly limit: number;
  readonly resetIn: number;
  readonly error?: string;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  readonly apiKey: string;
  readonly tokens: number;
  readonly capacity: number;
  readonly refillRate: number;
  readonly lastRefill?: number;
}

/**
 * Analytics request data
 */
export interface AnalyticsRequestData {
  readonly apiKey: string;
  readonly endpoint: string;
  readonly method: string;
  readonly statusCode: number;
  readonly responseTimeMs: number;
  readonly rateLimitHit: boolean;
}

/**
 * Backend response
 */
export interface BackendResponse {
  readonly status: number;
  readonly data: unknown;
  readonly headers: Record<string, string | string[]>;
}

/**
 * Prepared request for backend
 */
export interface PreparedRequest {
  readonly method: string;
  readonly path: string;
  readonly query: Record<string, unknown>;
  readonly body: unknown;
  readonly headers: Record<string, string>;
}

/**
 * API Key verification result
 */
export interface ApiKeyVerification {
  readonly valid: boolean;
  readonly userId: string;
  readonly tier: string;
  readonly permissions: readonly string[];
}

/**
 * Express Request with apiKey
 */
export interface GatewayRequest extends Request {
  apiKey?: string;
  startTime?: number;
}

/**
 * Express middleware types
 */
export type AsyncRouteHandler = (
  req: GatewayRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export type RouteHandler = (
  req: GatewayRequest,
  res: Response,
  next: NextFunction,
) => void;

export type ErrorHandler = (
  err: Error,
  req: GatewayRequest,
  res: Response,
  next: NextFunction,
) => void;

/**
 * Error response
 */
export interface ErrorResponse {
  readonly success: false;
  readonly error: {
    readonly message: string;
    readonly statusCode: number;
    readonly timestamp?: string;
    readonly remaining?: number;
    readonly resetIn?: number;
    readonly retryAfter?: number;
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
