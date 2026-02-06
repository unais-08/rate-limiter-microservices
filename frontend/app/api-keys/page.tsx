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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Key,
  Trash2,
  RefreshCw,
  Copy,
  CheckCircle,
  Activity,
} from "lucide-react";
import { adminApi, analyticsApi } from "@/lib/api";

interface ApiKey {
  id: string;
  apiKey: string;
  name: string;
  rateLimit?: number;
  status: "active" | "inactive";
  createdAt?: string;
  lastUsed?: string;
  requestCount?: number;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyLimit, setNewKeyLimit] = useState("100");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<any[]>([]);

  const fetchApiKeys = async () => {
    try {
      const response = await adminApi.getApiKeys();
      const keys = response.data?.data || [];
      setApiKeys(keys);

      // Fetch analytics for all API keys
      try {
        const analyticsResponse = await fetch(
          "http://localhost:3003/api/v1/analytics/api-keys",
        );
        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          const analyticsData = data.data || [];

          // Create usage chart data
          const chartData = analyticsData.slice(0, 10).map((item: any) => ({
            name:
              keys.find((k: any) => k.apiKey === item.api_key)?.name ||
              item.api_key.substring(0, 10),
            requests: parseInt(item.total_requests) || 0,
            rateLimited: parseInt(item.total_rate_limited) || 0,
          }));
          setUsageData(chartData);
        }
      } catch (analyticsErr) {
        console.error("Failed to fetch analytics:", analyticsErr);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();

    // Refresh every 10 seconds
    const interval = setInterval(fetchApiKeys, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      await adminApi.createApiKey({
        name: newKeyName,
        rateLimit: parseInt(newKeyLimit) || 100,
      });
      setNewKeyName("");
      setNewKeyLimit("100");
      await fetchApiKeys();
    } catch (err) {
      console.error("Failed to create API key:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (apiKey: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      await adminApi.deleteApiKey(apiKey);
      await fetchApiKeys();
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  };

  const handleToggleStatus = async (apiKey: string, currentStatus: string) => {
    try {
      await adminApi.updateApiKey(apiKey, {
        status: currentStatus === "active" ? "inactive" : "active",
      });
      await fetchApiKeys();
    } catch (err) {
      console.error("Failed to update API key:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading API keys...
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
                API Keys
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Manage your API keys and rate limits
              </p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Key className="h-3 w-3 mr-1" />
              {apiKeys.length} keys
            </Badge>
          </div>

          {/* Create New Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New API Key
              </CardTitle>
              <CardDescription>
                Generate a new API key with custom rate limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    Key Name
                  </label>
                  <Input
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateKey()}
                  />
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    Rate Limit (req/min)
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newKeyLimit}
                    onChange={(e) => setNewKeyLimit(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateKey()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCreateKey}
                    disabled={creating || !newKeyName.trim()}
                    className="w-32"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Chart */}
          {usageData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>API Key Usage Overview</CardTitle>
                <CardDescription>
                  Total and rate-limited requests per API key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="requests"
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
              </CardContent>
            </Card>
          )}

          {/* API Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                All API keys with their current status and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No API keys yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Create your first API key to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key, index) => (
                      <TableRow key={key.id || key.apiKey || index}>
                        <TableCell className="font-medium">
                          {key.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {key.apiKey.substring(0, 20)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(key.apiKey)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                              {copiedKey === key.apiKey ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>{key.rateLimit || 0} req/min</TableCell>
                        <TableCell>
                          {(key.requestCount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              key.status === "active" ? "success" : "secondary"
                            }
                            className="cursor-pointer"
                            onClick={() =>
                              handleToggleStatus(key.apiKey, key.status)
                            }
                          >
                            {key.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {key.createdAt
                            ? new Date(key.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteKey(key.apiKey)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
