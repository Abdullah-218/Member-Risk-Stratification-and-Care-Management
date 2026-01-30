# 🏥 Healthcare Risk Backend - Node.js/Express

Complete backend server for Healthcare Risk Prediction Platform using Express.js and PostgreSQL.

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js                      # Main Express app
│   ├── config/
│   │   ├── database.js                # PostgreSQL connection pool
│   │   └── index.js                   # Configuration management
│   ├── routes/
│   │   ├── auth.routes.js             # Authentication endpoints
│   │   ├── members.routes.js          # Patient management
│   │   ├── predictions.routes.js      # Risk predictions
│   │   ├── interventions.routes.js    # Care planning
│   │   ├── upload.routes.js           # CSV file uploads
│   │   └── assessment.routes.js       # Individual assessments
│   ├── middleware/
│   │   ├── auth.js                    # JWT validation
│   │   └── errorHandler.js            # Error handling
│   ├── models/
│   │   └── db.js                      # Database queries
│   └── utils/                         # Helper functions
├── package.json                        # Dependencies
├── .env.example                        # Environment template
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- PostgreSQL 12+ (running in Docker on port 5433)
- Frontend running on localhost:3002

### Installation

1. **Navigate to backend folder**
```bash
cd /Users/abdullah/Dept\ Hackathon/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

**Expected Output:**
```
========================================
🏥 Healthcare Risk Backend Server
========================================
✓ Server running on port 3000
✓ API Base URL: http://localhost:3000/api
✓ Frontend URL: http://localhost:3002
✓ Environment: development
========================================
```

### Verify Connection

Test API health:
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "Backend service is running",
  "timestamp": "2026-01-29T..."
}
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login          # Login user
POST   /api/auth/logout         # Logout user
GET    /api/auth/validate       # Validate token
POST   /api/auth/refresh        # Refresh token
```

### Members/Patients
```
GET    /api/members                    # List all members
GET    /api/members/:memberId          # Get member details
POST   /api/members                    # Create new member
PUT    /api/members/:memberId          # Update member
GET    /api/members/search?query=text  # Search members
```

### Risk Predictions
```
POST   /api/predictions/calculate           # Calculate predictions
GET    /api/predictions/roi                 # Get ROI predictions
GET    /api/predictions/effectiveness       # Get model metrics
GET    /api/predictions/transitions         # Get tier transitions
```

### Interventions
```
POST   /api/interventions/care-plan/:memberId   # Create care plan
PUT    /api/interventions/:interventionId       # Update intervention
GET    /api/interventions/roi                   # Get intervention ROI
GET    /api/interventions/effectiveness         # Get effectiveness
GET    /api/interventions/transitions           # Get transitions
```

### File Upload
```
POST   /api/upload/csv   # Upload patient CSV file
```

### Assessment
```
POST   /api/assessment/predict              # Predict risk
POST   /api/assessment/save-report          # Save report
GET    /api/assessment/report/:reportId     # Get report
```

---

## 🔐 Authentication

All API endpoints (except `/health` and `/api/assessment/predict`) require JWT token.

### How to Get Token

1. Call `/api/auth/login` with credentials
2. Store returned `token` in localStorage
3. Include in requests: `Authorization: Bearer <token>`

### Example Request

```bash
curl -X GET http://localhost:3000/api/members \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 📊 Database Connection

### Configuration
- **Host**: localhost
- **Port**: 5433 (Docker)
- **Database**: healthcare_risk
- **User**: postgres
- **Password**: postgres

### Connection Test
```bash
# Server will log on startup:
✓ Database connected successfully
  Connected to: localhost:5433/healthcare_risk
```

### Database Queries
All database operations use the `src/models/db.js` module:

```javascript
import { Patient, Prediction, Department } from './models/db.js';

// Get all patients
const patients = await Patient.getAll(20, 0, { department: 'CARDIOLOGY' });

// Get patient with predictions
const patient = await Patient.getById(123);

// Save prediction
const prediction = await Prediction.save({ patient_id: 123, ... });
```

---

## 🛠️ Development Commands

```bash
# Start development server (with nodemon auto-reload)
npm run dev

# Start production server
npm start

# Run tests (when configured)
npm test

# Initialize database (create tables, indexes, etc.)
npm run db:init
```

---

## 🔄 Integration with Frontend

Backend is configured to accept requests from:
- **Frontend URL**: http://localhost:3002
- **CORS**: Enabled for frontend origin
- **Token Storage**: localStorage key `healthguard_token`

### Frontend API Client Config
```javascript
// src/organization_ui/services/api/apiClient.js
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
});
```

---

## 🤖 ML Integration

Routes are prepared to integrate with Python ML models:

### Predictions Route
```javascript
// TODO: Call ML service for risk calculations
POST /api/predictions/calculate
  → Calls ML service at ML_SERVICE_URL
  → Returns risk scores and tiers
```

### How to Connect ML Service

1. Update `.env` with ML service URL:
```
ML_SERVICE_URL=http://localhost:5000
```

2. In `src/routes/predictions.routes.js`, replace mock data with:
```javascript
import axios from 'axios';

const response = await axios.post(
  `${config.ML_SERVICE_URL}/predict`,
  patientData
);
```

---

## 📝 TODO / Next Steps

- [ ] Implement actual authentication (hash passwords, generate JWT)
- [ ] Connect to PostgreSQL database with real queries
- [ ] Integrate ML prediction service
- [ ] Add input validation
- [ ] Add request logging
- [ ] Add error handling and logging
- [ ] Add unit tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add rate limiting
- [ ] Add data pagination

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Database connection fails
```bash
# Check Docker is running and PostgreSQL is accessible
psql -h localhost -p 5433 -U postgres -d healthcare_risk
```

### Issue: CORS error from frontend
```bash
# Ensure FRONTEND_URL in .env matches frontend running URL
FRONTEND_URL=http://localhost:3002
```

### Issue: Token not being sent
```bash
# Check localStorage for token
localStorage.getItem('healthguard_token')

# Check Authorization header in DevTools Network tab
```

---

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [Multer File Upload](https://github.com/expressjs/multer)

---

## 💻 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5433 | PostgreSQL port |
| DB_USER | postgres | DB username |
| DB_PASSWORD | postgres | DB password |
| DB_NAME | healthcare_risk | Database name |
| JWT_SECRET | secret-key | JWT signing key |
| JWT_EXPIRE | 7d | Token expiration |
| FRONTEND_URL | http://localhost:3002 | Frontend origin |
| ML_SERVICE_URL | http://localhost:5000 | ML service URL |

---

**Status**: ✅ Backend scaffold complete. Ready for database integration and API implementation.
