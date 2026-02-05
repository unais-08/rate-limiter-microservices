#!/bin/bash

echo "🔄 Starting Usage Analytics Service..."
echo ""

# Navigate to service directory
cd "$(dirname "$0")"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &>/dev/null; then
    echo "❌ PostgreSQL is not running!"
    echo "   Start it with: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw rate_limiter_analytics; then
    echo "❌ Database 'rate_limiter_analytics' does not exist!"
    echo "   Create it with: sudo -u postgres createdb rate_limiter_analytics"
    exit 1
fi

echo "✅ Database exists"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Dependencies ready"
echo ""
echo "🚀 Starting service on port 3003..."
echo ""

# Start the service
node src/index.js
