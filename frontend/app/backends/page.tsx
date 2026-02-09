"use client";

import { useState, useEffect } from "react";
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
import { adminApi } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { ApiKey } from "@/lib/types";
import {
  Server,
  Plus,
  Trash2,
  TestTube,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  Globe,
  Shield,
  Zap,
} from "lucide-react";

interface BackendEndpoint {
  id: string;
  userId: string;
  slug: string;
  targetUrl: string;
  description: string | null;
  authType: "none" | "bearer" | "basic" | "api-key";
  authConfig: Record<string, string> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BackendsPage() {
  const [endpoints, setEndpoints] = useState<BackendEndpoint[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [slug, setSlug] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [authType, setAuthType] = useState<
    "none" | "bearer" | "basic" | "api-key"
  >("none");
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [apiKeyHeader, setApiKeyHeader] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [endpointsRes, keysRes] = await Promise.all([
        adminApi.getBackendEndpoints(),
        adminApi.getApiKeys(),
      ]);
      setEndpoints(endpointsRes.data?.data || []);
      setApiKeys(keysRes.data?.data || []);
    } catch (error) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSlug("");
    setTargetUrl("");
    setDescription("");
    setAuthType("none");
    setSelectedApiKey("");
    setBearerToken("");
    setBasicUsername("");
    setBasicPassword("");
    setApiKeyHeader("X-API-Key");
    setApiKeyValue("");
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!slug || !targetUrl) {
      showToast("Slug and Target URL are required", "error");
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showToast(
        "Slug can only contain lowercase letters, numbers, and hyphens",
        "error",
      );
      return;
    }

    setSaving(true);
    try {
      let authConfig: Record<string, string> | null = null;

      if (authType === "bearer") {
        authConfig = { token: bearerToken };
      } else if (authType === "basic") {
        authConfig = { username: basicUsername, password: basicPassword };
      } else if (authType === "api-key") {
        // Use selected API key from dropdown
        if (selectedApiKey) {
          const key = apiKeys.find((k) => k.id.toString() === selectedApiKey);
          authConfig = {
            header: apiKeyHeader,
            value: key?.apiKey || apiKeyValue,
          };
        } else if (apiKeyValue) {
          authConfig = { header: apiKeyHeader, value: apiKeyValue };
        }
      }

      await adminApi.createBackendEndpoint({
        name: slug,
        slug,
        targetUrl,
        authType,
        authConfig: authConfig || undefined,
      });

      showToast("Backend endpoint created successfully!", "success");
      resetForm();
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(
        err.response?.data?.error || "Failed to create endpoint",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this endpoint?")) return;

    try {
      await adminApi.deleteBackendEndpoint(id);
      showToast("Endpoint deleted", "success");
      loadData();
    } catch {
      showToast("Failed to delete endpoint", "error");
    }
  };

  const handleTest = async (endpoint: BackendEndpoint) => {
    setTesting(endpoint.id);
    setTestResults((prev) => ({
      ...prev,
      [endpoint.id]: { success: false, message: "Testing..." },
    }));

    try {
      const response = await adminApi.testBackendEndpoint(endpoint.id);
      const result = response.data;
      setTestResults((prev) => ({
        ...prev,
        [endpoint.id]: {
          success: result.success,
          message: result.success
            ? `Connected! (${result.status} ${result.statusText}, ${result.responseTime}ms)`
            : result.error || "Connection failed",
        },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [endpoint.id]: { success: false, message: "Test request failed" },
      }));
    } finally {
      setTesting(null);
    }
  };

  const copyGatewayUrl = (slug: string) => {
    const url = `http://localhost:3000/api/v1/s/${slug}`;
    navigator.clipboard.writeText(url);
    showToast("Gateway URL copied to clipboard!", "success");
  };

  const getAuthBadge = (authType: string) => {
    switch (authType) {
      case "none":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            No Auth
          </Badge>
        );
      case "bearer":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Bearer Token
          </Badge>
        );
      case "basic":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Basic Auth
          </Badge>
        );
      case "api-key":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            API Key
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Backend Endpoints
            </h1>
            <p className="text-gray-500 mt-1">
              Connect your services and route requests through our API gateway
            </p>
          </div>
          {!showForm && endpoints.length > 0 && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Endpoint
            </Button>
          )}
        </div>

        {/* Empty State */}
        {endpoints.length === 0 && !showForm && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-blue-50 p-4 mb-4">
                <Server className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No endpoints configured
              </h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Connect your backend services to route requests through our API
                gateway with built-in rate limiting, monitoring, and analytics.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    Rate limiting protection
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    Real-time monitoring
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Globe className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    Single entry point
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Your First Endpoint
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Endpoint Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Add Backend Endpoint
              </CardTitle>
              <CardDescription>
                Configure a new backend service to route through the API gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="my-backend"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Access via:{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      http://localhost:3000/api/v1/s/{slug || "your-slug"}/...
                    </code>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Target URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="http://localhost:8080"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    The base URL of your backend service
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <Input
                  placeholder="Optional description for this endpoint"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Auth Configuration */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">
                  Authentication
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "none", label: "No Auth", icon: Globe },
                    { value: "bearer", label: "Bearer Token", icon: Shield },
                    { value: "basic", label: "Basic Auth", icon: Key },
                    { value: "api-key", label: "API Key", icon: Key },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAuthType(opt.value as typeof authType)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        authType === opt.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <opt.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Auth Fields */}
                {authType === "bearer" && (
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">
                      Bearer Token
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter your bearer token"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                    />
                  </div>
                )}

                {authType === "basic" && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <Input
                        placeholder="Username"
                        value={basicUsername}
                        onChange={(e) => setBasicUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={basicPassword}
                        onChange={(e) => setBasicPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {authType === "api-key" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    {apiKeys.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Select Existing API Key
                          </label>
                          <select
                            value={selectedApiKey}
                            onChange={(e) => {
                              setSelectedApiKey(e.target.value);
                              setApiKeyValue("");
                            }}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Select an API Key --</option>
                            {apiKeys.map((key) => (
                              <option key={key.id} value={key.id.toString()}>
                                {key.name} ({key.apiKey.substring(0, 12)}...)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 border-t border-gray-300"></div>
                          <span className="text-xs text-gray-500">OR</span>
                          <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Enter Custom API Key
                          </label>
                          <Input
                            placeholder="Enter custom API key value"
                            value={apiKeyValue}
                            onChange={(e) => {
                              setApiKeyValue(e.target.value);
                              setSelectedApiKey("");
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            No API Keys Created
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            You haven&apos;t created any API keys yet. Create
                            one in the{" "}
                            <a
                              href="/api-keys"
                              className="underline font-medium hover:text-amber-900"
                            >
                              API Keys
                            </a>{" "}
                            section first, or enter a custom key below.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Header Name
                        </label>
                        <Input
                          placeholder="X-API-Key"
                          value={apiKeyHeader}
                          onChange={(e) => setApiKeyHeader(e.target.value)}
                        />
                      </div>
                      {!selectedApiKey && !apiKeys.length && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            API Key Value
                          </label>
                          <Input
                            type="password"
                            placeholder="Your API key"
                            value={apiKeyValue}
                            onChange={(e) => setApiKeyValue(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Endpoint
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endpoints List */}
        {endpoints.length > 0 && (
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <Card key={endpoint.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border">
                      <Server className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {endpoint.slug}
                        </h3>
                        {endpoint.isActive ? (
                          <Badge className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {getAuthBadge(endpoint.authType)}
                      </div>
                      {endpoint.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {endpoint.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(endpoint)}
                      disabled={testing === endpoint.id}
                      className="gap-2"
                    >
                      {testing === endpoint.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyGatewayUrl(endpoint.slug)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(endpoint.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Target:</span>
                      <code className="px-2 py-1 bg-gray-100 rounded text-gray-800">
                        {endpoint.targetUrl}
                      </code>
                      <a
                        href={endpoint.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Gateway URL:</span>
                    <code className="px-2 py-1 bg-blue-50 rounded text-blue-700">
                      http://localhost:3000/api/v1/s/{endpoint.slug}/*
                    </code>
                  </div>

                  {/* Test Result */}
                  {testResults[endpoint.id] && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        testResults[endpoint.id].success
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {testResults[endpoint.id].success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {testResults[endpoint.id].message}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
