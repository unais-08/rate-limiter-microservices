#!/bin/bash

echo "📊 Rate Limiter Capacity Report"
echo "==============================="
echo ""

# Get current config
DEFAULT_TOKENS=100
REFILL_RATE=10
MAX_BURST=100

echo "⚙️  CURRENT CONFIGURATION:"
echo "  • Starting tokens: $DEFAULT_TOKENS"
echo "  • Refill rate: $REFILL_RATE tokens/second"
echo "  • Maximum capacity: $MAX_BURST tokens"
echo ""

echo "📈 WHAT THIS MEANS:"
echo ""

echo "1️⃣  INSTANT BURST:"
echo "  → Can handle $MAX_BURST requests immediately"
echo "  → Then bucket is empty"
echo ""

echo "2️⃣  SUSTAINED RATE:"
echo "  → After burst, limited to $REFILL_RATE requests/second"
echo "  → That's $(($REFILL_RATE * 60)) requests/minute"
echo "  → That's $(($REFILL_RATE * 3600)) requests/hour"
echo "  → That's $(($REFILL_RATE * 86400)) requests/day"
echo ""

echo "3️⃣  RECOVERY TIME:"
echo "  → Empty bucket refills completely in $(($MAX_BURST / $REFILL_RATE)) seconds"
echo ""

echo "4️⃣  EXAMPLES:"
echo ""
echo "  Example A - Normal User:"
echo "    • Makes 50 requests → ✅ All allowed (50 tokens left)"
echo "    • Waits 5 seconds → Refills 50 tokens (back to 100)"
echo "    • Can burst 100 again"
echo ""

echo "  Example B - Burst User:"
echo "    • Makes 100 requests instantly → ✅ All allowed (0 tokens)"
echo "    • Makes 1 more request → ❌ BLOCKED"
echo "    • Waits 1 second → Gets 10 tokens"
echo "    • Makes 10 requests → ✅ Allowed (0 tokens again)"
echo ""

echo "  Example C - Abuser:"
echo "    • Tries 1000 requests/second → Only $REFILL_RATE allowed/sec"
echo "    • Other 990 requests → ❌ BLOCKED"
echo ""

echo "🎯 CAPACITY BREAKDOWN:"
echo ""
echo "┌─────────────────┬──────────────────┐"
echo "│   Time Period   │   Max Requests   │"
echo "├─────────────────┼──────────────────┤"
echo "│ Instant (burst) │       $MAX_BURST       │"
echo "│ Per second      │        $REFILL_RATE       │"
echo "│ Per minute      │       $(($REFILL_RATE * 60))      │"
echo "│ Per hour        │     $(($REFILL_RATE * 3600))     │"
echo "│ Per day         │   $(($REFILL_RATE * 86400))   │"
echo "└─────────────────┴──────────────────┘"
echo ""

echo "💡 REAL-WORLD TEST:"
echo ""
redis-cli FLUSHDB > /dev/null

API_KEY="capacity_test"
URL="http://localhost:3002/api/v1/ratelimit/check"

echo "  Sending 120 requests as fast as possible..."
allowed=0
blocked=0
start=$(date +%s%3N)

for i in {1..120}; do
  response=$(curl -s -X POST "$URL" -H "Content-Type: application/json" -d "{\"apiKey\": \"$API_KEY\"}")
  if echo "$response" | grep -q '"allowed":true'; then
    allowed=$((allowed + 1))
  else
    blocked=$((blocked + 1))
  fi
done

end=$(date +%s%3N)
duration=$((end - start))
duration_sec=$(echo "scale=2; $duration / 1000" | bc)

echo ""
echo "  Results:"
echo "    ✅ Allowed: $allowed"
echo "    ❌ Blocked: $blocked"
echo "    ⏱️  Duration: ${duration_sec}s"
echo ""

refilled=$(echo "scale=0; $duration_sec * $REFILL_RATE" | bc)
expected=$((MAX_BURST + refilled))

echo "  Analysis:"
echo "    • Started with: $MAX_BURST tokens"
echo "    • Refilled during test: ~$refilled tokens"
echo "    • Expected capacity: ~$expected"
echo "    • Actual allowed: $allowed"
echo "    • Match: $(if [ $allowed -ge $((expected - 5)) ] && [ $allowed -le $((expected + 5)) ]; then echo "✅ YES"; else echo "⚠️ Close enough"; fi)"
echo ""

echo "🔧 TO CHANGE LIMITS:"
echo ""
echo "  Edit .env file:"
echo "    DEFAULT_TOKENS=500     # Allow 500 burst requests"
echo "    REFILL_RATE=50         # Refill 50 tokens/second"
echo "    MAX_BURST=500          # Maximum capacity 500"
echo ""
echo "  Then restart: npm start"
echo ""
