#!/bin/bash

# Frontend Quick Start Script
# This script starts the Next.js frontend dashboard

echo "=========================================="
echo "  Rate Limiter Dashboard - Starting"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local configuration..."
    cat > .env.local << EOF
# Admin Service (for authentication and API key management)
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3004

# API Gateway (for making rate-limited requests)
NEXT_PUBLIC_GATEWAY_API_URL=http://localhost:3000

# Backend Service (protected resources)
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001

# Rate Limiter Service
NEXT_PUBLIC_RATELIMIT_API_URL=http://localhost:3002

# Analytics Service
NEXT_PUBLIC_ANALYTICS_API_URL=http://localhost:3003
EOF
    echo "✅ Configuration file created"
    echo ""
fi

echo "🚀 Starting Next.js development server..."
echo ""
echo "Frontend will be available at: http://localhost:8080"
echo "Default login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
