import axios, { AxiosRequestConfig } from "axios";

// Service endpoints from environment variables
const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3004";
const GATEWAY_API_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL || "http://localhost:3000";
const ANALYTICS_API_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_API_URL || "http://localhost:3003";

// Admin API instance (authenticated)
export const api = axios.create({
  baseURL: ADMIN_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Gateway instance (for making rate-limited requests)
export const gatewayApi = axios.create({
  baseURL: GATEWAY_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Analytics API instance
export const analyticsApi = axios.create({
  baseURL: ANALYTICS_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to admin requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// API Methods
export const adminApi = {
  // Auth
  login: (username: string, password: string) =>
    api.post("/api/v1/admin/login", { username, password }),

  // API Keys
  getApiKeys: () => api.get("/api/v1/admin/keys"),
  getApiKey: (apiKey: string) => api.get(`/api/v1/admin/keys/${apiKey}`),
  createApiKey: (data: any) => api.post("/api/v1/admin/keys", data),
  updateApiKey: (apiKey: string, data: any) =>
    api.put(`/api/v1/admin/keys/${apiKey}`, data),
  deleteApiKey: (apiKey: string) => api.delete(`/api/v1/admin/keys/${apiKey}`),
  resetTokens: (apiKey: string) =>
    api.post(`/api/v1/admin/keys/${apiKey}/reset`),
  getApiKeyStats: () => api.get("/api/v1/admin/keys/stats"),

  // Monitoring
  getServicesHealth: () => api.get("/api/v1/admin/monitoring/health"),
  getSystemMetrics: () => api.get("/api/v1/admin/monitoring/metrics"),
  getDashboard: () => api.get("/api/v1/admin/monitoring/dashboard"),
  getTimeSeries: (hours = 24, interval = "hour") =>
    api.get(
      `/api/v1/admin/monitoring/time-series?hours=${hours}&interval=${interval}`,
    ),
  getEndpointAnalytics: () => api.get("/api/v1/admin/monitoring/endpoints"),
  getTopRateLimited: (limit = 10) =>
    api.get(`/api/v1/admin/monitoring/top-rate-limited?limit=${limit}`),
};

// Gateway API Methods (for making rate-limited requests)
export const gateway = {
  // Make request to any endpoint through the gateway
  request: async (config: {
    method: string;
    endpoint: string;
    headers?: Record<string, string>;
    body?: any;
  }) => {
    const { method, endpoint, headers = {}, body } = config;

    const requestConfig: AxiosRequestConfig = {
      method: method.toUpperCase(),
      url: endpoint,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      requestConfig.data = body;
    }

    return gatewayApi.request(requestConfig);
  },

  // Specific endpoint shortcuts
  getUsers: (apiKey: string) =>
    gatewayApi.get("/api/v1/users", {
      headers: { "X-API-Key": apiKey },
    }),

  getOrders: (apiKey: string) =>
    gatewayApi.get("/api/v1/orders", {
      headers: { "X-API-Key": apiKey },
    }),

  getProducts: (apiKey: string) =>
    gatewayApi.get("/api/v1/products", {
      headers: { "X-API-Key": apiKey },
    }),
};

// Analytics API Methods
export const analytics = {
  // Get real-time analytics
  getSystemStats: () => analyticsApi.get("/api/v1/analytics/system-stats"),

  getApiKeyAnalytics: (apiKey: string) =>
    analyticsApi.get(`/api/v1/analytics/api-keys/${apiKey}`),

  getAllApiKeysAnalytics: () => analyticsApi.get("/api/v1/analytics/api-keys"),

  getEndpointAnalytics: () => analyticsApi.get("/api/v1/analytics/endpoints"),

  getTimeSeriesData: (params?: {
    hours?: number;
    interval?: string;
    apiKey?: string;
  }) => analyticsApi.get("/api/v1/analytics/time-series", { params }),

  getTopRateLimitedKeys: (limit = 10) =>
    analyticsApi.get(`/api/v1/analytics/top-rate-limited?limit=${limit}`),

  getRequestLogs: (params?: {
    apiKey?: string;
    limit?: number;
    offset?: number;
  }) => analyticsApi.get("/api/v1/analytics/logs", { params }),
};

export { analyticsApi };
export default api;
