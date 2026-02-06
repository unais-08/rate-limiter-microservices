#!/bin/bash

set -e

SERVICES=(
  "admin-service"
  "api-gateway-service"
  "rate-limiter-service"
  "usage-analytics-service"
)

echo "Installing dependencies for all services..."

for SERVICE in "${SERVICES[@]}"; do
  echo "➡️  Installing in $SERVICE"
  cd "$SERVICE"
  npm install
  cd ..
done

echo "✅ All dependencies installed successfully"
