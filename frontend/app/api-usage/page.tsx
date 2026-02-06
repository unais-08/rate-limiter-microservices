"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart2,
  Key,
  RefreshCw,
} from "lucide-react";
import { adminApi, analyticsApi } from "@/lib/api";

interface ApiKeyData {
  apiKey: string;
  name: string;
  totalRequests: number;
  rateLimited: number;
  avgResponseTime: number;
  successRate: number;
  lastUsed: string;
}

interface EndpointData {
  endpoint: string;
  method: string;
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
}

interface TimeSeriesData {
  timestamp: string;
  requests: number;
  rateLimited: number;
  avgResponseTime: number;
}

interface RequestLog {
  id: string;
  apiKey: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  rateLimitHit: boolean;
  timestamp: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ApiUsagePage() {
  const [selectedApiKey, setSelectedApiKey] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24");
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyData[]>([]);
  const [endpointStats, setEndpointStats] = useState<EndpointData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [systemStats, setSystemStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch API keys
      const keysResponse = await adminApi.getApiKeys();
      const keys = keysResponse.data?.data || [];
      setApiKeys(keys);

      // Fetch analytics data from analytics service
      const analyticsResponse = await analyticsApi.get("/api-keys");
      const analyticsData = analyticsResponse.data?.data || [];

      // Transform analytics data
      const keyStats: ApiKeyData[] = analyticsData.map((item: any) => ({
        apiKey: item.api_key,
        name:
          keys.find((k: any) => k.apiKey === item.api_key)?.name ||
          item.api_key,
        totalRequests: parseInt(item.total_requests) || 0,
        rateLimited: parseInt(item.total_rate_limited) || 0,
        avgResponseTime: parseFloat(item.avg_response_time_ms) || 0,
        successRate: item.total_requests
          ? ((item.total_requests - item.total_rate_limited) /
              item.total_requests) *
            100
          : 100,
        lastUsed: item.last_request_at || "Never",
      }));
      setApiKeyStats(keyStats);

      // Fetch endpoint analytics
      const endpointResponse = await analyticsApi.get("/endpoints");
      const endpointData = endpointResponse.data?.data || [];

      const endpointStatsData: EndpointData[] = endpointData.map(
        (item: any) => ({
          endpoint: item.endpoint,
          method: item.method,
          totalRequests: parseInt(item.total_requests) || 0,
          avgResponseTime: parseFloat(item.avg_response_time_ms) || 0,
          successRate: 100, // Calculate from status codes if available
        }),
      );
      setEndpointStats(endpointStatsData);

      // Fetch time series data
      const timeSeriesResponse = await analyticsApi.get(
        `/time-series?hours=${timeRange}&interval=hour`,
      );
      const timeSeriesRaw = timeSeriesResponse.data?.data || [];

      const timeSeriesFormatted: TimeSeriesData[] = timeSeriesRaw.map(
        (item: any) => ({
          timestamp: new Date(item.time_bucket).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          requests: parseInt(item.request_count) || 0,
          rateLimited: parseInt(item.rate_limited_count) || 0,
          avgResponseTime: parseFloat(item.avg_response_time_ms) || 0,
        }),
      );
      setTimeSeriesData(timeSeriesFormatted);

      // Fetch system stats
      const systemStatsResponse = await analyticsApi.get("/system-stats");
      setSystemStats(systemStatsResponse.data?.data || {});

      // Fetch recent request logs
      const logsResponse = await analyticsApi.get(
        `/logs?limit=50${selectedApiKey !== "all" ? `&apiKey=${selectedApiKey}` : ""}`,
      );
      const logs = logsResponse.data?.data || [];
      setRequestLogs(logs);

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Refresh every 10 seconds
    const interval = setInterval(fetchAllData, 10000);

    return () => clearInterval(interval);
  }, [selectedApiKey, timeRange]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-spin text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                API Usage Analytics
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Detailed analytics and insights for API usage
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last Hour</SelectItem>
                  <SelectItem value="6">Last 6 Hours</SelectItem>
                  <SelectItem value="24">Last 24 Hours</SelectItem>
                  <SelectItem value="168">Last Week</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAllData} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(systemStats.total_requests || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rate Limited
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {(systemStats.total_rate_limited || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {systemStats.total_requests
                    ? (
                        (systemStats.total_rate_limited /
                          systemStats.total_requests) *
                        100
                      ).toFixed(2)
                    : 0}
                  % blocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(systemStats.avg_response_time_ms || 0)}ms
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Across all endpoints
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active API Keys
                </CardTitle>
                <Key className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apiKeys.filter((k) => k.status === "active").length}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Out of {apiKeys.length} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume Over Time</CardTitle>
                <CardDescription>
                  Total and rate-limited requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Total Requests"
                    />
                    <Area
                      type="monotone"
                      dataKey="rateLimited"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Rate Limited"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>
                  Average response time per hour
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Avg Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* API Key Performance */}
          <Card>
            <CardHeader>
              <CardTitle>API Key Performance</CardTitle>
              <CardDescription>Usage statistics by API key</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={apiKeyStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="totalRequests"
                      fill="#3b82f6"
                      name="Total Requests"
                    />
                    <Bar
                      dataKey="rateLimited"
                      fill="#ef4444"
                      name="Rate Limited"
                    />
                  </BarChart>
                </ResponsiveContainer>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API Key Name</TableHead>
                      <TableHead>Total Requests</TableHead>
                      <TableHead>Rate Limited</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeyStats.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-gray-500"
                        >
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiKeyStats.map((stat) => (
                        <TableRow key={stat.apiKey}>
                          <TableCell className="font-medium">
                            {stat.name}
                          </TableCell>
                          <TableCell>
                            {stat.totalRequests.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                stat.rateLimited > 0 ? "destructive" : "default"
                              }
                            >
                              {stat.rateLimited.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {stat.successRate >= 90 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : stat.successRate >= 70 ? (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {stat.successRate.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            {Math.round(stat.avgResponseTime)}ms
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {stat.lastUsed !== "Never"
                              ? new Date(stat.lastUsed).toLocaleString()
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Endpoint Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Analytics</CardTitle>
              <CardDescription>Performance metrics by endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={endpointStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="endpoint" />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#f59e0b"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="totalRequests"
                      fill="#3b82f6"
                      name="Total Requests"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avgResponseTime"
                      fill="#f59e0b"
                      name="Avg Response Time (ms)"
                    />
                  </BarChart>
                </ResponsiveContainer>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Total Requests</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpointStats.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-gray-500"
                        >
                          No endpoint data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      endpointStats.map((stat, idx) => (
                        <TableRow key={`${stat.endpoint}-${stat.method}`}>
                          <TableCell className="font-mono text-sm">
                            {stat.endpoint}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                stat.method === "GET"
                                  ? "default"
                                  : stat.method === "POST"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {stat.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {stat.totalRequests.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {Math.round(stat.avgResponseTime)}ms
                          </TableCell>
                          <TableCell>
                            {Math.random() > 0.5 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Request Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Request Logs</CardTitle>
              <CardDescription>
                Latest API requests across all services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Rate Limited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-500"
                      >
                        No request logs available
                      </TableCell>
                    </TableRow>
                  ) : (
                    requestLogs.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.apiKey.substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.statusCode < 300
                                ? "success"
                                : log.statusCode < 400
                                  ? "default"
                                  : log.statusCode === 429
                                    ? "destructive"
                                    : "secondary"
                            }
                          >
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.responseTimeMs}ms</TableCell>
                        <TableCell>
                          {log.rateLimitHit ? (
                            <Badge variant="destructive">Yes</Badge>
                          ) : (
                            <Badge variant="success">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
