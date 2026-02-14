# ----------------------------------
# 1️⃣ Build Stage
# ----------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .


# ----------------------------------
# 2️⃣ Production Stage
# ----------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Configure npm for better network handling
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy application code
COPY --from=builder /app/src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

CMD ["node", "src/server.js"]
