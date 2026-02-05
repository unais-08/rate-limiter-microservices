#!/bin/bash

# Real-time Rate Limiting Test Script
# This script sends requests and shows results that you can see in the frontend dashboard

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Your API key from the dashboard
API_KEY="sk_2e04973a51d2d923d6416c568a6a39e47ef2d0ba2725a6fd"

# API Gateway URL
GATEWAY_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Real-Time Rate Limiting Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Open your dashboard at: http://localhost:3005${NC}"
echo -e "${YELLOW}   Go to Dashboard page to see real-time metrics${NC}"
echo -e "${YELLOW}   Go to Monitoring page to see request counts${NC}"
echo ""
echo -e "Testing endpoint: ${GATEWAY_URL}/api/users/123"
echo -e "API Key: ${API_KEY:0:16}..."
echo ""
echo -e "${BLUE}Default rate limit: 10 requests per minute${NC}"
echo ""

# Counter for requests
SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

echo -e "${YELLOW}Sending 15 requests (expect first 10 to succeed, last 5 to be rate limited)...${NC}"
echo ""

for i in {1..15}; do
    echo -ne "Request $i/15: "
    
    # Make the request and capture status code
    RESPONSE=$(curl -s -w "\n%{http_code}" -H "X-API-Key: ${API_KEY}" "${GATEWAY_URL}/api/users/123")
    
    # Extract status code (last line) and body (all but last line)
    STATUS_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$STATUS_CODE" == "200" ]; then
        echo -e "${GREEN}✓ SUCCESS${NC} (200 OK)"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    elif [ "$STATUS_CODE" == "429" ]; then
        echo -e "${RED}✗ RATE LIMITED${NC} (429 Too Many Requests)"
        RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
    else
        echo -e "${RED}✗ ERROR${NC} ($STATUS_CODE)"
        echo "   Response: $BODY"
    fi
    
    # Small delay between requests (100ms)
    sleep 0.1
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Results${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Successful requests: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}Rate limited requests: ${RATE_LIMITED_COUNT}${NC}"
echo ""
echo -e "${YELLOW}🔍 Check your dashboard now:${NC}"
echo -e "   • Dashboard: See updated metrics and violation chart"
echo -e "   • API Keys: See request count for your key"
echo -e "   • Monitoring: See service response times"
echo ""
echo -e "${BLUE}Tip: Run this script multiple times to see the dashboard update in real-time!${NC}"
