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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
    showToast(
      `Simulation completed! ${newResults.filter((r) => r.status === "success").length}/${requestCount} successful`,
      "success",
    );
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
        return "text-green-600 dark:text-green-500";
      case "rate-limited":
        return "text-red-600 dark:text-red-500";
      case "error":
        return "text-orange-600 dark:text-orange-500";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return (
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "rate-limited":
        return (
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-orange-600 dark:text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              API Simulator
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Test rate limits by sending multiple requests to the API Gateway
            </p>
          </div>
          <Badge className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-medium">
            Simulator
          </Badge>
        </div>

        {/* Configuration */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Simulation Configuration
              </h2>
              {isRunning && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Running...
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {/* Quick Presets */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quick Test Scenarios
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setRequestCount(20);
                    setDelayMs(50);
                  }}
                  disabled={isRunning}
                  className="px-3 py-2 text-xs font-medium text-left bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors disabled:opacity-50"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    🚀 Burst Test
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    20 requests, 50ms delay
                  </div>
                </button>
                <button
                  onClick={() => {
                    setRequestCount(30);
                    setDelayMs(200);
                  }}
                  disabled={isRunning}
                  className="px-3 py-2 text-xs font-medium text-left bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors disabled:opacity-50"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    ⚡ Normal Load
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    30 requests, 200ms delay
                  </div>
                </button>
                <button
                  onClick={() => {
                    setRequestCount(50);
                    setDelayMs(500);
                  }}
                  disabled={isRunning}
                  className="px-3 py-2 text-xs font-medium text-left bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors disabled:opacity-50"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    🐢 Sustained Test
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    50 requests, 500ms delay
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <select
                  value={selectedApiKey}
                  onChange={(e) => setSelectedApiKey(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endpoint
                </label>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  disabled={isRunning}
                  placeholder="/api/v1/resources"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Requests
                </label>
                <Input
                  type="number"
                  value={requestCount}
                  onChange={(e) =>
                    setRequestCount(parseInt(e.target.value) || 1)
                  }
                  disabled={isRunning}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delay Between Requests (ms)
                </label>
                <Input
                  type="number"
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                  disabled={isRunning}
                  min="0"
                  max="5000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={runSimulation}
                disabled={isRunning || !selectedApiKey}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? "Running..." : "Start Simulation"}
              </button>
              {isRunning && (
                <button
                  onClick={stopSimulation}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
                >
                  Stop
                </button>
              )}
              {results.length > 0 && !isRunning && (
                <button
                  onClick={clearResults}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
                >
                  Clear Results
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {isRunning && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Statistics */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <svg
                    className="w-6 h-6 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Successful
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-500">
                    {stats.success}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rate Limited
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-500">
                    {stats.rateLimited}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Errors
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-orange-600 dark:text-orange-500">
                    {stats.errors}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg Time
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-purple-600 dark:text-purple-500">
                    {stats.avgResponseTime}ms
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Visualizations */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Request Pattern */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Request Pattern Over Time
                </h2>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={results.map((r) => ({
                      id: r.id,
                      success: r.status === "success" ? 1 : 0,
                      rateLimited: r.status === "rate-limited" ? 1 : 0,
                      responseTime: r.responseTime,
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:stroke-gray-700"
                    />
                    <XAxis
                      dataKey="id"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#6b7280"
                      label={{
                        value: "Request #",
                        position: "insideBottom",
                        offset: -5,
                        style: { fill: "#6b7280", fontSize: 12 },
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#6b7280"
                      label={{
                        value: "Status",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#6b7280", fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="stepAfter"
                      dataKey="success"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Success"
                      dot={{ fill: "#10b981", r: 4 }}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="rateLimited"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Rate Limited"
                      dot={{ fill: "#ef4444", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Request Status Distribution
                </h2>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Success",
                          value: stats.success,
                          color: "#10b981",
                        },
                        {
                          name: "Rate Limited",
                          value: stats.rateLimited,
                          color: "#ef4444",
                        },
                        {
                          name: "Errors",
                          value: stats.errors,
                          color: "#f97316",
                        },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        {
                          name: "Success",
                          value: stats.success,
                          color: "#10b981",
                        },
                        {
                          name: "Rate Limited",
                          value: stats.rateLimited,
                          color: "#ef4444",
                        },
                        {
                          name: "Errors",
                          value: stats.errors,
                          color: "#f97316",
                        },
                      ]
                        .filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Response Time Distribution */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Response Time Trend
                </h2>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={results.map((r) => ({
                      id: r.id,
                      responseTime: r.responseTime,
                      status: r.status,
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:stroke-gray-700"
                    />
                    <XAxis
                      dataKey="id"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#6b7280"
                      label={{
                        value: "Request #",
                        position: "insideBottom",
                        offset: -5,
                        style: { fill: "#6b7280", fontSize: 12 },
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#6b7280"
                      label={{
                        value: "Time (ms)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#6b7280", fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar
                      dataKey="responseTime"
                      fill="#8b5cf6"
                      name="Response Time (ms)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Visual Request Timeline */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Visual Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-10 gap-2">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className={`h-16 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer ${
                        result.status === "success"
                          ? "bg-green-500 text-white"
                          : result.status === "rate-limited"
                            ? "bg-red-500 text-white"
                            : "bg-orange-500 text-white"
                      }`}
                      title={`#${result.id} - ${result.status.toUpperCase()} - ${result.responseTime}ms`}
                    >
                      {result.id}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Success
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Rate Limited
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Error
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Insights Summary */}
        {results.length > 0 && !isRunning && (
          <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3">
                    Simulation Complete - Quick Insights
                  </h3>
                  <div className="space-y-2 text-sm">
                    {stats.success === stats.total && (
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">
                          ✓
                        </span>
                        <p className="text-green-800 dark:text-green-300">
                          <strong>Perfect!</strong> All {stats.total} requests
                          succeeded. Your API key handled the load without
                          hitting rate limits.
                        </p>
                      </div>
                    )}
                    {stats.rateLimited > 0 &&
                      stats.rateLimited < stats.total && (
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400">
                            ⚠
                          </span>
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Partial Rate Limiting:</strong>{" "}
                            {stats.rateLimited} requests were rate limited (
                            {((stats.rateLimited / stats.total) * 100).toFixed(
                              1,
                            )}
                            %). Consider increasing delay or checking your rate
                            limit configuration.
                          </p>
                        </div>
                      )}
                    {stats.rateLimited === stats.total && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">
                          ✗
                        </span>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>All Blocked:</strong> Every request was rate
                          limited. Your request rate significantly exceeds the
                          allowed limit. Try increasing the delay or reducing
                          request count.
                        </p>
                      </div>
                    )}
                    {stats.errors > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400">
                          !
                        </span>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Errors Detected:</strong> {stats.errors}{" "}
                          requests failed with errors (not rate limiting). Check
                          your API key and endpoint configuration.
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 pt-2 border-t border-green-200 dark:border-green-800">
                      <span className="text-blue-600 dark:text-blue-400">
                        💡
                      </span>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Tip:</strong> Average response time was{" "}
                        {stats.avgResponseTime}ms.{" "}
                        {stats.avgResponseTime < 100
                          ? "Excellent performance!"
                          : stats.avgResponseTime < 300
                            ? "Good performance."
                            : "Consider optimizing response times."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Request Results
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Badge className="font-mono text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-0">
                        #{result.id}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span
                          className={`text-sm font-semibold ${getStatusColor(result.status)}`}
                        >
                          {result.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {result.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 ml-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        HTTP {result.statusCode}
                      </span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-500">
                        {result.responseTime}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rate Limit Warning */}
              {stats.rateLimited > 0 && (
                <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                        <svg
                          className="w-5 h-5 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                          Rate Limit Hit!
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed">
                          {stats.rateLimited} out of {stats.total} requests were
                          rate limited. This means the API key exceeded its
                          allowed request rate. The rate limiter uses a token
                          bucket algorithm to control request flow.
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed mt-3">
                          <strong className="font-semibold">What to do:</strong>{" "}
                          Wait for the bucket to refill based on the configured
                          refill rate, or reduce the request frequency. Check
                          the API Keys page to see your rate limit
                          configuration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Understanding Rate Limiting */}
        {results.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3">
                    Understanding Your Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Success Pattern
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        Consecutive successful requests show tokens are
                        available. The pattern breaks when the bucket empties.
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Rate Limit Pattern
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        Rate limited requests (HTTP 429) occur when tokens are
                        exhausted. Wait for refill or reduce request rate.
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Response Time
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        Consistent response times indicate healthy API
                        performance. Spikes may suggest system load or network
                        issues.
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Request Delay Impact
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                        Lower delays test burst capacity. Higher delays
                        (matching refill rate) test sustained throughput.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Info Box */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  How to Use the Simulator
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Select an active API key from your collection</li>
                  <li>
                    Configure the number of requests and delay between them
                  </li>
                  <li>Click "Start Simulation" to begin sending requests</li>
                  <li>
                    Watch for rate-limited responses (HTTP 429) when limits are
                    exceeded
                  </li>
                  <li>
                    Use different delay values to test burst capacity vs
                    sustained rate
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
