# 🎯 Quick Start - Production on Local Machine

Follow these **5 simple steps** to run production mode on your local machine:

---

## Step 1: Open `.env.production` file

```bash
cd /home/unais/Desktop/Ratelimiter
nano .env.production
```

---

## Step 2: Update These 5 Values

```env
# 1. Change database password
POSTGRES_PASSWORD=MyStrongDBPassword123!

# 2. Change Redis password
REDIS_PASSWORD=MyStrongRedisPassword456!

# 3. Generate JWT secret (run: openssl rand -base64 64)
JWT_SECRET=YourGeneratedSecretHere...

# 4. Set frontend API URL (for local machine use localhost)
NEXT_PUBLIC_API_URL=http://localhost:3004

# 5. Set frontend Gateway URL (for local machine use localhost)
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
```

**⚠️ Important:** For running on **your local machine**, always use `localhost`!

---

## Step 3: Build & Start Services

```bash
# Option A: Using script (recommended)
./scripts/deploy-prod.sh

# Option B: Manual
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## Step 4: Verify Services are Running

```bash
# Check status
docker compose -f docker-compose.prod.yml ps

# All services should show "Up" status
```

---

## Step 5: Access Your Application

Open your browser:

- **Frontend Dashboard:** http://localhost:3005
- **API Gateway:** http://localhost:3000
- **Admin API:** http://localhost:3004

---

## 🎉 Done! Your production system is running!

### View Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart
```

---

## 🆘 Troubleshooting

### Services won't start?

```bash
# Check Docker is running
docker --version

# View errors
docker compose -f docker-compose.prod.yml logs
```

### Can't access localhost:3005?

```bash
# Check if port is in use
sudo lsof -i :3005

# Check if service is running
docker compose -f docker-compose.prod.yml ps frontend
```

### Frontend can't connect to backend?

Double-check your `.env.production`:

```env
# Make sure these say "localhost" not "admin-service"
NEXT_PUBLIC_API_URL=http://localhost:3004  ✅
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000  ✅
```

---

## 📚 Need More Help?

- [Full Local Production Guide](./LOCAL-PRODUCTION-SETUP.md)
- [Environment Variables Guide](./ENV-VARIABLES-GUIDE.md)
- [Main README](../README.md)

---

## 🔑 Key Points to Remember

1. ✅ Use `localhost` for local machine deployment
2. ✅ Change all passwords (don't use defaults)
3. ✅ Generate a secure JWT secret
4. ✅ All services run in Docker containers
5. ✅ Access via http://localhost:PORT

**That's it! Your production environment is ready! 🚀**
