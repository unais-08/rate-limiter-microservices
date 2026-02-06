# Rate Limiter Dashboard - Frontend

Modern Next.js dashboard for the Smart API Rate Limiter platform. Built with TypeScript, Tailwind CSS, and Recharts for real-time monitoring and management of API rate limits.

## 🎯 Features

- **Real-time Dashboard** - Live metrics with 5-second polling
  - Total requests & blocked requests
  - Active API keys count
  - Request traffic charts (Line & Bar)
  - Recent rate limit violations table

- **API Key Management**
  - Create, delete, and manage API keys
  - Set custom rate limits per key
  - Toggle key status (active/inactive)
  - Copy keys to clipboard
  - View usage statistics

- **System Monitoring**
  - Health status for all 5 microservices
  - Redis and PostgreSQL health checks
  - Response time metrics
  - System uptime tracking

- **Authentication**
  - JWT-based login system
  - Protected routes with auto-redirect
  - Persistent sessions with localStorage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend services running (ports 3000-3004)
- Admin service accessible at `http://localhost:3004`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server
./start-frontend.sh

# Or manually:
npx next dev -p 3005
```

The dashboard will be available at:

- **Login**: http://localhost:3005/login
- **Dashboard**: http://localhost:3005/dashboard
- **API Keys**: http://localhost:3005/api-keys
- **Monitoring**: http://localhost:3005/monitoring

### Default Credentials

```
Username: admin
Password: admin123
```

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home page (auth redirect)
│   ├── login/page.tsx       # Login page
│   ├── dashboard/page.tsx   # Main dashboard with charts
│   ├── api-keys/page.tsx    # API key management
│   └── monitoring/page.tsx  # Service health monitoring
│
├── components/
│   ├── DashboardLayout.tsx  # Sidebar navigation layout
│   └── ui/                  # Reusable UI components
│       ├── card.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       └── table.tsx
│
├── lib/
│   ├── api.ts              # Axios API client
│   └── utils.ts            # Utility functions
│
└── start-frontend.sh       # Quick start script
```

## 🎨 Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 3.7
- **Icons**: Lucide React
- **HTTP Client**: Axios 1.13

## 📊 Dashboard Pages

### 1. Dashboard (`/dashboard`)

- Metric cards: Total/Blocked requests, Active keys, Response time
- Line chart: Request traffic over time
- Bar chart: Rate limit violations
- Recent violations table
- **Real-time**: Updates every 5 seconds

### 2. API Keys (`/api-keys`)

- Create keys with custom rate limits
- Copy keys to clipboard
- Toggle active/inactive status
- Delete keys
- View usage statistics

### 3. Monitoring (`/monitoring`)

- All microservices health status
- Redis and PostgreSQL monitoring
- Response time metrics
- System uptime tracking

### 4. Login (`/login`)

- JWT authentication
- Demo credentials displayed
- Auto-redirect on success

## 🔌 API Integration

Backend Admin Service: `http://localhost:3004`

```typescript
// lib/api.ts
api.login(username, password);
api.getApiKeys();
api.createApiKey({ name, rateLimit });
api.updateApiKey(id, data);
api.deleteApiKey(id);
api.getAnalytics({ timeRange });
api.getServiceHealth();
```

## 🎬 Demo Flow

1. **Login** → Enter admin/admin123
2. **Dashboard** → View real-time metrics and charts
3. **API Keys** → Create/manage keys
4. **Monitoring** → Check service health
5. **Logout** → Clear session

## 🚀 Production Build

```bash
npm run build
PORT=3005 npm start
```

## 🐛 Troubleshooting

**Frontend won't start**:

```bash
rm -rf .next node_modules
npm install
npx next dev -p 3005
```

**API calls failing**:

- Ensure backend services are running
- Check Admin Service on port 3004
- Verify CORS is enabled

**Authentication issues**:

- Clear localStorage: `localStorage.clear()`
- Check JWT token in Admin Service

## 📝 Resume Points

**What You Built**:

- "Full-stack microservices platform with modern Next.js dashboard"
- "Real-time monitoring with 5-second polling updates"
- "TypeScript throughout for type safety"
- "Component-based architecture with reusable UI library"

**Technical Stack**:

- Next.js 16 (App Router)
- TypeScript 5
- Tailwind CSS 4
- Recharts for data visualization
- Axios for API communication

**Key Features**:

- 3 dashboard pages + authentication
- 12+ reusable UI components
- Real-time updates every 5 seconds
- Dark mode support
- JWT authentication with protected routes

---

**Backend Services**: Ports 3000-3004  
**Frontend Port**: 3005  
**Status**: ✅ Production Ready
