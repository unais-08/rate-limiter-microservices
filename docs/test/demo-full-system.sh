#!/bin/bash

# Complete Demo Script for Smart API Rate Limiter Platform
# This script demonstrates the full stack: Backend + Frontend

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   Smart API Rate Limiter - Complete System Demo             ║"
echo "║   Microservices Backend + Next.js Dashboard                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓${NC} $name (port $port) - Running"
        return 0
    else
        echo -e "${RED}✗${NC} $name (port $port) - Not Running"
        return 1
    fi
}

echo -e "${CYAN}📋 SYSTEM OVERVIEW${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend Microservices:"
echo "  • API Gateway      : Port 3000"
echo "  • Backend Service  : Port 3001"
echo "  • Rate Limiter     : Port 3002"
echo "  • Analytics Service: Port 3003"
echo "  • Admin Service    : Port 3004"
echo ""
echo "Frontend Dashboard:"
echo "  • Next.js Dashboard: Port 3005"
echo ""
echo "Infrastructure:"
echo "  • Redis Cache      : Port 6379"
echo "  • PostgreSQL DB    : Port 5432"
echo ""

echo -e "${CYAN}🔍 CHECKING SYSTEM STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

all_running=true

# Check backend services
check_service 3000 "API Gateway" || all_running=false
check_service 3001 "Backend Service" || all_running=false
check_service 3002 "Rate Limiter Service" || all_running=false
check_service 3003 "Analytics Service" || all_running=false
check_service 3004 "Admin Service" || all_running=false

echo ""

# Check frontend
check_service 3005 "Next.js Dashboard" || all_running=false

echo ""

if [ "$all_running" = false ]; then
    echo -e "${YELLOW}⚠️  Some services are not running!${NC}"
    echo ""
    echo "To start all backend services:"
    echo "  ./start-all-services.sh"
    echo ""
    echo "To start frontend:"
    echo "  cd frontend && ./start-frontend.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ All services are running!${NC}"
echo ""

echo -e "${CYAN}🌐 ACCESS POINTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Frontend Dashboard:${NC}"
echo "  🔐 Login        : http://localhost:3005/login"
echo "  📊 Dashboard    : http://localhost:3005/dashboard"
echo "  🔑 API Keys     : http://localhost:3005/api-keys"
echo "  💚 Monitoring   : http://localhost:3005/monitoring"
echo ""
echo -e "${BLUE}Backend APIs:${NC}"
echo "  🌐 API Gateway  : http://localhost:3000"
echo "  🔧 Backend      : http://localhost:3001"
echo "  🛡️  Rate Limiter: http://localhost:3002"
echo "  📈 Analytics    : http://localhost:3003"
echo "  👤 Admin        : http://localhost:3004"
echo ""

echo -e "${CYAN}🔑 DEFAULT CREDENTIALS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Username: admin"
echo "  Password: admin123"
echo ""

echo -e "${CYAN}📖 DEMO WALKTHROUGH${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Open Dashboard:"
echo "   ${BLUE}http://localhost:3005/login${NC}"
echo ""
echo "2️⃣  Login with credentials above"
echo ""
echo "3️⃣  View Real-time Dashboard:"
echo "   • Live metrics refreshing every 5 seconds"
echo "   • Request traffic charts"
echo "   • Recent violations table"
echo ""
echo "4️⃣  Manage API Keys:"
echo "   • Create new keys with custom rate limits"
echo "   • Copy keys to clipboard"
echo "   • Toggle active/inactive status"
echo ""
echo "5️⃣  Monitor System Health:"
echo "   • All microservices status"
echo "   • Response time metrics"
echo "   • System uptime tracking"
echo ""

echo -e "${CYAN}🧪 TESTING THE SYSTEM${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "First, create an API key in the dashboard, then:"
echo ""
echo -e "${YELLOW}Test 1: Normal Request (within rate limit)${NC}"
echo 'curl http://localhost:3000/api/users \\'
echo '  -H "X-API-Key: YOUR_API_KEY"'
echo ""
echo -e "${YELLOW}Test 2: Rate Limit Test (send many requests)${NC}"
echo 'for i in {1..20}; do'
echo '  curl http://localhost:3000/api/users \\'
echo '    -H "X-API-Key: YOUR_API_KEY"'
echo '  echo " - Request $i"'
echo 'done'
echo ""
echo "Watch the dashboard update in real-time!"
echo ""

echo -e "${CYAN}📚 ARCHITECTURE HIGHLIGHTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend:"
echo "  ✓ Token Bucket algorithm with Redis (atomic operations)"
echo "  ✓ PostgreSQL for time-series analytics"
echo "  ✓ JWT authentication with bcrypt"
echo "  ✓ Microservices architecture"
echo "  ✓ RESTful APIs with Express.js"
echo ""
echo "Frontend:"
echo "  ✓ Next.js 16 with App Router"
echo "  ✓ TypeScript for type safety"
echo "  ✓ Tailwind CSS for styling"
echo "  ✓ Recharts for data visualization"
echo "  ✓ Real-time polling (5-second intervals)"
echo ""

echo -e "${CYAN}🎓 FOR YOUR RESUME${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project Title:"
echo '  "Smart API Rate Limiter with Microservices & Dashboard"'
echo ""
echo "Description:"
echo '  Built a production-ready API rate limiting platform using'
echo '  microservices architecture. Implemented Token Bucket algorithm'
echo '  with Redis for atomic operations, PostgreSQL for analytics,'
echo '  and modern Next.js dashboard for real-time monitoring.'
echo ""
echo "Tech Stack:"
echo "  Backend: Node.js, Express, Redis, PostgreSQL, JWT"
echo "  Frontend: Next.js 16, TypeScript, Tailwind CSS, Recharts"
echo "  DevOps: Docker-ready, Shell scripts for automation"
echo ""
echo "Key Achievements:"
echo "  • 5 microservices communicating via REST APIs"
echo "  • Token Bucket algorithm with Lua scripts (atomic operations)"
echo "  • Real-time dashboard with 5-second polling"
echo "  • Complete CRUD operations for API key management"
echo "  • System health monitoring for all services"
echo ""

echo -e "${CYAN}🛠️  USEFUL COMMANDS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Start all backend services:"
echo "  ./start-all-services.sh"
echo ""
echo "Stop all backend services:"
echo "  ./stop-all-services.sh"
echo ""
echo "Start frontend:"
echo "  cd frontend && ./start-frontend.sh"
echo ""
echo "View logs (follow):"
echo "  tail -f backend-service/logs/*.log"
echo ""
echo "Check what's running on ports:"
echo "  lsof -i :3000-3005"
echo ""

echo -e "${GREEN}✨ System is ready for demo!${NC}"
echo ""
echo "Press any key to open the dashboard in your browser..."
read -n 1 -s

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3005/login
elif command -v open &> /dev/null; then
    open http://localhost:3005/login
else
    echo "Please open http://localhost:3005/login in your browser"
fi

echo ""
echo -e "${CYAN}Happy demoing! 🚀${NC}"
echo ""
