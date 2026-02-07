"use client";

/**
 * API Usage Analytics Dashboard
 *
 * This page provides comprehensive analytics for API usage:
 * - Requests over time (line chart)
 * - Success vs rate-limited requests (bar chart)
 * - Per API key analytics
 * - Time range filters (1h, 24h, 7d, 30d)
 * - Real-time data updates
 *
 * Data sources:
 * - Analytics Service: /api/v1/analytics/time-series
 * - Analytics Service: /api/v1/analytics/api-keys
 */

import { useEffect, useState } from "react";
import { analytics, adminApi } from "@/lib/api";
import { ApiKey, TimeSeriesData } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function ApiUsagePage() {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [selectedApiKey, timeRange]);

  const fetchApiKeys = async () => {
    try {
      const response = await adminApi.getApiKeys();
      setApiKeys(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch API keys", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Map timeRange to hours
      const hoursMap: Record<string, number> = {
        "1h": 1,
        "24h": 24,
        "7d": 168,
        "30d": 720,
      };

      // Map timeRange to interval
      const intervalMap: Record<string, string> = {
        "1h": "minute",
        "24h": "hour",
        "7d": "hour",
        "30d": "day",
      };

      const params = {
        hours: hoursMap[timeRange],
        interval: intervalMap[timeRange],
        apiKey: selectedApiKey === "all" ? undefined : selectedApiKey,
      };

      // Fetch time-series data
      const timeSeriesResponse = await analytics.getTimeSeriesData(params);
      const rawData = timeSeriesResponse.data.data || [];

      console.log("Time series data:", rawData);
      const transformedData = rawData.map((item: any) => ({
        timestamp: new Date(item.time_bucket).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        totalRequests: item.request_count || 0,
        successfulRequests: item.request_count - item.rate_limited_count || 0,
        rateLimitedRequests: item.rate_limited_count || 0,
        avgResponseTime: item.avg_response_time || 0,
      }));
      console.log("Transformed time series data:", transformedData);

      setTimeSeriesData(transformedData);
    } catch (error: any) {
      showToast("Failed to fetch analytics data", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics from time-series data
  const calculateMetrics = () => {
    if (timeSeriesData.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        rateLimitedRequests: 0,
        avgResponseTime: 0,
        successRate: 0,
      };
    }

    const totals = timeSeriesData.reduce(
      (acc, item) => ({
        total: acc.total + item.totalRequests,
        successful: acc.successful + item.successfulRequests,
        rateLimited: acc.rateLimited + item.rateLimitedRequests,
        responseTime: acc.responseTime + item.avgResponseTime,
      }),
      { total: 0, successful: 0, rateLimited: 0, responseTime: 0 },
    );

    const avgResponseTime = totals.responseTime / timeSeriesData.length;
    const successRate =
      totals.total > 0 ? (totals.successful / totals.total) * 100 : 0;

    return {
      totalRequests: totals.total,
      successfulRequests: totals.successful,
      rateLimitedRequests: totals.rateLimited,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 10) / 10,
    };
  };

  const metrics = calculateMetrics();

  // Pie chart data for success vs rate-limited
  const pieData = [
    { name: "Successful", value: metrics.successfulRequests, color: "#10b981" },
    {
      name: "Rate Limited",
      value: metrics.rateLimitedRequests,
      color: "#ef4444",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              API Usage Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor request patterns and rate limiting behavior
            </p>
          </div>
          <Badge className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-medium">
            Live
          </Badge>
        </div>

        {/* Filters */}
        <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 items-center flex-wrap">
            {/* <div className="flex items-center gap-3"> */}
              {/* <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range:
              </label>
              <div className="flex gap-2">
                {(["1h", "24h", "7d", "30d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeRange === range
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {range === "1h" && "1 Hour"}
                    {range === "24h" && "24 Hours"}
                    {range === "7d" && "7 Days"}
                    {range === "30d" && "30 Days"}
                  </button>
                ))}
              </div> */}
            {/* </div> */}

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                API Key:
              </label>
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All API Keys</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.apiKey}>
                    {key.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="ml-auto px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </Card>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Requests
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {metrics.totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Successful
                </p>
                <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-500">
                  {metrics.successfulRequests.toLocaleString()}
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
                  {metrics.rateLimitedRequests.toLocaleString()}
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
                  Success Rate
                </p>
                <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-500">
                  {metrics.successRate}%
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg Response
                </p>
                <p className="mt-2 text-3xl font-semibold text-purple-600 dark:text-purple-500">
                  {metrics.avgResponseTime}ms
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests Over Time - Line Chart */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Requests Over Time
            </h2>
            {timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No data available for selected filters
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    stroke="#6b7280"
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
                    type="monotone"
                    dataKey="totalRequests"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Requests"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="successfulRequests"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Successful"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rateLimitedRequests"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Rate Limited"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Success vs Rate Limited - Bar Chart */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Success vs Rate Limited Breakdown
            </h2>
            {timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No data available for selected filters
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="successfulRequests"
                    fill="#10b981"
                    name="Successful"
                  />
                  <Bar
                    dataKey="rateLimitedRequests"
                    fill="#ef4444"
                    name="Rate Limited"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Response Time Over Time */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Average Response Time
            </h2>
            {timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No data available for selected filters
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    stroke="#6b7280"
                    label={{
                      value: "ms",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#6b7280" },
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
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Avg Response Time (ms)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Success Rate Distribution - Pie Chart */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Request Distribution
            </h2>
            {metrics.totalRequests === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No data available for selected filters
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                  <div className="flex items-center justify-between px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Successful
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {metrics.successfulRequests.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {metrics.totalRequests > 0
                          ? (
                              (metrics.successfulRequests /
                                metrics.totalRequests) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Rate Limited
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {metrics.rateLimitedRequests.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {metrics.totalRequests > 0
                          ? (
                              (metrics.rateLimitedRequests /
                                metrics.totalRequests) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Understanding Rate Limits
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                  When you see rate-limited requests (red bars/lines), it means
                  the API key has exceeded its allowed request rate. The system
                  uses a token bucket algorithm to enforce rate limits. Requests
                  are rejected when the bucket is empty and will be allowed
                  again once tokens refill.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed mt-3">
                  <strong className="font-semibold">Tip:</strong> Rate limits
                  automatically reset based on the refill rate configured for
                  each API key. Check the API Keys page for your specific rate
                  limit configuration.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
