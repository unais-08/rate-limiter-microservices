"use client";

import { useState } from "react";
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Copy,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { gateway } from "@/lib/api";
import { AxiosError } from "axios";

interface RequestResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  timestamp: string;
  duration: number;
}

export default function SimulatorPage() {
  const [apiKey, setApiKey] = useState("");
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/api/v1/users");
  const [customHeaders, setCustomHeaders] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Predefined endpoints
  const endpoints = [
    { value: "/api/v1/users", label: "Get Users", method: "GET" },
    { value: "/api/v1/orders", label: "Get Orders", method: "GET" },
    { value: "/api/v1/products", label: "Get Products", method: "GET" },
    { value: "/api/v1/users", label: "Create User", method: "POST" },
  ];

  const handleSendRequest = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      // Parse custom headers
      let headers: Record<string, string> = {
        "X-API-Key": apiKey.trim(),
      };

      if (customHeaders.trim()) {
        try {
          const parsed = JSON.parse(customHeaders);
          headers = { ...headers, ...parsed };
        } catch (e) {
          setError("Invalid JSON in custom headers");
          setIsLoading(false);
          return;
        }
      }

      // Parse request body
      let body = null;
      if (requestBody.trim() && ["POST", "PUT", "PATCH"].includes(method)) {
        try {
          body = JSON.parse(requestBody);
        } catch (e) {
          setError("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      }

      // Make the request
      const result = await gateway.request({
        method,
        endpoint,
        headers,
        body,
      });

      const duration = Date.now() - startTime;

      setResponse({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        headers: {
          "x-ratelimit-limit": result.headers["x-ratelimit-limit"] || "N/A",
          "x-ratelimit-remaining":
            result.headers["x-ratelimit-remaining"] || "N/A",
          "x-ratelimit-reset": result.headers["x-ratelimit-reset"] || "N/A",
        },
        timestamp: new Date().toISOString(),
        duration,
      });
    } catch (err) {
      const axiosError = err as AxiosError;
      const duration = Date.now() - startTime;

      if (axiosError.response) {
        setResponse({
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          headers: {
            "x-ratelimit-limit":
              axiosError.response.headers["x-ratelimit-limit"] || "N/A",
            "x-ratelimit-remaining":
              axiosError.response.headers["x-ratelimit-remaining"] || "N/A",
            "x-ratelimit-reset":
              axiosError.response.headers["x-ratelimit-reset"] || "N/A",
          },
          timestamp: new Date().toISOString(),
          duration,
        });
      } else {
        setError(axiosError.message || "Request failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!response) return null;

    if (response.status === 429) {
      return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    } else if (response.status >= 200 && response.status < 300) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!response) return "";

    if (response.status === 429) return "text-yellow-500";
    if (response.status >= 200 && response.status < 300)
      return "text-green-500";
    return "text-red-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Request Simulator</h1>
          <p className="text-gray-400 mt-2">
            Send real API requests and see rate limiting in action
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Configuration */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Request Configuration
            </h2>

            <div className="space-y-4">
              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {apiKey && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your API key from the Keys page
                </p>
              </div>

              {/* Method and Endpoint */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Endpoint
                  </label>
                  <select
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {endpoints.map((ep) => (
                      <option key={`${ep.method}-${ep.value}`} value={ep.value}>
                        {ep.label} ({ep.method})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Headers */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Headers (JSON)
                </label>
                <textarea
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Request Body */}
              {["POST", "PUT", "PATCH"].includes(method) && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{"name": "John Doe"}'
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                disabled={isLoading || !apiKey.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Display */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Response
            </h2>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-300 mt-2">{error}</p>
              </div>
            )}

            {!response && !error && (
              <div className="text-center py-12 text-gray-500">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No response yet. Send a request to see the result.</p>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* Status */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span className={`text-xl font-bold ${getStatusColor()}`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {response.duration}ms
                    </div>
                    <div>
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Rate Limit Headers */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Rate Limit Headers
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Limit:</span>
                      <span className="text-white font-mono">
                        {response.headers["x-ratelimit-limit"]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Remaining:</span>
                      <span className="text-white font-mono">
                        {response.headers["x-ratelimit-remaining"]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Reset:</span>
                      <span className="text-white font-mono">
                        {response.headers["x-ratelimit-reset"]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Body */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Response Body
                  </h3>
                  <pre className="text-sm text-gray-300 overflow-auto max-h-96 font-mono">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Test Scenarios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setMethod("GET");
                setEndpoint("/api/v1/users");
                setTimeout(handleSendRequest, 100);
              }}
              disabled={isLoading || !apiKey.trim()}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed border border-gray-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="text-blue-400 font-medium mb-1">
                Normal Request
              </div>
              <div className="text-sm text-gray-400">
                Send a single GET request
              </div>
            </button>

            <button
              onClick={async () => {
                setMethod("GET");
                setEndpoint("/api/v1/users");
                for (let i = 0; i < 5; i++) {
                  await handleSendRequest();
                  await new Promise((resolve) => setTimeout(resolve, 300));
                }
              }}
              disabled={isLoading || !apiKey.trim()}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed border border-gray-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="text-yellow-400 font-medium mb-1">Burst Test</div>
              <div className="text-sm text-gray-400">Send 5 rapid requests</div>
            </button>

            <button
              onClick={async () => {
                setMethod("GET");
                setEndpoint("/api/v1/users");
                for (let i = 0; i < 15; i++) {
                  await handleSendRequest();
                  await new Promise((resolve) => setTimeout(resolve, 100));
                }
              }}
              disabled={isLoading || !apiKey.trim()}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed border border-gray-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="text-red-400 font-medium mb-1">
                Rate Limit Test
              </div>
              <div className="text-sm text-gray-400">
                Exceed rate limit (15 requests)
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
