#!/bin/bash

xfce4-terminal --tab --title="Admin Service" \
  --command="bash -c 'cd admin-service && npm run dev; exec bash'" &

xfce4-terminal --tab --title="API Gateway" \
  --command="bash -c 'cd api-gateway-service && npm run dev; exec bash'" &

xfce4-terminal --tab --title="Rate Limiter" \
  --command="bash -c 'cd rate-limiter-service && npm run dev; exec bash'" &

xfce4-terminal --tab --title="Usage Analytics" \
  --command="bash -c 'cd usage-analytics-service && npm run dev; exec bash'" &
