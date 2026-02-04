#!/bin/bash

echo "🎯 VISUAL RATE LIMIT DEMO"
echo "========================="
echo ""
echo "Config: MAX 10 tokens, refills 2/second"
echo ""

redis-cli FLUSHDB > /dev/null
API_KEY="visual_test"
URL="http://localhost:3002/api/v1/ratelimit/check"

echo "🚀 Sending 20 requests as fast as possible..."
echo ""
printf "Tokens: [##########] 10 remaining\n"

for i in {1..20}; do
  response=$(curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "{\"apiKey\": \"$API_KEY\"}")
  
  if echo "$response" | grep -q '"allowed":true'; then
    remaining=$(echo "$response" | grep -o '"remaining":[0-9]*' | cut -d':' -f2)
    
    # Visual token bar
    filled=$((remaining))
    empty=$((10 - filled))
    bar=$(printf '#%.0s' $(seq 1 $filled))
    spaces=$(printf ' %.0s' $(seq 1 $empty))
    
    printf "Request %2d: ✅ ALLOWED  [%s%s] %d tokens left\n" "$i" "$bar" "$spaces" "$remaining"
  else
    printf "Request %2d: ❌ BLOCKED  [          ] 0 tokens - RATE LIMIT EXCEEDED!\n" "$i"
  fi
  
  # Small delay to see the output
  sleep 0.05
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 What happened:"
echo "  • First 10 requests: ✅ Used up all tokens"
echo "  • Requests 11-20: ❌ Blocked (no tokens left)"
echo "  • Some might sneak through due to refill (2 tokens/sec)"
echo ""
echo "🔄 Now watch tokens refill in real-time..."
echo ""

for i in {1..10}; do
  # Check status
  status=$(curl -s "http://localhost:3002/api/v1/ratelimit/status/$API_KEY")
  tokens=$(echo "$status" | grep -o '"tokens":[0-9]*' | cut -d':' -f2)
  
  filled=$((tokens))
  empty=$((10 - filled))
  bar=$(printf '#%.0s' $(seq 1 $filled))
  spaces=$(printf ' %.0s' $(seq 1 $empty))
  
  printf "After %2ds: [%s%s] %d tokens\n" "$i" "$bar" "$spaces" "$tokens"
  
  sleep 1
done

echo ""
echo "✅ Bucket refilled! Ready for more requests."
echo ""
