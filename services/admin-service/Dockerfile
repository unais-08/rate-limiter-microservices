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
COPY prisma ./prisma
RUN npm ci --prefer-offline --no-audit

# Generate Prisma Client
RUN npx prisma generate

# Copy source
COPY . .

# Compile TypeScript
RUN npm run build


# ----------------------------------
# 2️⃣ Production Stage
# ----------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl3 libssl3

# Configure npm for better network handling
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy Prisma schema & generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled JS
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3002

# Run migrations then start service
CMD sh -c "npx prisma migrate deploy && node dist/server.js"
