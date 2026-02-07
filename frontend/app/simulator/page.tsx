"use client";

/**
 * API Simulator Tool
 *
 * This tool allows users to:
 * - Test API rate limits in real-time
 * - Send multiple requests to API Gateway
 * - See rate limit errors and responses
 * - Visualize request success/failure patterns
 *
 * Purpose: Demonstrate how rate limiting works
 */

import { useState, useEffect } from "react";
import { adminApi, gatewayApi } from "@/lib/api";
import { ApiKey } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import DashboardLayout from "@/components/DashboardLayout";

interface RequestResult {
  id: number;
  timestamp: string;
  status: "success" | "rate-limited" | "error";
  statusCode: number;
  responseTime: number;
  message?: string;
}

export default function SimulatorPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [endpoint, setEndpoint] = useState<string>("/api/v1/resources");
  const [requestCount, setRequestCount] = useState<number>(10);
  const [delayMs, setDelayMs] = useState<number>(100);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await adminApi.getApiKeys();
      const keys = response.data.data || [];

      setApiKeys(keys.filter((k: ApiKey) => k.enabled));
      console.log("ALL APIS {keys} :", keys);

      if (keys.length > 0) {
        setSelectedApiKey(keys[0].apiKey);
        console.log("Setting default selected API key:", keys[0].apiKey);
      }

      console.log("apiKeys", apiKeys);
      console.log("selectedApiKey", selectedApiKey);
    } catch (error) {
      showToast("Failed to fetch API keys", "error");
    }
  };

  const runSimulation = async () => {
    if (!selectedApiKey) {
      showToast("Please select an API key", "error");
      return;
    }

    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const newResults: RequestResult[] = [];

    for (let i = 0; i < requestCount; i++) {
      const startTime = Date.now();
      console.log("API KEY:", selectedApiKey);
      console.log("Endpoint:", endpoint);
      try {
        const response = await gatewayApi.get(endpoint, {
          headers: {
            "X-API-Key": selectedApiKey,
          },
        });

        console.log("Response:", response);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        newResults.push({
          id: i + 1,
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          statusCode: response.status,
          responseTime,
        });
      } catch (error: any) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = error.response?.status || 0;

        newResults.push({
          id: i + 1,
          timestamp: new Date().toLocaleTimeString(),
          status: statusCode === 429 ? "rate-limited" : "error",
          statusCode,
          responseTime,
          message: error.response?.data?.error || error.message,
        });
      }

      setResults([...newResults]);
      setProgress(((i + 1) / requestCount) * 100);

      // Delay between requests
      if (i < requestCount - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setIsRunning(false);
    showToast("Simulation completed", "success");
  };

  const stopSimulation = () => {
    setIsRunning(false);
    showToast("Simulation stopped", "info");
  };

  const clearResults = () => {
    setResults([]);
    setProgress(0);
  };

  // Calculate statistics
  const stats = {
    total: results.length,
    success: results.filter((r) => r.status === "success").length,
    rateLimited: results.filter((r) => r.status === "rate-limited").length,
    errors: results.filter((r) => r.status === "error").length,
    avgResponseTime:
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.responseTime, 0) /
              results.length,
          )
        : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "rate-limited":
        return "text-red-600";
      case "error":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✓";
      case "rate-limited":
        return "⛔";
      case "error":
        return "✗";
      default:
        return "?";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Simulator</h1>
          <p className="text-gray-500 mt-1">
            Test rate limits by sending multiple requests to the API Gateway
          </p>
        </div>

        {/* Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Simulation Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                API Key *
              </label>
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                disabled={isRunning}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select an API key</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.apiKey}>
                    {key.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Endpoint</label>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                disabled={isRunning}
                placeholder="/api/v1/resources"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Requests
              </label>
              <Input
                type="number"
                value={requestCount}
                onChange={(e) => setRequestCount(parseInt(e.target.value) || 1)}
                disabled={isRunning}
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Delay Between Requests (ms)
              </label>
              <Input
                type="number"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                disabled={isRunning}
                min="0"
                max="5000"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={runSimulation}
              disabled={isRunning || !selectedApiKey}
              className="flex-1"
            >
              {isRunning ? "Running..." : "Start Simulation"}
            </Button>
            {isRunning && (
              <Button variant="outline" onClick={stopSimulation}>
                Stop
              </Button>
            )}
            {results.length > 0 && !isRunning && (
              <Button variant="outline" onClick={clearResults}>
                Clear Results
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </Card>

        {/* Statistics */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.success}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Rate Limited</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.rateLimited}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Errors</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.errors}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Avg Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.avgResponseTime}ms
              </p>
            </Card>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Request Results</h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 text-sm"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      #{result.id}
                    </Badge>
                    <span
                      className={`font-semibold ${getStatusColor(result.status)}`}
                    >
                      {getStatusIcon(result.status)}{" "}
                      {result.status.toUpperCase()}
                    </span>
                    <span className="text-gray-500">{result.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-gray-700">
                      HTTP {result.statusCode}
                    </span>
                    <span className="text-purple-600 font-semibold">
                      {result.responseTime}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rate Limit Warning */}
            {stats.rateLimited > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-900 mb-2">
                  ⛔ Rate Limit Hit!
                </h3>
                <p className="text-sm text-red-800">
                  {stats.rateLimited} out of {stats.total} requests were rate
                  limited. This means the API key exceeded its allowed request
                  rate. The rate limiter uses a token bucket algorithm to
                  control request flow.
                </p>
                <p className="text-sm text-red-800 mt-2">
                  <strong>What to do:</strong> Wait for the bucket to refill
                  based on the configured refill rate, or reduce the request
                  frequency. Check the API Keys page to see your rate limit
                  configuration.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Info Box */}
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧪</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                How to Use the Simulator
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Select an active API key from your collection</li>
                <li>Configure the number of requests and delay between them</li>
                <li>Click "Start Simulation" to begin sending requests</li>
                <li>
                  Watch for rate-limited responses (HTTP 429) when limits are
                  exceeded
                </li>
                <li>
                  Use different delay values to test burst capacity vs sustained
                  rate
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
