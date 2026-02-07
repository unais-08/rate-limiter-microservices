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

      // Transform data for charts
      const transformedData = rawData.map((item: any) => ({
        timestamp: new Date(item.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: timeRange === "1h" ? "2-digit" : undefined,
          minute: timeRange === "1h" ? "2-digit" : undefined,
        }),
        totalRequests: parseInt(item.total_requests) || 0,
        successfulRequests: parseInt(item.successful_requests) || 0,
        rateLimitedRequests: parseInt(item.rate_limited_requests) || 0,
        avgResponseTime: parseFloat(item.avg_response_time) || 0,
      }));

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              API Usage Analytics
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor request patterns and rate limiting behavior
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <div className="flex gap-2">
                {(["1h", "24h", "7d", "30d"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range === "1h" && "Last Hour"}
                    {range === "24h" && "Last 24 Hours"}
                    {range === "7d" && "Last 7 Days"}
                    {range === "30d" && "Last 30 Days"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">API Key:</label>
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All API Keys</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.apiKey}>
                    {key.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </Card>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalRequests.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Successful</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.successfulRequests.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Rate Limited</p>
            <p className="text-2xl font-bold text-red-600">
              {metrics.rateLimitedRequests.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.successRate}%
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Avg Response Time</p>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.avgResponseTime}ms
            </p>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests Over Time - Line Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Requests Over Time</h2>
            {timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available for selected filters
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Success vs Rate Limited Breakdown
            </h2>
            {timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available for selected filters
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Average Response Time
            </h2>
            {timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available for selected filters
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{
                      value: "ms",
                      angle: -90,
                      position: "insideLeft",
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Request Distribution</h2>
            {metrics.totalRequests === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available for selected filters
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(1)}%`
                      }
                      outerRadius={100}
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
                <div className="flex gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>
                      Successful: {metrics.successfulRequests.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>
                      Rate Limited:{" "}
                      {metrics.rateLimitedRequests.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Info Box */}
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Understanding Rate Limits
              </h3>
              <p className="text-sm text-blue-800">
                When you see rate-limited requests (red bars/lines), it means
                the API key has exceeded its allowed request rate. The system
                uses a token bucket algorithm to enforce rate limits. Requests
                are rejected when the bucket is empty and will be allowed again
                once tokens refill.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Try again after:</strong> Rate limits automatically
                reset based on the refill rate configured for each API key.
                Check the API Keys page for your specific rate limit
                configuration.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
