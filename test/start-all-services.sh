#!/bin/bash

echo "🚀 Starting All Services"
echo "======================="
echo ""

# Start Backend Service
cd /home/unais/Desktop/Ratelimiter/backend-service
if [ -f "src/server.js" ]; then
  echo "Starting Backend Service (port 3001)..."
  node src/server.js > /tmp/backend.log 2>&1 &
  BACKEND_PID=$!
  echo "  PID: $BACKEND_PID"
  sleep 2
fi

# Start Rate Limiter Service  
cd /home/unais/Desktop/Ratelimiter/rate-limiter-service
if [ -f "src/server.js" ]; then
  echo "Starting Rate Limiter Service (port 3002)..."
  node src/server.js > /tmp/rate-limiter.log 2>&1 &
  RATELIMITER_PID=$!
  echo "  PID: $RATELIMITER_PID"
  sleep 2
fi

# Start Usage Analytics Service
cd /home/unais/Desktop/Ratelimiter/usage-analytics-service
if [ -f "src/index.js" ]; then
  echo "Starting Usage Analytics Service (port 3003)..."
  node src/index.js > /tmp/analytics.log 2>&1 &
  ANALYTICS_PID=$!
  echo "  PID: $ANALYTICS_PID"
  sleep 2
fi

# Start Admin Service
cd /home/unais/Desktop/Ratelimiter/admin-service
if [ -f "src/server.js" ]; then
  echo "Starting Admin Service (port 3004)..."
  node src/server.js > /tmp/admin.log 2>&1 &
  ADMIN_PID=$!
  echo "  PID: $ADMIN_PID"
  sleep 2
fi

# Start API Gateway
cd /home/unais/Desktop/Ratelimiter/api-gateway-service
if [ -f "src/server.js" ]; then
  echo "Starting API Gateway (port 3000)..."
  node src/server.js > /tmp/gateway.log 2>&1 &
  GATEWAY_PID=$!
  echo "  PID: $GATEWAY_PID"
  sleep 2
fi

echo ""
echo "Waiting for services to start..."
sleep 3
echo ""

# Check status
echo "📊 Service Status:"
echo "─────────────────"

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ Backend Service (3001) - Running"
else
  echo "❌ Backend Service (3001) - Failed to start"
fi

if curl -s http://localhost:3002/health > /dev/null 2>&1; then
  echo "✅ Rate Limiter (3002) - Running"
else
  echo "❌ Rate Limiter (3002) - Failed to start"
fi

if curl -s http://localhost:3003/health > /dev/null 2>&1; then
  echo "✅ Usage Analytics (3003) - Running"
else
  echo "❌ Usage Analytics (3003) - Failed to start"
fi

if curl -s http://localhost:3004/health > /dev/null 2>&1; then
  echo "✅ Admin Service (3004) - Running"
else
  echo "❌ Admin Service (3004) - Failed to start"
fi

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "✅ API Gateway (3000) - Running"
else
  echo "❌ API Gateway (3000) - Failed to start"
fi

echo ""
echo "🎉 All services started!"
echo ""
echo "📝 Test with:"
echo "   cd /home/unais/Desktop/Ratelimiter"
echo "   ./test-complete-system.sh"
echo ""
echo "🛑 Stop all services:"
echo "   pkill -f 'node src/server.js'"
echo "   pkill -f 'node src/index.js'"
echo ""
