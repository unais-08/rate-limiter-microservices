"use client";

/**
 * Overview Dashboard - Main Landing Page
 *
 * Provides a comprehensive view of the entire system:
 * - Real-time metrics and KPIs
 * - Recent API key activity
 * - Quick actions
 * - System health indicators
 *
 * This is the first page users see after login
 */

import { useEffect, useState } from "react";
import { adminApi, analytics } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function OverviewPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    dashboard?: string;
    timeSeries?: string;
  }>({});

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError({});

      // Fetch dashboard overview
      try {
        const dashResponse = await adminApi.getDashboard();

        if (!dashResponse?.data?.data) {
          throw new Error("Invalid dashboard response format");
        }

        setDashboardData(dashResponse.data.data);
        setError((prev) => ({ ...prev, dashboard: undefined }));
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.error ||
          error?.message ||
          "Failed to fetch dashboard data";
        console.error("Dashboard fetch error:", error);
        setError((prev) => ({ ...prev, dashboard: errorMsg }));
        showToast(errorMsg, "error");

        // Set fallback data to prevent crashes
        if (!dashboardData) {
          setDashboardData({
            metrics: {
              total_requests: 0,
              total_rate_limited: 0,
              unique_api_keys: 0,
              avg_response_time: 0,
            },
            overview: {},
          });
        }
      }

      // Fetch time-series for last 24 hours
      try {
        const timeSeriesResponse = await analytics.getTimeSeriesData({
          hours: 24,
          interval: "hour",
        });

        if (!timeSeriesResponse?.data?.data) {
          throw new Error("Invalid time series response format");
        }

        const rawData = timeSeriesResponse.data.data;

        if (!Array.isArray(rawData)) {
          throw new Error("Time series data is not an array");
        }

        const transformedData = rawData.map((item: any) => ({
          time: new Date(item.time_bucket).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          requests: item.request_count || 0,
          successful:
            (item.request_count || 0) - (item.rate_limited_count || 0),
          rateLimited: item.rate_limited_count || 0,
        }));

        setTimeSeriesData(transformedData);
        setError((prev) => ({ ...prev, timeSeries: undefined }));
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.error ||
          error?.message ||
          "Failed to fetch time series data";
        console.error("Time series fetch error:", error);
        setError((prev) => ({ ...prev, timeSeries: errorMsg }));
        // Don't show toast for time series errors to avoid spam
        setTimeSeriesData([]);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Unexpected error occurred";
      console.error("Unexpected error:", error);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // console.log();
  if (loading && !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Critical error - no dashboard data at all
  if (!loading && !dashboardData && error.dashboard) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Failed to Load Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {error.dashboard}
              </p>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retry
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const overview = dashboardData?.overview || {};
  const metrics = dashboardData?.metrics || {
    total_requests: 0,
    total_rate_limited: 0,
    unique_api_keys: 0,
    avg_response_time: 0,
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Overview
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor your API usage and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error.timeSeries && (
              <Badge className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 text-xs font-medium">
                Partial Data
              </Badge>
            )}
            <Badge className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-medium">
              Live
            </Badge>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Requests
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {metrics.total_requests?.toLocaleString() || 0}
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              All time
            </p>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-500">
                  {metrics.total_requests > 0
                    ? Math.round(
                        ((metrics.total_requests - metrics.total_rate_limited) /
                          metrics.total_requests) *
                          100,
                      )
                    : 0}
                  %
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {(
                (metrics.total_requests || 0) -
                (metrics.total_rate_limited || 0)
              ).toLocaleString()}{" "}
              successful
            </p>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rate Limited
                </p>
                <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-500">
                  {metrics.total_rate_limited?.toLocaleString() || 0}
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Rejected requests
            </p>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Keys
                </p>
                <p className="mt-2 text-3xl font-semibold text-purple-600 dark:text-purple-500">
                  {metrics.unique_api_keys?.toLocaleString() || 0}
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              In use
            </p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Trends */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Request Trends
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Last 12 hours
            </p>
            {error.timeSeries ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-10 w-10 text-red-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Failed to load chart
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {error.timeSeries}
                  </p>
                  <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {loading ? "Retrying..." : "Try Again"}
                  </button>
                </div>
              </div>
            ) : timeSeriesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No data available
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="time"
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
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Requests"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Success vs Rate Limited */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Request Status
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Success vs Rate Limited
            </p>
            {error.timeSeries ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-10 w-10 text-red-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Failed to load chart
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {error.timeSeries}
                  </p>
                  <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {loading ? "Retrying..." : "Try Again"}
                  </button>
                </div>
              </div>
            ) : timeSeriesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No data available
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="time"
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
                  <Line
                    type="monotone"
                    dataKey="successful"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Successful"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rateLimited"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Rate Limited"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/*  Quick Actions & System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Link href="/api-keys" className="block">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
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
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Manage API Keys
                      </span>
                    </div>
                  </button>
                </Link>

                <Link href="/api-usage" className="block">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        View Analytics
                      </span>
                    </div>
                  </button>
                </Link>

                <Link href="/simulator" className="block">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
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
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Test Simulator
                      </span>
                    </div>
                  </button>
                </Link>

                <Link href="/monitoring" className="block">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        System Monitor
                      </span>
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Recent Activity - Placeholder for future feature */}
          <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Activity Timeline
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Track API key creation, modifications, and usage patterns
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* System Information */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Rate Limiting
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Token Bucket Algorithm
                  </p>
                  <Badge className="mt-2 inline-flex px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    Active
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Response Time
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(metrics.avg_response_time || 0)}ms average
                  </p>
                  <Badge className="mt-2 inline-flex px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    Healthy
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
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
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Infrastructure
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Microservices (4 services)
                  </p>
                  <Badge className="mt-2 inline-flex px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                    Operational
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
