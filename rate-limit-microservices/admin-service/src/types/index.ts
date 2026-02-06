// Type definitions for Admin Service

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

export interface ApiKeyMetadata {
  name: string;
  userId?: string;
  tier: string;
  tokensPerWindow: number;
  refillRate: number;
  maxBurst: number;
  enabled: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface CreateApiKeyOptions {
  name?: string;
  userId?: string | null;
  tier?: string;
  tokensPerWindow?: number;
  refillRate?: number;
  maxBurst?: number;
  enabled?: boolean;
  description?: string | null;
  allowedIps?: string[];
}

export interface UpdateApiKeyOptions {
  name?: string;
  tier?: string;
  tokensPerWindow?: number;
  refillRate?: number;
  maxBurst?: number;
  enabled?: boolean;
  description?: string;
}

export interface ApiKeyResponse {
  id: number;
  apiKey: string;
  name: string;
  userId?: string | null;
  tier: string;
  tokensPerWindow: number;
  refillRate: number;
  maxBurst: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date | null;
  description?: string | null;
  currentTokens?: number;
  lastRefill?: number;
}

export interface ValidationResult {
  valid: boolean;
  metadata?: {
    name: string;
    userId?: string | null;
    tier: string;
    tokensPerWindow: number;
    refillRate: number;
    maxBurst: number;
    enabled: boolean;
  };
}

export interface ApiKeyStats {
  totalKeys: number;
  enabledKeys: number;
  disabledKeys: number;
  tierCounts: Record<string, number>;
}

export interface MonitoringMetrics {
  service: string;
  uptime: number;
  timestamp: string;
  redis: {
    connected: boolean;
    totalKeys: number;
  };
  database: {
    connected: boolean;
    totalApiKeys: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}
