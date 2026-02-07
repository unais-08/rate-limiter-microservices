// Type definitions for Analytics Service

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

export interface RequestLogData {
  apiKey: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  rateLimitHit: boolean;
}

export interface ApiKeyMetricData {
  apiKey: string;
  name?: string | null;
  totalRequests: number;
  totalRateLimited: number;
  avgResponseTimeMs: number;
  lastRequestAt?: Date | null;
}

export interface EndpointMetricData {
  endpoint: string;
  method: string;
  totalRequests: number;
  avgResponseTimeMs: number;
  lastRequestAt?: Date | null;
}

export interface TimeSeriesDataPoint {
  hour: Date;
  requestCount: number;
  rateLimitedCount: number;
}

export interface SystemStats {
  totalRequests: number;
  totalRateLimited: number;
  avgResponseTime: number;
  topApiKeys: Array<{
    apiKey: string;
    requestCount: number;
  }>;
  topEndpoints: Array<{
    endpoint: string;
    method: string;
    requestCount: number;
  }>;
}

export interface LogRequest {
  apiKey: string;
  name?: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  rateLimitHit?: boolean;
}
