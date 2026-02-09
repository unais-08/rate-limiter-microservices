# API Rate Limiter - Frontend Dashboard

A modern, clean, interview-ready frontend for the API Rate Limiter microservices project.

## 🎯 Project Overview

This is a **Next.js** dashboard built to manage and monitor a microservices-based API rate limiting system. The frontend provides a comprehensive interface for:

- **API Key Management** - Create, view, enable/disable, and delete API keys
- **Usage Analytics** - Visualize request patterns with interactive charts
- **System Monitoring** - Track service health and performance metrics
- **API Simulator** - Test rate limits in real-time

## 🏗️ Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios (as per requirements)
- **Charts:** Recharts
- **UI Components:** Custom components in `/components/ui`

### Backend Integration

The frontend communicates with 5 microservices:

1. **Admin Service** (Port 3004) - Authentication, API key CRUD
2. **API Gateway** (Port 3000) - Rate-limited request proxy
3. **Rate Limiter Service** (Port 3002) - Token bucket algorithm
4. **Usage Analytics Service** (Port 3003) - Request logs, metrics
5. **Backend Service** (Port 3001) - Protected resources

## 📁 Folder Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── api-keys/                # API Key Management
│   │   └── page.tsx            # List, create, enable/disable keys
│   ├── api-usage/               # Usage Analytics Dashboard
│   │   └── page.tsx            # Charts, filters, time-series data
│   ├── monitoring/              # System Monitoring
│   │   └── page.tsx            # Service health, top rate-limited keys
│   ├── simulator/               # API Testing Tool
│   │   └── page.tsx            # Send requests, test rate limits
│   ├── overview/                # Main Dashboard
│   │   └── page.tsx            # Overview metrics, quick actions
│   ├── dashboard/               # Alias for overview
│   ├── login/                   # Authentication
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── DashboardLayout.tsx      # Main layout with sidebar
│   └── ui/                      # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── table.tsx
│       └── select.tsx
├── lib/
│   ├── api.ts                   # Axios service layer
│   ├── types.ts                 # TypeScript types (based on Prisma schemas)
│   ├── toast.tsx                # Toast notifications
│   └── utils.ts                 # Utility functions
└── .env.local                   # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend microservices running

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:3000

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3004
NEXT_PUBLIC_GATEWAY_API_URL=http://localhost:3000
NEXT_PUBLIC_ANALYTICS_API_URL=http://localhost:3003
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001
NEXT_PUBLIC_RATELIMIT_API_URL=http://localhost:3002
```

## 📊 Features Breakdown

### 1. API Key Management (`/api-keys`)

**What it does:**

- Displays all API keys with their rate limit configurations
- Allows creating new API keys (with auto-generated values)
- Shows read-only rate limits (per minute, per day, burst capacity)
- Enable/disable and delete keys

**Interview talking points:**

- "Rate limits are system-defined based on backend configuration"
- "Uses Token Bucket algorithm: `tokensPerWindow`, `refillRate`, `maxBurst`"
- "Real-time copy-to-clipboard for API keys"
- "Clear visual feedback with badges for active/inactive status"

### 2. Usage Analytics Dashboard (`/api-usage`)

**What it does:**

- Line chart: Requests over time
- Bar chart: Success vs rate-limited breakdown
- Pie chart: Request distribution
- Filters: Time range (1h, 24h, 7d, 30d) and API key
- Auto-refresh every 30 seconds

**Interview talking points:**

- "Time-series data from Analytics Service"
- "Dynamic interval adjustment based on time range"
- "Clean, professional charts using Recharts"
- "Shows success rate and average response time metrics"

### 3. System Monitoring (`/monitoring`)

**What it does:**

- Service health indicators (5 microservices)
- Top rate-limited API keys (with percentages)
- Endpoint performance metrics
- System-wide statistics

**Interview talking points:**

- "Real-time service health checks"
- "Identifies problematic API keys quickly"
- "Bar chart for endpoint request volume"
- "Auto-refresh every 15 seconds for live monitoring"

### 4. API Simulator (`/simulator`)

**What it does:**

- Send configurable number of requests to API Gateway
- Adjust delay between requests
- See real-time success/failure results
- Visual feedback for rate-limited requests (HTTP 429)

**Interview talking points:**

- "Demonstrates rate limiting in action"
- "Progress bar shows simulation status"
- "Color-coded results: green (success), red (rate-limited)"
- "Educational tool to understand token bucket behavior"

### 5. Overview Dashboard (`/overview`, `/dashboard`)

**What it does:**

- Key metrics at a glance
- Quick action buttons to all features
- Request trend charts (last 12 hours)
- Recent activity feed
- Getting started guide

**Interview talking points:**

- "Main landing page after login"
- "Comprehensive system overview"
- "Quick navigation to key features"

## 🔑 Key Design Decisions

### Why Axios over fetch?

- **Requirement specified:** "Axios only for API calls"
- Cleaner API with interceptors for auth tokens
- Better error handling
- Centralized configuration in `lib/api.ts`

### Why Read-Only Rate Limits?

- **Backend enforces limits:** User cannot customize from UI
- Follows the requirement: "Backend enforces hardcoded rate limits"
- Clear labeling: "Rate limits are system-defined"
- Future-proof: Can be made editable by backend change

### Service Layer Architecture

```typescript
// lib/api.ts structure:
- api: Admin Service (authenticated)
- gatewayApi: API Gateway (rate-limited requests)
- analyticsApi: Analytics Service

// Interceptors:
- Auto-add auth token from localStorage
- Auto-redirect on 401 (unauthorized)
```

### Type Safety

- `lib/types.ts` mirrors backend Prisma schemas
- All API responses are typed
- Reduces runtime errors

## 📈 Data Flow

```
User Action → Component
            ↓
    Axios Call (lib/api.ts)
            ↓
    Backend Microservice
            ↓
    Response Data
            ↓
    Update State → Re-render
```

## 🎨 UI/UX Principles

1. **Clean & Professional** - No unnecessary animations or colors
2. **Interview-Friendly** - Easy to explain each section verbally
3. **Responsive** - Works on desktop and tablet
4. **Consistent** - Reusable components from `/components/ui`
5. **Informative** - Clear labels, tooltips, and error messages

## 🧪 Testing the System

1. **Start all backend services:**

   ```bash
   cd rate-limit-microservices
   npm run start:all
   ```

2. **Start frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Login** with credentials (check backend docs)

4. **Create an API key** in `/api-keys`

5. **Test rate limits** in `/simulator`:
   - Set 50 requests with 50ms delay
   - Watch for rate-limited responses (red)

6. **View analytics** in `/api-usage`:
   - See request patterns
   - Filter by API key and time range

## 📝 Interview Preparation

### Sample Walkthrough Script

**"Let me walk you through this API Rate Limiter dashboard..."**

1. **Overview Page:**
   - "This is the main dashboard showing total requests, success rate, and active API keys"
   - "The charts display request trends over the last 12 hours"

2. **API Keys Page:**
   - "Here I can create and manage API keys"
   - "Rate limits are read-only and system-defined based on the tier"
   - "Each key shows requests per minute, per day, and burst capacity"

3. **Usage Analytics:**
   - "This page visualizes API usage patterns"
   - "The line chart shows requests over time with success vs rate-limited"
   - "I can filter by specific API keys and time ranges"

4. **Simulator:**
   - "This tool demonstrates rate limiting in real-time"
   - "I send multiple requests and see which ones get rate-limited"
   - "It's educational to understand how the token bucket algorithm works"

5. **Monitoring:**
   - "This shows system health across all microservices"
   - "I can identify which API keys are hitting rate limits most often"
   - "Endpoint analytics show which routes are most popular"

### Technical Questions You Might Get

**Q: How do you handle authentication?**
A: "I store the JWT token in localStorage after login. An Axios interceptor automatically adds it to all admin API requests. If I get a 401, the interceptor redirects to login."

**Q: Why separate service instances for analytics vs admin?**
A: "Microservices architecture - each service has a specific responsibility. Analytics handles high-volume logging, while Admin handles authentication and key management. They can scale independently."

**Q: How do you ensure type safety with API responses?**
A: "I created TypeScript interfaces in `lib/types.ts` that mirror the backend Prisma schemas. All API functions are typed, so TypeScript catches errors at compile time."

**Q: Why Recharts instead of Chart.js?**
A: "Recharts is React-native with better TypeScript support and declarative API. It's easier to maintain and more idiomatic in a React application."

## 🔧 Common Issues & Solutions

### Issue: "Failed to fetch API keys"

- **Cause:** Backend service not running
- **Fix:** Start admin service on port 3004

### Issue: CORS errors

- **Cause:** Backend not allowing frontend origin
- **Fix:** Ensure backend has CORS middleware configured

### Issue: Charts not showing

- **Cause:** No data in analytics database
- **Fix:** Send some requests through API Gateway first

## 🚀 Production Considerations

For production deployment:

1. **Environment Variables:** Use proper secrets management
2. **Authentication:** Implement refresh tokens
3. **Error Boundaries:** Add React error boundaries
4. **Loading States:** More sophisticated loading UIs
5. **Pagination:** Add pagination for large datasets
6. **Caching:** Implement React Query for data caching
7. **Rate Limiting UI:** Add countdown timers for rate limit resets

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Recharts Documentation](https://recharts.org/)
- [Axios Documentation](https://axios-http.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## ✅ Checklist for Interview

- [ ] All pages load without errors
- [ ] Can create and delete API keys
- [ ] Charts display data correctly
- [ ] Simulator shows rate-limited requests
- [ ] Responsive on different screen sizes
- [ ] Code is clean and well-commented
- [ ] Can explain the architecture clearly
- [ ] Understand the token bucket algorithm
- [ ] Know why design decisions were made

---

**Built with ❤️ for learning and interviews**
