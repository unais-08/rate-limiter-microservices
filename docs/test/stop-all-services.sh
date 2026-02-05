#!/bin/bash

echo "🛑 Stopping All Services"
echo "======================="
echo ""

# Function to stop services by pattern
stop_services() {
  local pattern=$1
  local name=$2
  
  PIDS=$(pgrep -f "$pattern")
  
  if [ -z "$PIDS" ]; then
    echo "  ℹ️  $name - No running processes found"
    return 0
  fi
  
  echo "  🔄 Stopping $name..."
  pkill -f "$pattern"
  sleep 1
  
  # Force kill if still running
  if pgrep -f "$pattern" > /dev/null; then
    echo "  ⚠️  Force stopping $name..."
    pkill -9 -f "$pattern"
    sleep 1
  fi
  
  if ! pgrep -f "$pattern" > /dev/null; then
    echo "  ✅ $name stopped"
  else
    echo "  ❌ Failed to stop $name"
  fi
}

# Stop each service
stop_services "backend-service.*node src/server.js" "Backend Service (3001)"
stop_services "rate-limiter-service.*node src/server.js" "Rate Limiter Service (3002)"
stop_services "usage-analytics-service.*node src/index.js" "Usage Analytics Service (3003)"
stop_services "admin-service.*node src/server.js" "Admin Service (3004)"
stop_services "api-gateway-service.*node src/server.js" "API Gateway (3000)"

echo ""
echo "📊 Checking Service Status"
echo "─────────────────────────"

check_port() {
  local port=$1
  local name=$2
  
  if lsof -ti:$port > /dev/null 2>&1; then
    echo "  ❌ Port $port ($name) - Still in use"
    return 1
  else
    echo "  ✅ Port $port ($name) - Free"
    return 0
  fi
}

check_port 3000 "API Gateway"
check_port 3001 "Backend Service"
check_port 3002 "Rate Limiter"
check_port 3003 "Analytics"
check_port 3004 "Admin Service"

echo ""
echo "🧹 Cleaning up log files"
echo "────────────────────────"

# Optional: Clean up log files
if [ -f "/tmp/backend.log" ]; then
  rm /tmp/backend.log
  echo "  ✅ Removed backend.log"
fi

if [ -f "/tmp/rate-limiter.log" ]; then
  rm /tmp/rate-limiter.log
  echo "  ✅ Removed rate-limiter.log"
fi

if [ -f "/tmp/analytics.log" ]; then
  rm /tmp/analytics.log
  echo "  ✅ Removed analytics.log"
fi

if [ -f "/tmp/admin.log" ]; then
  rm /tmp/admin.log
  echo "  ✅ Removed admin.log"
fi

if [ -f "/tmp/gateway.log" ]; then
  rm /tmp/gateway.log
  echo "  ✅ Removed gateway.log"
fi

echo ""
echo "✅ All services stopped successfully!"
echo ""
echo "To start services again, run:"
echo "  ./start-all-services.sh"
echo ""
