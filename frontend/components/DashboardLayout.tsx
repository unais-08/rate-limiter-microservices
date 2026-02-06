"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Key,
  Activity,
  LogOut,
  Shield,
  Send,
  Info,
  BarChart2,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "API Keys", href: "/api-keys", icon: Key },
  { name: "API Analytics", href: "/api-usage", icon: BarChart2 },
  { name: "Services", href: "/monitoring", icon: Server },
  { name: "Request Simulator", href: "/simulator", icon: Send },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-gray-50">
              Rate Limiter
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                System Status
              </span>
              <Badge variant="success" className="text-xs">
                Operational
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              All services running
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">{children}</div>
    </div>
  );
}
