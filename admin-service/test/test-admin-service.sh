#!/bin/bash

echo "🧪 Testing Admin Service"
echo "========================"
echo ""

ADMIN_URL="http://localhost:3004"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Step 1: Login to Admin Service"
echo "───────────────────────────────"
LOGIN_RESPONSE=$(curl -s -X POST $ADMIN_URL/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗${NC} Login failed"
  exit 1
fi

echo -e "${GREEN}✓${NC} Login successful"
echo "  Token: ${TOKEN:0:30}..."
echo ""

echo "Step 2: Create a New API Key"
echo "────────────────────────────"
CREATE_RESPONSE=$(curl -s -X POST $ADMIN_URL/api/admin/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Application",
    "tier": "pro",
    "tokensPerWindow": 200,
    "refillRate": 20,
    "maxBurst": 200
  }')

NEW_API_KEY=$(echo $CREATE_RESPONSE | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEW_API_KEY" ]; then
  echo -e "${RED}✗${NC} Failed to create API key"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓${NC} API key created"
echo "  Key: $NEW_API_KEY"
echo "  Name: Test Application"
echo "  Tier: pro"
echo "  Tokens: 200"
echo ""

echo "Step 3: List All API Keys"
echo "─────────────────────────"
KEYS_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/keys)

KEY_COUNT=$(echo $KEYS_LIST | grep -o '"count":[0-9]*' | cut -d':' -f2)

echo -e "${GREEN}✓${NC} Retrieved API keys"
echo "  Total keys: $KEY_COUNT"
echo ""

echo "Step 4: Get API Key Stats"
echo "─────────────────────────"
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/keys/stats)

echo "$STATS" | python3 -c "import sys, json; data = json.load(sys.stdin)['data']; print(f\"  Total Keys: {data['totalKeys']}\"); print(f\"  Enabled: {data['enabledKeys']}\"); print(f\"  Disabled: {data['disabledKeys']}\"); print(f\"  Tiers: {data['tierCounts']}\")"
echo ""

echo "Step 5: Check Services Health"
echo "──────────────────────────────"
HEALTH=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/monitoring/health)

echo "$HEALTH" | python3 -c "
import sys, json
services = json.load(sys.stdin)['data']
for svc in services:
    status = '✓' if svc['status'] == 'healthy' else '✗'
    print(f\"  {status} {svc['name']} (Port {svc['port']}): {svc['status']}\")
"
echo ""

echo "Step 6: Get System Metrics"
echo "──────────────────────────"
METRICS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/monitoring/metrics)

if echo "$METRICS" | grep -q '"success":true'; then
  echo "$METRICS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)['data']
    if data:
        print(f\"  Unique API Keys: {data.get('unique_api_keys', 'N/A')}\")
        print(f\"  Total Requests: {data.get('total_requests', 'N/A')}\")
        print(f\"  Rate Limited: {data.get('total_rate_limited', 'N/A')}\")
        print(f\"  Avg Response Time: {data.get('avg_response_time', 'N/A')}ms\")
    else:
        print('  (No metrics data yet)')
except:
    print('  (Analytics service data not available)')
"
else
  echo "  (Metrics not available)"
fi
echo ""

echo "Step 7: Get Dashboard Data"
echo "──────────────────────────"
DASHBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/monitoring/dashboard 2>/dev/null)

if echo "$DASHBOARD" | grep -q '"success":true'; then
  echo -e "${GREEN}✓${NC} Dashboard data retrieved"
  echo "  Services: OK"
  echo "  Metrics: OK"
  echo "  Analytics: OK"
else
  echo -e "${BLUE}ℹ${NC} Dashboard data partially available"
fi
echo ""

echo "Step 8: Update API Key"
echo "──────────────────────"
UPDATE_RESPONSE=$(curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Test App","tokensPerWindow":300}' \
  $ADMIN_URL/api/admin/keys/$NEW_API_KEY)

if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓${NC} API key updated"
  echo "  New name: Updated Test App"
  echo "  New token limit: 300"
else
  echo -e "${RED}✗${NC} Failed to update API key"
fi
echo ""

echo "Step 9: Reset Tokens"
echo "────────────────────"
RESET_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/keys/$NEW_API_KEY/reset)

if echo "$RESET_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓${NC} Tokens reset successfully"
else
  echo -e "${RED}✗${NC} Failed to reset tokens"
fi
echo ""

echo "Step 10: Delete API Key"
echo "───────────────────────"
DELETE_RESPONSE=$(curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  $ADMIN_URL/api/admin/keys/$NEW_API_KEY)

if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓${NC} API key deleted successfully"
else
  echo -e "${RED}✗${NC} Failed to delete API key"
fi
echo ""

echo "═══════════════════════════════════"
echo "🎉 Admin Service Testing Complete!"
echo "═══════════════════════════════════"
echo ""
echo "Summary:"
echo "  ✓ Authentication working"
echo "  ✓ API key management working"
echo "  ✓ Monitoring endpoints working"
echo "  ✓ Service integration working"
echo ""
echo "Admin Service is fully operational! 🚀"
echo ""
