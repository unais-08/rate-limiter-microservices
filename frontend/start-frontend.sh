#!/bin/bash

# Frontend Start Script for Rate Limiter Dashboard
# This script starts the Next.js development server

cd "$(dirname "$0")"

echo "🚀 Starting Rate Limiter Dashboard..."
echo "📍 Location: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
    echo ""
fi

echo "🎯 Starting Next.js dev server on http://localhost:3005"
echo "📊 Dashboard will be available at:"
echo "   - Login: http://localhost:3005/login"
echo "   - Dashboard: http://localhost:3005/dashboard"
echo "   - API Keys: http://localhost:3005/api-keys"
echo "   - Monitoring: http://localhost:3005/monitoring"
echo ""
echo "⚡ Make sure backend services are running (use start-all-services.sh)"
echo "🔑 Default credentials: admin / admin123"
echo ""

# Start Next.js on port 3005 to avoid conflicts
PORT=3005 npm run dev
