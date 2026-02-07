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

        setTopRateLimited(transformedData);
      } catch (error) {
        console.error("Failed to fetch top rate-limited keys", error);
      }

      // Fetch endpoint metrics
      try {
        const endpointResponse = await analytics.getEndpointAnalytics();
        const data = endpointResponse.data.data || [];

        const transformedEndpoints = data.slice(0, 10).map((item: any) => ({
          endpoint: `${item.method} ${item.endpoint}`,
          requests: parseInt(item.total_requests) || 0,
          avgResponseTime: parseFloat(item.avg_response_time) || 0,
        }));

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
        return "bg-green-100 text-green-800 border-green-200";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unhealthy":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "✓";
      case "degraded":
        return "⚠";
      case "unhealthy":
        return "✗";
      default:
        return "?";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Monitoring
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time system health and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* System Stats Summary */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {(systemStats.totalRequests || 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Rate Limited</p>
              <p className="text-2xl font-bold text-red-600">
                {(systemStats.totalRateLimited || 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Active API Keys</p>
              <p className="text-2xl font-bold text-blue-600">
                {systemStats.activeApiKeys || 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(systemStats.avgResponseTime || 0)}ms
              </p>
            </Card>
          </div>
        )}

        {/* Service Health Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Service Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card
                key={service.name}
                className={`p-4 border ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{service.name}</p>
                    <p className="text-xs mt-1 capitalize">{service.status}</p>
                  </div>
                  <span className="text-2xl">
                    {getStatusIcon(service.status)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Top Rate-Limited API Keys */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Top Rate-Limited API Keys
          </h2>
          {topRateLimited.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rate-limited requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {topRateLimited.map((item, index) => (
                <div
                  key={item.apiKey}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {item.apiKey.substring(0, 24)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Rate Limited</p>
                      <p className="text-lg font-bold text-red-600">
                        {item.totalRateLimited.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Requests</p>
                      <p className="text-lg font-bold text-gray-900">
                        {item.totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Rate</p>
                      <p className="text-lg font-bold text-orange-600">
                        {item.rateLimitRate}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Endpoint Analytics */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Endpoint Performance</h2>
          {endpointMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No endpoint data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={endpointMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="endpoint"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={100}
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
                    dataKey="requests"
                    fill="#3b82f6"
                    name="Total Requests"
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Endpoint Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-700">
                        Endpoint
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700">
                        Requests
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700">
                        Avg Response Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpointMetrics.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2 font-mono text-xs">
                          {item.endpoint}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">
                          {item.requests.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-purple-600 font-semibold">
                          {Math.round(item.avgResponseTime)}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* System Info */}
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Monitoring Dashboard
              </h3>
              <p className="text-sm text-gray-700">
                This dashboard provides real-time insights into your API rate
                limiter system. Monitor service health, identify problematic API
                keys, and track endpoint performance. Data auto-refreshes every
                15 seconds.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
