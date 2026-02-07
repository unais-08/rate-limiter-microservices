// TypeScript types based on backend Prisma schemas

export interface ApiKey {
  id: number;
  apiKey: string;
  name: string;
  userId: string | null;
  tier: string;
  tokensPerWindow: number;
  refillRate: number;
  maxBurst: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed: string | null;
  description: string | null;
  allowedIps: string[];
}

export interface CreateApiKeyRequest {
  name: string;
  userId?: string;
  tier?: string;
  tokensPerWindow?: number;
  refillRate?: number;
  maxBurst?: number;
  description?: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  enabled?: boolean;
  description?: string;
  // Note: tokensPerWindow, refillRate, maxBurst are system-defined
  // and cannot be updated from UI
}

export interface ApiKeyStats {
  totalKeys: number;
  enabledKeys: number;
  disabledKeys: number;
  byTier: Record<string, number>;
}

export interface RequestLog {
  id: number;
  apiKey: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  rateLimitHit: boolean;
  timestamp: string;
}

export interface ApiKeyMetric {
  id: number;
  apiKey: string;
  totalRequests: number;
  totalRateLimited: number;
  avgResponseTimeMs: number;
  lastRequestAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSeriesData {
  timestamp: string;
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  avgResponseTime: number;
}

export interface DashboardData {
  overview: {
    totalRequests: number;
    totalRateLimited: number;
    avgResponseTime: number;
    activeApiKeys: number;
  };
  recentActivity: RequestLog[];
  topApiKeys: ApiKeyMetric[];
}

export interface AnalyticsFilter {
  apiKey?: string;
  timeRange: "1h" | "24h" | "7d" | "30d";
  interval?: "minute" | "hour" | "day";
}
