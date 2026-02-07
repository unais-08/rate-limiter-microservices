"use client";

/**
 * System Monitoring Dashboard
 *
 * Displays comprehensive system health and performance metrics:
 * - Service health status
 * - Top rate-limited API keys
 * - Endpoint analytics
 * - Real-time system metrics
 *
 * Data sources:
 * - Admin Service: /api/v1/admin/monitoring/*
 * - Analytics Service: /api/v1/analytics/*
 */

import { useEffect, useState } from "react";
import { adminApi, analytics } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ServiceHealth {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  responseTime?: number;
}

interface TopRateLimited {
  apiKey: string;
  name?: string;
  totalRateLimited: number;
  totalRequests: number;
  rateLimitRate: number;
}

export default function MonitoringPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [topRateLimited, setTopRateLimited] = useState<TopRateLimited[]>([]);
  const [endpointMetrics, setEndpointMetrics] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAllData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch service health
      try {
        const healthResponse = await adminApi.getServicesHealth();
        const healthData = healthResponse.data.data || {};

        const servicesArray: ServiceHealth[] = [
          {
            name: "Admin Service",
            status: healthData.adminService || "unknown",
          },
          { name: "API Gateway", status: healthData.gateway || "unknown" },
          { name: "Rate Limiter", status: healthData.rateLimiter || "unknown" },
          {
            name: "Analytics Service",
            status: healthData.analytics || "unknown",
          },
          { name: "Backend Service", status: healthData.backend || "unknown" },
        ];

        setServices(servicesArray);
      } catch (error) {
        console.error("Failed to fetch service health", error);
      }

      // Fetch top rate-limited keys
      try {
        const rateLimitedResponse = await analytics.getTopRateLimitedKeys(10);
        const data = rateLimitedResponse.data.data || [];

        const transformedData = data.map((item: any) => ({
          apiKey: item.api_key,
          name: item.name || item.api_key.substring(0, 16) + "...",
          totalRateLimited: parseInt(item.total_rate_limited) || 0,
          totalRequests: parseInt(item.total_requests) || 0,
          rateLimitRate:
            item.total_requests > 0
              ? Math.round(
                  (item.total_rate_limited / item.total_requests) * 100,
                )
              : 0,
        }));
        console.log("Top Rate-Limited Keys:", transformedData);
        setTopRateLimited(transformedData);
      } catch (error) {
        console.error("Failed to fetch top rate-limited keys", error);
      }

      // Fetch endpoint metrics
      try {
        const endpointResponse = await analytics.getEndpointAnalytics();
        const data = endpointResponse.data.data || [];

        console.log("Endpoint Metrics:", data);

        // Transform and sort by total requests (descending)
        const transformedEndpoints = data
          .map((item: any) => ({
            id: item.id,
            endpoint: item.endpoint,
            method: item.method,
            requests: parseInt(item.totalRequests) || 0,
            avgResponseTime: Math.round(
              parseFloat(item.avgResponseTimeMs) || 0,
            ),
            lastRequestAt: item.lastRequestAt,
          }))
          .sort((a: any, b: any) => b.requests - a.requests)
          .slice(0, 10); // Top 10 endpoints

        setEndpointMetrics(transformedEndpoints);
      } catch (error) {
        console.error("Failed to fetch endpoint metrics", error);
      }

      // Fetch system stats
      try {
        const statsResponse = await analytics.getSystemStats();
        setSystemStats(statsResponse.data.data);
      } catch (error) {
        console.error("Failed to fetch system stats", error);
      }

      setLastUpdate(new Date());
    } catch (error: any) {
      showToast("Failed to fetch monitoring data", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "degraded":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "unhealthy":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return (
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
        );
      case "degraded":
        return (
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
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
      case "unhealthy":
        return (
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (loading && !systemStats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading monitoring data...
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
              System Monitoring
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Real-time system health and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-medium">
              Live · {lastUpdate.toLocaleTimeString()}
            </Badge>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

      

        {/* Top Rate-Limited API Keys */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Top Rate-Limited API Keys
            </h2>
          </div>
          <div className="p-6">
            {topRateLimited.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No rate-limited requests yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topRateLimited.map((item, index) => (
                  <div
                    key={item.apiKey}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Badge className="font-mono text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-0">
                        #{index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                          {item.apiKey.substring(0, 24)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Rate Limited
                        </p>
                        <p className="text-lg font-semibold text-red-600 dark:text-red-500">
                          {item.totalRateLimited.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.totalRequests.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Rate
                        </p>
                        <p className="text-lg font-semibold text-orange-600 dark:text-orange-500">
                          {item.rateLimitRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Endpoint Analytics */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Endpoint Performance
              </h2>
              <Badge className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs">
                Top 10
              </Badge>
            </div>
          </div>
          <div className="p-6">
            {endpointMetrics.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No endpoint data available
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={endpointMetrics}
                      margin={{ top: 10, right: 20, left: 0, bottom: 80 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRequests"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0.7}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorResponse"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.7}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        className="dark:stroke-gray-700"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="endpoint"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        stroke="#9ca3af"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        stroke="#9ca3af"
                        width={50}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        stroke="#9ca3af"
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          fontSize: "12px",
                          padding: "10px 14px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{
                          fontWeight: 600,
                          marginBottom: "6px",
                          color: "#111827",
                          fontSize: "11px",
                        }}
                        formatter={(value: any) => value.toLocaleString()}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="requests"
                        fill="url(#colorRequests)"
                        name="Requests"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="avgResponseTime"
                        fill="url(#colorResponse)"
                        name="Response Time (ms)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Endpoint Cards */}
                <div className="space-y-3">
                  {endpointMetrics.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Badge className="font-mono text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-0 shrink-0">
                          #{index + 1}
                        </Badge>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge
                            className={`text-xs px-2 py-1 font-semibold border-0 shrink-0 ${
                              item.method === "GET"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : item.method === "POST"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : item.method === "PUT"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                    : item.method === "DELETE"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                            }`}
                          >
                            {item.method}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <code className="text-sm font-mono text-gray-900 dark:text-gray-300 block truncate">
                              {item.endpoint}
                            </code>
                            {item.lastRequestAt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Last:{" "}
                                {new Date(item.lastRequestAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 ml-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Requests
                          </p>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-500">
                            {item.requests.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Avg Time
                          </p>
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-500">
                            {item.avgResponseTime}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* System Info */}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Monitoring Dashboard
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                  This dashboard provides real-time insights into your API rate
                  limiter system. Monitor service health, identify problematic
                  API keys, and track endpoint performance. Data auto-refreshes
                  every 15 seconds.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
