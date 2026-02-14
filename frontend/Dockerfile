# -------------------------------
# 1️⃣ Build Stage
# -------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build


# -------------------------------
# 2️⃣ Production Stage
# -------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

CMD ["node", "server.js"]
