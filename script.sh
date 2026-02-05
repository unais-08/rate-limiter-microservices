#!/bin/bash

# Configuration
URL="http://localhost:3000/api/v1/resources"
API_KEY="sk_48d11d674f304d5d428058988a61cb25e31cdaae05b87dfa"
TOTAL_REQUESTS=300
CONCURRENT_REQUESTS=10  # Number of parallel requests
DELAY_BETWEEN_BATCHES=0.1  # Delay in seconds between batches

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
ERROR_COUNT=0

echo "================================================"
echo "Rate Limiter Test Script"
echo "================================================"
echo "URL: $URL"
echo "API Key: ${API_KEY:0:20}..."
echo "Total Requests: $TOTAL_REQUESTS"
echo "Concurrent Requests: $CONCURRENT_REQUESTS"
echo "================================================"
echo ""

# Create a temporary directory for results
TEMP_DIR=$(mktemp -d)
echo "Temporary directory: $TEMP_DIR"
echo ""

# Function to make a single request
make_request() {
    local request_num=$1
    local output_file="$TEMP_DIR/response_${request_num}.txt"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "$URL" \
        -H "x-api-key: $API_KEY" \
        -H "Content-Type: application/json" \
        2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "$http_code|$body" > "$output_file"
}

# Export function and variables for parallel execution
export -f make_request
export URL API_KEY TEMP_DIR

# Make requests in batches
echo "Starting requests..."
start_time=$(date +%s)

for ((i=1; i<=TOTAL_REQUESTS; i+=CONCURRENT_REQUESTS)); do
    end=$((i + CONCURRENT_REQUESTS - 1))
    if [ $end -gt $TOTAL_REQUESTS ]; then
        end=$TOTAL_REQUESTS
    fi
    
    # Launch concurrent requests
    for ((j=i; j<=end; j++)); do
        make_request $j &
    done
    
    # Wait for this batch to complete
    wait
    
    echo -ne "Progress: $end/$TOTAL_REQUESTS requests completed\r"
    
    # Small delay between batches (optional)
    sleep $DELAY_BETWEEN_BATCHES
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo -e "\n"
echo "================================================"
echo "Processing Results..."
echo "================================================"

# Process results
for ((i=1; i<=TOTAL_REQUESTS; i++)); do
    if [ -f "$TEMP_DIR/response_${i}.txt" ]; then
        result=$(cat "$TEMP_DIR/response_${i}.txt")
        http_code=$(echo "$result" | cut -d'|' -f1)
        body=$(echo "$result" | cut -d'|' -f2-)
        
        case $http_code in
            200)
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                ;;
            429)
                RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
                if [ $RATE_LIMITED_COUNT -le 5 ]; then
                    echo -e "${YELLOW}Request #$i: Rate Limited (429)${NC}"
                    echo "  Response: $body"
                fi
                ;;
            *)
                ERROR_COUNT=$((ERROR_COUNT + 1))
                if [ $ERROR_COUNT -le 5 ]; then
                    echo -e "${RED}Request #$i: Error ($http_code)${NC}"
                    echo "  Response: $body"
                fi
                ;;
        esac
    fi
done

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "================================================"
echo "Test Results"
echo "================================================"
echo -e "${GREEN}Successful (200): $SUCCESS_COUNT${NC}"
echo -e "${YELLOW}Rate Limited (429): $RATE_LIMITED_COUNT${NC}"
echo -e "${RED}Errors (Other): $ERROR_COUNT${NC}"
echo "Total Requests: $TOTAL_REQUESTS"
echo "Duration: ${duration}s"
echo "Requests/Second: $(echo "scale=2; $TOTAL_REQUESTS / $duration" | bc)"
echo "================================================"

# Determine if rate limiter is working
if [ $RATE_LIMITED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Rate limiter is WORKING - Blocked $RATE_LIMITED_COUNT requests${NC}"
else
    echo -e "${RED}✗ Rate limiter NOT WORKING - All requests passed${NC}"
fi

echo "================================================"