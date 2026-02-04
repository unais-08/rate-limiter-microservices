# Backend Service

A protected microservice that serves as a dummy backend for testing the Rate Limiter platform. This service represents any internal backend API that needs protection from excessive requests.

## Overview

This is a simple Express-based microservice with typical CRUD operations. It's designed to be accessed through the API Gateway, which enforces rate limiting before forwarding requests here.

## Architecture

```
backend-service/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup and lifecycle
│   ├── config/
│   │   └── index.js           # Environment configuration
│   ├── controllers/
│   │   └── backendController.js   # Request handlers
│   ├── routes/
│   │   ├── index.js           # Main router
│   │   └── backendRoutes.js   # API endpoints
│   ├── services/
│   │   └── backendService.js  # Business logic
│   ├── utils/
│   │   ├── logger.js          # Structured logging
│   │   └── errorHandler.js    # Error handling utilities
│   └── middleware/            # Custom middleware (future)
├── package.json
├── .env.example
└── README.md
```

## Features

- **ES6 Modules**: Uses `import/export` syntax
- **Production-Ready Error Handling**: Centralized error handling with AppError class
- **Structured Logging**: JSON-formatted logs for production monitoring
- **Health Checks**: `/health` endpoint for monitoring
- **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT
- **Security**: Helmet, CORS enabled
- **Request Validation**: Input validation in controllers

## API Endpoints

### Health Check

```
GET /health
```

### API Info

```
GET /api
```

### User Operations

```
GET /api/v1/users/:userId
```

Get user data by ID.

### Data Processing

```
POST /api/v1/process
Body: { "data": "any_data" }
```

Process arbitrary data payload.

### Resource Management

```
GET    /api/v1/resources?limit=10&offset=0
POST   /api/v1/resources
PUT    /api/v1/resources/:resourceId
DELETE /api/v1/resources/:resourceId
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the service
npm start

# Development mode with auto-reload
npm run dev
```

## Environment Variables

| Variable    | Description   | Default       |
| ----------- | ------------- | ------------- |
| `PORT`      | Server port   | `3001`        |
| `NODE_ENV`  | Environment   | `development` |
| `LOG_LEVEL` | Logging level | `info`        |

## Usage Example

```bash
# Health check
curl http://localhost:3001/health

# Get user data
curl http://localhost:3001/api/v1/users/123

# List resources
curl "http://localhost:3001/api/v1/resources?limit=5&offset=0"

# Create resource
curl -X POST http://localhost:3001/api/v1/resources \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Resource", "description": "A test"}'

# Process data
curl -X POST http://localhost:3001/api/v1/process \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
```

## Design Decisions

### Why Dummy Data?

This service simulates database operations with latency to represent a real backend. It helps test the rate limiter under realistic conditions without requiring actual database setup.

### Why Simple Business Logic?

The focus is on demonstrating:

- Clean microservice structure
- Proper separation of concerns (controllers → services)
- Production-grade error handling
- RESTful API design

### Why No Database?

For the MVP, this service is stateless and returns mock data. This keeps setup simple and focuses on the rate limiting mechanism rather than database management.

## Future Enhancements

- Connect to actual PostgreSQL for persistent data
- Add authentication middleware
- Implement request tracing (correlation IDs)
- Add metrics collection (Prometheus)
- WebSocket support for real-time features

## Integration with API Gateway

This service will be called by the API Gateway **after** rate limit checks pass:

```
Client → API Gateway → Rate Limiter Check → Backend Service
```

The gateway will forward the original request with additional headers for tracking.

## License

MIT
