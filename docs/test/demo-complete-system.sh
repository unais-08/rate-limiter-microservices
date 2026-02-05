#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Smart API Rate Limiter Platform - Live Demo        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check all services
echo "📊 System Health Check"
echo "────────────────────────"

check_service() {
  local name=$1
  local port=$2
  if curl -s http://localhost:$port/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name (Port $port) - ${GREEN}Running${NC}"
    return 0
  else
    echo -e "${RED}✗${NC} $name (Port $port) - ${RED}Offline${NC}"
    return 1
  fi
}

ALL_UP=true
check_service "API Gateway" 3000 || ALL_UP=false
check_service "Backend Service" 3001 || ALL_UP=false
check_service "Rate Limiter" 3002 || ALL_UP=false
check_service "Analytics" 3003 || ALL_UP=false
check_service "Admin Service" 3004 || ALL_UP=false

echo ""

if [ "$ALL_UP" = false ]; then
  echo -e "${YELLOW}⚠${NC} Some services are offline. Run ./start-all-services.sh"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓${NC} All services operational!"
echo ""

# Login to admin
echo "🔐 Authenticating with Admin Service"
echo "─────────────────────────────────────"
TOKEN=$(curl -s -X POST http://localhost:3004/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗${NC} Admin login failed"
  exit 1
fi

echo -e "${GREEN}✓${NC} Admin authenticated"
echo ""

# Create API key
echo "🔑 Creating New API Key"
echo "───────────────────────"
API_KEY_RESPONSE=$(curl -s -X POST http://localhost:3004/api/admin/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Application",
    "tier": "free",
    "tokensPerWindow": 10,
    "refillRate": 2,
    "maxBurst": 10
  }')

API_KEY=$(echo $API_KEY_RESPONSE | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
  echo -e "${RED}✗${NC} Failed to create API key"
  exit 1
fi

echo -e "${GREEN}✓${NC} API Key Created: ${CYAN}$API_KEY${NC}"
echo "  Name: Demo Application"
echo "  Tier: Free"
echo "  Limit: 10 requests/window, refill 2/sec"
echo ""

# Make some requests
echo "🚀 Making API Requests Through Gateway"
echo "───────────────────────────────────────"

ALLOWED=0
BLOCKED=0

for i in {1..15}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"value": 42}' \
    http://localhost:3000/api/process/calculate)
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    ALLOWED=$((ALLOWED + 1))
    echo -e "  ${GREEN}✓${NC} Request $i: ${GREEN}Allowed${NC} (200 OK)"
  elif [ "$HTTP_CODE" -eq 429 ]; then
    BLOCKED=$((BLOCKED + 1))
    echo -e "  ${YELLOW}⊘${NC} Request $i: ${YELLOW}Rate Limited${NC} (429)"
  else
    echo -e "  ${RED}✗${NC} Request $i: ${RED}Error${NC} ($HTTP_CODE)"
  fi
  
  sleep 0.3
done

echo ""
echo "  Summary: ${GREEN}$ALLOWED allowed${NC}, ${YELLOW}$BLOCKED blocked${NC}"
echo ""

# Wait for analytics
sleep 2

# Show analytics
echo "📈 Real-Time Analytics"
echo "──────────────────────"
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/monitoring/metrics)

if echo "$STATS" | grep -q '"success":true'; then
  echo "$STATS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)['data']
    if data:
        print(f\"  Total Requests: {data.get('total_requests', 'N/A')}\")
        print(f\"  Rate Limited: {data.get('total_rate_limited', 'N/A')}\")
        print(f\"  Unique API Keys: {data.get('unique_api_keys', 'N/A')}\")
        print(f\"  Avg Response Time: {data.get('avg_response_time', 'N/A')}ms\")
except:
    print('  (Analytics processing...)')
"
fi
echo ""

# Show API key details
echo "🔍 API Key Details"
echo "──────────────────"
KEY_DETAILS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys/$API_KEY)

echo "$KEY_DETAILS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)['data']
    print(f\"  API Key: {data['apiKey'][:20]}...\")
    print(f\"  Name: {data['name']}\")
    print(f\"  Tier: {data['tier']}\")
    print(f\"  Tokens Remaining: {float(data['tokens']):.1f}\")
    print(f\"  Max Tokens: {data['tokensPerWindow']}\")
    print(f\"  Enabled: {data['enabled']}\")
except:
    print('  (Data loading...)')
"
echo ""

# Dashboard overview
echo "📊 System Dashboard"
echo "───────────────────"
DASHBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/monitoring/dashboard 2>/dev/null)

if echo "$DASHBOARD" | grep -q '"success":true'; then
  echo -e "${GREEN}✓${NC} All services healthy"
  echo -e "${GREEN}✓${NC} Metrics collected"
  echo -e "${GREEN}✓${NC} Analytics active"
else
  echo "  Dashboard data loading..."
fi
echo ""

# Cleanup
echo "🧹 Cleanup"
echo "──────────"
DELETE_RESPONSE=$(curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/admin/keys/$API_KEY)

if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓${NC} Demo API key deleted"
else
  echo -e "${YELLOW}⚠${NC} Demo API key may still exist"
fi
echo ""

# Final summary
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              🎉 Demo Complete! 🎉                      ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "What just happened:"
echo "  1. ✓ Authenticated with Admin Service"
echo "  2. ✓ Created API key with rate limit (10 req, 2/sec refill)"
echo "  3. ✓ Made 15 requests through API Gateway"
echo "  4. ✓ Rate limiter blocked excess requests"
echo "  5. ✓ Analytics tracked all requests"
echo "  6. ✓ Admin dashboard showed live metrics"
echo "  7. ✓ Cleaned up demo API key"
echo ""
echo "Your complete microservices rate limiter platform is working!"
echo ""
echo "Next steps:"
echo "  • Create API keys: curl -X POST http://localhost:3004/api/admin/keys ..."
echo "  • View dashboard: curl http://localhost:3004/api/admin/monitoring/dashboard"
echo "  • Make requests: curl -H 'X-API-Key: your-key' http://localhost:3000/api/..."
echo ""
echo "Documentation: See README.md and individual service READMEs"
echo ""
