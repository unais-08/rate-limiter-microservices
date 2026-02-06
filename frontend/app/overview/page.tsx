"use client";

import DashboardLayout from "@/components/DashboardLayout";
import {
  Activity,
  Server,
  Shield,
  BarChart3,
  Key,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">
            Microservices-Based API Rate Limiter
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Production-Ready System with Real-Time Analytics
          </p>
          <p className="text-gray-400">
            A scalable, distributed rate limiting solution designed for
            high-traffic APIs
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Server className="h-6 w-6 text-blue-500" />
            System Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {/* Client */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Client</h3>
              <p className="text-sm text-gray-400">
                Sends requests with API key
              </p>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>

            {/* API Gateway */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">API Gateway</h3>
              <p className="text-sm text-blue-200">
                Entry point, validates & routes
              </p>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>

            {/* Backend */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Backend Service</h3>
              <p className="text-sm text-gray-400">Protected resources</p>
            </div>
          </div>

          {/* Microservices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-purple-700">
              <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Rate Limiter</h3>
              <p className="text-sm text-gray-400 mb-4">
                Token bucket algorithm with Redis
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>• Per-key limits</div>
                <div>• Sub-second precision</div>
                <div>• Distributed state</div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-yellow-700">
              <div className="h-12 w-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">
                Analytics Service
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Real-time metrics with PostgreSQL
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>• Request logging</div>
                <div>• Time-series data</div>
                <div>• Usage analytics</div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-green-700">
              <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Admin Service</h3>
              <p className="text-sm text-gray-400 mb-4">
                Management & monitoring dashboard
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>• API key CRUD</div>
                <div>• JWT authentication</div>
                <div>• System monitoring</div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-red-700">
              <div className="h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Backend Service</h3>
              <p className="text-sm text-gray-400 mb-4">
                Protected API endpoints
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>• Business logic</div>
                <div>• Data operations</div>
                <div>• Rate-limit aware</div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Request Arrives at API Gateway
                </h3>
                <p className="text-gray-400">
                  Client sends HTTP request with{" "}
                  <code className="bg-gray-900 px-2 py-1 rounded">
                    X-API-Key
                  </code>{" "}
                  header to the Gateway service (port 3000). Gateway validates
                  the API key format and checks if it exists.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Rate Limit Check
                </h3>
                <p className="text-gray-400">
                  Gateway calls Rate Limiter service (port 3002) which uses
                  Redis to implement a token bucket algorithm. Each API key has
                  a specific rate limit (e.g., 10 requests/minute). If tokens
                  are available, request proceeds; otherwise, returns 429
                  status.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Request Forwarding
                </h3>
                <p className="text-gray-400">
                  If rate limit allows, Gateway forwards the request to Backend
                  service (port 3001). Backend processes the request and returns
                  response. Gateway adds rate limit headers:{" "}
                  <code className="bg-gray-900 px-2 py-1 rounded">
                    X-RateLimit-Remaining
                  </code>
                  ,{" "}
                  <code className="bg-gray-900 px-2 py-1 rounded">
                    X-RateLimit-Reset
                  </code>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Analytics Logging
                </h3>
                <p className="text-gray-400">
                  After response is sent, Gateway logs request metadata to
                  Analytics service (port 3003) asynchronously. Analytics stores
                  data in PostgreSQL with tables for request logs, API key
                  metrics, and endpoint statistics. This powers the real-time
                  dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                5
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Dashboard Updates
                </h3>
                <p className="text-gray-400">
                  This frontend (Next.js on port 8080) polls Admin service (port
                  3004) every 5 seconds. Admin service aggregates data from
                  Analytics service. Dashboard displays real-time metrics: total
                  requests, blocked requests, charts, and recent violations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Technology Stack
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">Backend</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    Node.js
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    Express.js
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    TypeScript
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-green-400 mb-2">Frontend</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    Next.js 16
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    React 19
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    TailwindCSS
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    Axios
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    Recharts
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-purple-400 mb-2">
                  Data Stores
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    Redis
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-300">
                    PostgreSQL
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Key Features</h3>
            <div className="space-y-3">
              {[
                "Token bucket algorithm for smooth rate limiting",
                "Distributed state management with Redis",
                "Real-time analytics with PostgreSQL",
                "JWT-based admin authentication",
                "RESTful API design",
                "Horizontal scalability",
                "Comprehensive error handling",
                "Production-grade logging",
                "Automatic database migrations",
                "Interactive API documentation",
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Flow */}
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border border-blue-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Live Demo Flow</h2>
          <p className="text-blue-100 mb-6">
            This dashboard demonstrates real backend integration:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <div className="text-2xl font-bold text-white mb-2">1</div>
              <h4 className="font-semibold text-white mb-2">Create API Key</h4>
              <p className="text-sm text-blue-100">
                Go to <strong>API Keys</strong> page and create a new key with
                custom rate limit
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <div className="text-2xl font-bold text-white mb-2">2</div>
              <h4 className="font-semibold text-white mb-2">
                Simulate Requests
              </h4>
              <p className="text-sm text-blue-100">
                Use <strong>Request Simulator</strong> to send real API calls
                and see rate limiting in action
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <div className="text-2xl font-bold text-white mb-2">3</div>
              <h4 className="font-semibold text-white mb-2">Watch Dashboard</h4>
              <p className="text-sm text-blue-100">
                Return to <strong>Dashboard</strong> to see real-time metrics
                update automatically
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-blue-100">
              <strong>💡 Pro Tip:</strong> Open multiple browser tabs to
              simulate concurrent requests and observe how the rate limiter
              handles traffic spikes. Try the "Rate Limit Test" button to
              quickly exceed your limit and trigger 429 responses.
            </p>
          </div>
        </div>

        {/* Service Ports */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Service Endpoints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-blue-400 font-mono text-sm mb-1">
                http://localhost:3000
              </div>
              <div className="text-gray-400 text-sm">API Gateway</div>
            </div>
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-green-400 font-mono text-sm mb-1">
                http://localhost:3001
              </div>
              <div className="text-gray-400 text-sm">Backend Service</div>
            </div>
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-purple-400 font-mono text-sm mb-1">
                http://localhost:3002
              </div>
              <div className="text-gray-400 text-sm">Rate Limiter</div>
            </div>
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-yellow-400 font-mono text-sm mb-1">
                http://localhost:3003
              </div>
              <div className="text-gray-400 text-sm">Analytics Service</div>
            </div>
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-indigo-400 font-mono text-sm mb-1">
                http://localhost:3004
              </div>
              <div className="text-gray-400 text-sm">Admin Service</div>
            </div>
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-pink-400 font-mono text-sm mb-1">
                http://localhost:8080
              </div>
              <div className="text-gray-400 text-sm">Frontend Dashboard</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
