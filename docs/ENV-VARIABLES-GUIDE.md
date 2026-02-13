# 🔧 Environment Variables Quick Reference

## Understanding Frontend URLs

The frontend URLs are **critical** because they determine how your browser connects to the backend services.

---

## 📍 Service URL Types

### 1. **Internal Service URLs** (Docker Network)

Used by services to communicate with each other inside Docker.

```env
# These NEVER change - they use Docker DNS
ADMIN_SERVICE_URL=http://admin-service:3004
GATEWAY_SERVICE_URL=http://gateway-service:3000
RATE_LIMITER_SERVICE_URL=http://rate-limiter-service:3002
ANALYTICS_SERVICE_URL=http://analytics-service:3003
BACKEND_SERVICE_URL=http://backend-service:3001
```

**❗ Important:** These are used by backend services only!

---

### 2. **Browser/Frontend URLs** (NEXT*PUBLIC*\*)

Used by your **browser** to connect to backend services.

```env
# Variables starting with NEXT_PUBLIC_ are exposed to the browser
NEXT_PUBLIC_API_URL=???
NEXT_PUBLIC_GATEWAY_URL=???
```

**These change based on where you're running:**

---

## 🎯 Configuration Scenarios

### Scenario 1: Local Machine Production (Docker)

**When to use:** Running `docker-compose.prod.yml` on your laptop/desktop

```env
NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
```

**Why `localhost`?**

- Your browser runs on your machine
- Services expose ports to your machine (3000, 3004, etc.)
- Browser connects to `localhost:PORT`

**Test it:**

```bash
curl http://localhost:3004/health
curl http://localhost:3000/health
```

---

### Scenario 2: Remote Server with IP Address

**When to use:** Deployed to a VPS/cloud server, no domain yet

```env
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3004
NEXT_PUBLIC_GATEWAY_URL=http://YOUR_SERVER_IP:3000
```

**Example:**

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:3004
NEXT_PUBLIC_GATEWAY_URL=http://192.168.1.100:3000
```

**Why server IP?**

- Your browser runs on your laptop
- Services run on remote server
- Browser needs to reach the server IP

---

### Scenario 3: Remote Server with Domain (No Nginx)

**When to use:** Have a domain, services expose ports directly

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com:3004
NEXT_PUBLIC_GATEWAY_URL=https://yourdomain.com:3000
```

**Example:**

```env
NEXT_PUBLIC_API_URL=https://ratelimiter.com:3004
NEXT_PUBLIC_GATEWAY_URL=https://ratelimiter.com:3000
```

---

### Scenario 4: Remote Server with Domain + Nginx (Recommended Production)

**When to use:** Production deployment with reverse proxy

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GATEWAY_URL=https://gateway.yourdomain.com
```

**Example:**

```env
NEXT_PUBLIC_API_URL=https://api.ratelimiter.com
NEXT_PUBLIC_GATEWAY_URL=https://gateway.ratelimiter.com
```

**OR with subpaths:**

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_GATEWAY_URL=https://yourdomain.com/gateway
```

**Requirements:**

- Comment out port mappings in docker-compose.prod.yml
- Configure nginx.conf with your domain
- Set up SSL certificates
- Configure DNS A records

---

## 🔍 How to Determine Which to Use

### Ask yourself:

1. **Where is the browser running?**
   - Same machine as Docker → Use `localhost`
   - Different machine → Use server IP or domain

2. **Do services expose ports?**
   - Yes (ports like 3000:3000 in docker-compose) → Use direct URLs with ports
   - No (only nginx exposes 80/443) → Use nginx routes

3. **Do you have a domain?**
   - No → Use IP address
   - Yes → Use domain name

4. **Is SSL configured?**
   - Yes → Use `https://`
   - No → Use `http://`

---

## 📊 Quick Decision Tree

```
Where is your browser?
├─ On same machine as Docker
│  └─ Use: http://localhost:3004
│
├─ On different machine (remote server)
│  ├─ Have domain?
│  │  ├─ Yes, with Nginx
│  │  │  └─ Use: https://api.yourdomain.com
│  │  │
│  │  └─ Yes, without Nginx
│  │     └─ Use: https://yourdomain.com:3004
│  │
│  └─ No domain
│     └─ Use: http://SERVER_IP:3004
```

---

## ⚙️ Complete Configuration Examples

### Example 1: Local Development (docker-compose.yml)

```env
# .env
NODE_ENV=development
POSTGRES_PASSWORD=postgres123
REDIS_PASSWORD=

NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
```

### Example 2: Local Production (docker-compose.prod.yml)

```env
# .env.production
NODE_ENV=production
POSTGRES_PASSWORD=StrongPass123!
REDIS_PASSWORD=RedisPass456!
JWT_SECRET=your-64-char-secret-here

NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
```

### Example 3: Remote Server Testing (IP)

```env
# .env.production
NODE_ENV=production
POSTGRES_PASSWORD=StrongPass123!
REDIS_PASSWORD=RedisPass456!
JWT_SECRET=your-64-char-secret-here

NEXT_PUBLIC_API_URL=http://159.89.45.123:3004
NEXT_PUBLIC_GATEWAY_URL=http://159.89.45.123:3000
```

### Example 4: Full Production (Domain + SSL + Nginx)

```env
# .env.production
NODE_ENV=production
POSTGRES_PASSWORD=StrongPass123!
REDIS_PASSWORD=RedisPass456!
JWT_SECRET=your-64-char-secret-here

NEXT_PUBLIC_API_URL=https://api.ratelimiter.io
NEXT_PUBLIC_GATEWAY_URL=https://gateway.ratelimiter.io
```

---

## 🚨 Common Mistakes

### ❌ Wrong: Using Docker service names in frontend URLs

```env
# This will NOT work in browser!
NEXT_PUBLIC_API_URL=http://admin-service:3004  # ❌
```

**Why?** Browser doesn't know Docker DNS names.

### ❌ Wrong: Using localhost when deployed remotely

```env
# On remote server - browser on your laptop
NEXT_PUBLIC_API_URL=http://localhost:3004  # ❌
```

**Why?** `localhost` refers to your laptop, not the server.

### ❌ Wrong: Using internal URLs for frontend

```env
# Frontend needs browser-accessible URLs
NEXT_PUBLIC_API_URL=http://admin-service:3004  # ❌
```

**Why?** Docker service names only work inside containers.

---

## ✅ Correct Patterns

### ✅ Correct: Local machine

```env
NEXT_PUBLIC_API_URL=http://localhost:3004  # ✅
```

### ✅ Correct: Remote server IP

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:3004  # ✅
```

### ✅ Correct: Production domain

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # ✅
```

---

## 🧪 Testing Your Configuration

### Test Backend Connectivity

```bash
# From your browser's machine (laptop/desktop)
curl http://localhost:3004/health
curl http://localhost:3000/health

# Should return: {"status":"ok",...}
```

### Test Frontend

```bash
# Open browser
http://localhost:3005

# Open browser console (F12)
# Check network tab - should see requests to:
# - http://localhost:3004/... (Admin API)
# - http://localhost:3000/... (Gateway)
```

### Debug Connection Issues

```bash
# Check if services are running
docker compose ps

# Check service logs
docker compose logs gateway-service

# Check port exposure
docker port ratelimiter-gateway-prod
# Should show: 3000/tcp -> 0.0.0.0:3000

# Test from inside container
docker exec -it ratelimiter-frontend-prod sh
wget -O- http://admin-service:3004/health
```

---

## 📝 Summary

| Deployment Type               | NEXT_PUBLIC_API_URL       | NEXT_PUBLIC_GATEWAY_URL      |
| ----------------------------- | ------------------------- | ---------------------------- |
| **Local Machine**             | `http://localhost:3004`   | `http://localhost:3000`      |
| **Remote (IP)**               | `http://SERVER_IP:3004`   | `http://SERVER_IP:3000`      |
| **Remote (Domain, No Nginx)** | `https://domain.com:3004` | `https://domain.com:3000`    |
| **Production (Nginx)**        | `https://api.domain.com`  | `https://gateway.domain.com` |

**Remember:** The browser needs to reach these URLs, so they must be accessible from where your browser runs!

---

## 🔗 Related Documentation

- [Local Production Setup Guide](./LOCAL-PRODUCTION-SETUP.md)
- [Docker Setup Complete](./DOCKER-SETUP-COMPLETE.md)
- [Main README](../README.md)
