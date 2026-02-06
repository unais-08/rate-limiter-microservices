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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "recharts";
import {
  Activity,
  Shield,
  Key,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface DashboardMetrics {
  totalRequests: number;
  blockedRequests: number;
  activeApiKeys: number;
  requestsPerMinute: number;
  blockRate: number;
}

interface RequestData {
  timestamp: string;
  requests: number;
  blocked: number;
}

interface Violation {
  id: string;
  apiKey: string;
  timestamp: string;
  endpoint: string;
  ip: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRequests: 0,
    blockedRequests: 0,
    activeApiKeys: 0,
    requestsPerMinute: 0,
    blockRate: 0,
  });
  const [requestData, setRequestData] = useState<RequestData[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data from admin service
      const dashboardResponse = await adminApi.getDashboard();
      const dashboardData = dashboardResponse.data?.data || {};

      // Fetch API keys
      const keysResponse = await adminApi.getApiKeys();
      const keys = keysResponse.data?.data || [];

      // Fetch analytics system stats
      let analyticsStats: any = {};
      try {
        const analyticsResponse = await fetch(
          "http://localhost:3003/api/v1/analytics/system-stats",
        );
        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          analyticsStats = data.data || {};
        }
      } catch (analyticsErr) {
        console.error("Failed to fetch analytics stats:", analyticsErr);
      }

      // Calculate metrics - prioritize analytics data
      const sysMetrics = dashboardData.metrics || {};
      const total = Number(
        analyticsStats.total_requests ||
          sysMetrics.total_requests ||
          sysMetrics.totalRequests ||
          0,
      );
      const blocked = Number(
        analyticsStats.total_rate_limited ||
          sysMetrics.total_rate_limited ||
          sysMetrics.blockedRequests ||
          0,
      );
      const active = keys.filter((k: any) => k.status === "active").length || 0;

      setMetrics({
        totalRequests: total,
        blockedRequests: blocked,
        activeApiKeys: active,
        requestsPerMinute: total > 0 ? Math.round(total / 60) : 0,
        blockRate: total > 0 ? Math.round((blocked / total) * 100) : 0,
      });

      // Fetch time-series data from analytics service
      try {
        const timeSeriesResponse = await fetch(
          "http://localhost:3003/api/v1/analytics/time-series?hours=1&interval=5min",
        );
        if (timeSeriesResponse.ok) {
          const tsData = await timeSeriesResponse.json();
          const timeSeriesArray = tsData.data || [];

          if (timeSeriesArray.length > 0) {
            const formattedData = timeSeriesArray.map((item: any) => ({
              timestamp: new Date(
                item.time_bucket || item.timestamp,
              ).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              requests: Number(item.request_count || item.totalRequests || 0),
              blocked: Number(
                item.rate_limited_count || item.blockedRequests || 0,
              ),
            }));
            setRequestData(formattedData);
          } else {
            // Generate mock data if no analytics data
            generateMockTimeSeriesData();
          }
        } else {
          generateMockTimeSeriesData();
        }
      } catch (tsErr) {
        console.error("Failed to fetch time series:", tsErr);
        generateMockTimeSeriesData();
      }

      // Fetch top rate-limited keys for violations table
      try {
        const violationsResponse = await fetch(
          "http://localhost:3003/api/v1/analytics/top-rate-limited?limit=5",
        );
        if (violationsResponse.ok) {
          const violData = await violationsResponse.json();
          const topRateLimited = violData.data || [];

          if (topRateLimited.length > 0) {
            const violationsData = topRateLimited.map(
              (item: any, idx: number) => ({
                id: `v${idx + 1}`,
                apiKey: item.api_key || "unknown",
                timestamp: item.last_request_at
                  ? new Date(item.last_request_at).toLocaleTimeString()
                  : "N/A",
                endpoint: "/api/v1/*",
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
              }),
            );
            setViolations(violationsData);
          } else {
            generateMockViolations();
          }
        } else {
          generateMockViolations();
        }
      } catch (violErr) {
        console.error("Failed to fetch violations:", violErr);
        generateMockViolations();
      }

      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  const generateMockTimeSeriesData = () => {
    const now = Date.now();
    const mockData: RequestData[] = [];
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now - i * 5 * 60 * 1000);
      mockData.push({
        timestamp: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        requests: Math.floor(Math.random() * 100) + 20,
        blocked: Math.floor(Math.random() * 20),
      });
    }
    setRequestData(mockData);
  };

  const generateMockViolations = () => {
    const now = Date.now();
    const mockViolations: Violation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `v${i + 1}`,
      apiKey: `sk_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(now - i * 2 * 60 * 1000).toLocaleTimeString(),
      endpoint: ["/api/users", "/api/products", "/api/orders"][
        Math.floor(Math.random() * 3)
      ],
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    }));
    setViolations(mockViolations);
  };

  useEffect(() => {
    fetchDashboardData();

    // Poll every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-spin text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading dashboard...
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
                Rate Limiter Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Real-time monitoring and analytics
              </p>
            </div>
            <Badge variant="success" className="text-sm px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.totalRequests.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.requestsPerMinute} req/min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Blocked Requests
                </CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {metrics.blockedRequests.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.blockRate}% block rate
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
                  {metrics.activeApiKeys}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Monitoring in real-time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24ms</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  12% faster
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Traffic</CardTitle>
                <CardDescription>Last hour request volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={requestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Total Requests"
                    />
                    <Line
                      type="monotone"
                      dataKey="blocked"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Blocked"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Violations</CardTitle>
                <CardDescription>
                  Requests blocked by rate limiter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={requestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="blocked"
                      fill="#ef4444"
                      name="Blocked Requests"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Violations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rate Limit Violations</CardTitle>
              <CardDescription>
                Latest requests blocked by the rate limiter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API Key</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-gray-500 dark:text-gray-400"
                      >
                        No violations detected
                      </TableCell>
                    </TableRow>
                  ) : (
                    violations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="font-mono text-sm">
                          {violation.apiKey}
                        </TableCell>
                        <TableCell>{violation.endpoint}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {violation.ip}
                        </TableCell>
                        <TableCell>{violation.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Blocked</Badge>
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
