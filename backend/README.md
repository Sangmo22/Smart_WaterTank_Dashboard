# Smart Water Tank System Backend API

Production-ready, highly secure, and modular REST API built with Node.js, Express, MongoDB, and JSON Web Tokens (JWT). Designed for smart water tank integrations with an Expo React Native frontend.

---

## Technical Features

- **Auth System**: Secured JWT bearer-token authentication. Passwords hashed using `bcryptjs`.
- **Validation**: Strict input validation using `Zod` schemas for body parameters, query limits, and ObjectIds.
- **Security**: 
  - `helmet` HTTP headers protection.
  - `CORS` origins filtering configured dynamically.
  - Rate limiting on `/auth/*` endpoints (30 requests/15 minutes).
  - Centralized global error handling with clean, custom `{ error: { code, message, details? } }` schemas.
- **Database Routing**: Relational model references inside MongoDB using `Mongoose` schema.
- **Heuristic Forecast**: Algorithmic water consumption predictor stub based on temperature trends, humidity levels, rain probability, and level slop gradients.

---

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js            # MongoDB database connector
│   ├── models/
│   │   ├── User.js          # User schema (email, name, passwordHash)
│   │   ├── Tank.js          # Tank config & current pump status
│   │   ├── TankReading.js   # Sensor telemetry log records
│   │   └── PumpLog.js       # Historical pump mode & switch logs
│   ├── middleware/
│   │   ├── auth.js          # JWT checker
│   │   ├── validate.js      # Zod validation middleware
│   │   ├── rateLimiter.js   # API request rate limiter
│   │   └── errorHandler.js  # Uniform exception formatter
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── tankController.js
│   │   ├── readingController.js
│   │   ├── pumpController.js
│   │   └── predictController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tankRoutes.js
│   │   ├── readingRoutes.js
│   │   ├── pumpRoutes.js
│   │   └── predictRoutes.js
│   ├── utils/
│   │   └── errorResponse.js # Status code error handler helper
│   └── app.js               # Express application router assembly
├── .env.example
├── .env
├── README.md
├── package.json
└── server.js                # Server startup entry point
```

---

## Installation & Setup

### 1. Install Dependencies
Navigate to the `backend` directory and run npm install:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill out your credentials:
```bash
cp .env.example .env
```
Ensure your MongoDB instance is running locally or supply a MongoDB Atlas connection string.

---

## Scripts

- **Production Run**: `npm start`
- **Development Mode** (auto-restart with Nodemon): `npm run dev`

---

## Example API Endpoint Calls (cURL)

Below are commands to test key REST paths. Replace `<token>` with the JWT returned on successful register/login.

### 1. Authentication

#### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com", "password":"password123", "name":"Jane Doe"}'
```

#### Log In
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com", "password":"password123"}'
```

### 2. Tank Management

#### Create a Tank
```bash
curl -X POST http://localhost:5000/api/tanks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Overhead Tank", "capacityLiters":5000, "location":"Terrace Area"}'
```

#### List My Tanks
```bash
curl -X GET http://localhost:5000/api/tanks \
  -H "Authorization: Bearer <token>"
```

### 3. Sensor Telemetry

#### Add a Reading
```bash
curl -X POST http://localhost:5000/api/tanks/<tank_id>/readings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"overheadPercent":82.5, "sourcePercent":94.0, "pumpState":1}'
```

#### View Paginated Readings (Filtered by Dates)
```bash
curl -X GET "http://localhost:5000/api/tanks/<tank_id>/readings?page=1&limit=10&from=2026-07-01T00:00:00.000Z" \
  -H "Authorization: Bearer <token>"
```

### 4. Pump Control

#### View Pump Configuration
```bash
curl -X GET http://localhost:5000/api/tanks/<tank_id>/pump \
  -H "Authorization: Bearer <token>"
```

#### Switch Pump State
```bash
curl -X POST http://localhost:5000/api/tanks/<tank_id>/pump \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"state":"auto"}'
```

### 5. AI Water Usage Forecasting

#### Query Usage Predictor
```bash
curl -X POST http://localhost:5000/api/predict/usage \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tankId": "<tank_id>",
    "recentReadings": [
      {"overheadPercent": 80, "sourcePercent": 90, "pumpState": 1, "timestamp": "2026-07-07T13:00:00.000Z"},
      {"overheadPercent": 75, "sourcePercent": 90, "pumpState": 1, "timestamp": "2026-07-07T14:00:00.000Z"}
    ],
    "weatherForecast": {
      "temp": 32,
      "humidity": 60,
      "rainProbability": 0.2
    }
  }'
```
