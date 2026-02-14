import axios, { AxiosRequestConfig, AxiosError } from "axios";

// Service endpoints from environment variables
const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3002";
const GATEWAY_API_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL || "http://localhost:3000";

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

// Helper to get current user from localStorage
const getCurrentUser = () => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

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

// Error interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// API Methods
export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post("/api/v1/auth/login", { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post("/api/v1/auth/register", { email, password, name }),

  getCurrentUser: () => api.get("/api/v1/auth/me"),

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

  // Monitoring (now uses authenticated endpoints which pass userId automatically)
  getServicesHealth: () => api.get("/api/v1/admin/monitoring/health"),
  getSystemMetrics: () => api.get("/api/v1/admin/monitoring/metrics"),
  getDashboard: () => api.get("/api/v1/admin/monitoring/dashboard"),
  getTimeSeries: (hours = 24, interval = "hour", apiKey?: string) => {
    let url = `/api/v1/admin/monitoring/time-series?hours=${hours}&interval=${interval}`;
    if (apiKey && apiKey !== "all") {
      url += `&apiKey=${encodeURIComponent(apiKey)}`;
    }
    return api.get(url);
  },
  getEndpointAnalytics: () => api.get("/api/v1/admin/monitoring/endpoints"),
  getTopRateLimited: (limit = 10) =>
    api.get(`/api/v1/admin/monitoring/top-rate-limited?limit=${limit}`),

  // Backend Endpoints (user's own backend services)
  getBackendEndpoints: () => api.get("/api/v1/admin/endpoints"),
  getBackendEndpoint: (endpointId: string) =>
    api.get(`/api/v1/admin/endpoints/${endpointId}`),
  createBackendEndpoint: (data: {
    name: string;
    slug: string;
    targetUrl: string;
    healthCheck?: string;
    authType?: "none" | "bearer" | "basic" | "api-key";
    authConfig?: Record<string, any>;
  }) => api.post("/api/v1/admin/endpoints", data),
  updateBackendEndpoint: (
    endpointId: string,
    data: {
      name?: string;
      targetUrl?: string;
      healthCheck?: string;
      authType?: "none" | "bearer" | "basic" | "api-key";
      authConfig?: Record<string, any>;
      enabled?: boolean;
    },
  ) => api.put(`/api/v1/admin/endpoints/${endpointId}`, data),
  deleteBackendEndpoint: (endpointId: string) =>
    api.delete(`/api/v1/admin/endpoints/${endpointId}`),
  testBackendEndpoint: (endpointId: string) =>
    api.post(`/api/v1/admin/endpoints/${endpointId}/test`),
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

  getResources: (apiKey: string) =>
    gatewayApi.get("/api/v1/resources", {
      headers: { "X-API-Key": apiKey },
    }),
};

// Analytics API Methods - Now uses admin API with auth (userId passed automatically via JWT)
export const analytics = {
  // Get system stats (via admin monitoring endpoint - includes userId from JWT)
  getSystemStats: () => api.get("/api/v1/admin/monitoring/metrics"),

  // Get time series data (via admin monitoring endpoint)
  getTimeSeriesData: (params?: {
    hours?: number;
    interval?: string;
    apiKey?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.hours) queryParams.append("hours", params.hours.toString());
    if (params?.interval) queryParams.append("interval", params.interval);
    if (params?.apiKey) queryParams.append("apiKey", params.apiKey);
    return api.get(
      `/api/v1/admin/monitoring/time-series?${queryParams.toString()}`,
    );
  },

  // Get top rate-limited keys (via admin monitoring endpoint)
  getTopRateLimitedKeys: (limit = 10) =>
    api.get(`/api/v1/admin/monitoring/top-rate-limited?limit=${limit}`),

  // Get endpoint analytics (via admin monitoring endpoint)
  getEndpointAnalytics: () => api.get("/api/v1/admin/monitoring/endpoints"),

  // Get all API keys analytics
  getAllApiKeysAnalytics: () => api.get("/api/v1/admin/keys"),

  // Get specific API key analytics
  getApiKeyAnalytics: (apiKey: string) =>
    api.get(`/api/v1/admin/keys/${apiKey}`),
};

export default api;
