# 🚀 Frontend Setup & API Integration Guide

## Part 1: Running the Frontend

### Step 1: Prerequisites Check
```bash
# Check Node.js version (should be 16+)
node --version

# Check npm version (should be 8+)
npm --version
```

### Step 2: Install Dependencies
Navigate to the frontend folder and install all packages:
```bash
cd /Users/abdullah/Dept\ Hackathon/frontend
npm install
```

This will install:
- React 18.2.0
- Vite 7.3.1 (build tool)
- React Router v6 (navigation)
- Axios (HTTP client)
- Recharts (charts)
- Lucide Icons (UI icons)
- PDF libraries (jspdf, html2pdf, html2canvas)
- Date utilities (date-fns)
- CSV parser (papaparse)

### Step 3: Start Development Server
```bash
npm run dev
```

**Output**: Server will start on `http://localhost:3001`

```
✓ Local:   http://localhost:3001/
✓ Press 'q' to quit, 'r' to restart
```

### Step 4: Access the Application
Open browser and go to:
- **Entry Point**: `http://localhost:3001/login`
- **Organization Dashboard**: `http://localhost:3001/org/dashboard`
- **Individual Assessment**: `http://localhost:3001/assessment`

---

## Part 2: Current Frontend Architecture

### Frontend Structure
```
src/
├── App.jsx                          # Main routing container
├── main.jsx                         # React entry point
│
├── login/                           # Unified login page
│   └── EntryLoginPage/              # Login component
│
├── individual_assessment_ui/        # Individual patient flow
│   ├── EntryLoginPage/
│   ├── IndividualAssessmentPage/    # Self-assessment form
│   └── AssessmentReportPage.jsx     # Risk report output
│
├── organization_ui/                 # Organization/clinic flow
│   ├── pages/                       # 13 main pages
│   │   ├── DashboardPage/           # Overview
│   │   ├── AllMembersPage/          # Patient list
│   │   ├── HighRiskMembersPage/     # High-risk patients
│   │   ├── MemberDetailPage/        # Individual patient detail
│   │   ├── UploadPage/              # CSV import
│   │   ├── ROIPage/                 # Financial analysis
│   │   ├── ReportsPage/             # Analytics & reports
│   │   ├── DepartmentsPage/         # Department view
│   │   └── ...
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── layout/                  # Headers, sidebars, nav
│   │   ├── dashboard/               # Dashboard widgets
│   │   ├── members/                 # Patient-related components
│   │   ├── roi/                     # ROI display components
│   │   └── ...
│   │
│   ├── context/                     # State management
│   │   ├── AuthContext.jsx          # Authentication state
│   │   ├── MemberContext.jsx        # Patient data
│   │   ├── CarePlanContext.jsx      # Care planning
│   │   ├── PredictionWindowContext/ # Time window selection
│   │   └── ...
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.js               # Auth logic
│   │   ├── useMembers.js            # Patient data management
│   │   ├── useFileUpload.js         # File upload logic
│   │   └── ...
│   │
│   ├── services/                    # API calls & utilities
│   │   ├── api/
│   │   │   ├── apiClient.js         # Axios config
│   │   │   ├── authApi.js           # Auth endpoints
│   │   │   ├── membersApi.js        # Patient endpoints
│   │   │   ├── riskApi.js           # Risk prediction endpoints
│   │   │   ├── interventionApi.js   # Intervention endpoints
│   │   │   └── uploadApi.js         # File upload endpoints
│   │   ├── mockData.js              # Mock patient data
│   │   ├── csv/                     # CSV utilities
│   │   └── ml/                      # ML integration
│   │
│   └── utils/                       # Helper functions
│       ├── auth.js
│       ├── constants.js
│       ├── formatters.js            # Number/date formatting
│       ├── riskCalculations.js      # Risk tier logic
│       └── validators.js
│
└── common/                          # Shared across both UIs
    ├── components/                  # Shared UI components
    ├── services/
    │   └── assessmentApi.js         # Assessment endpoints
    ├── hooks/
    │   └── useAssessmentState.js    # Assessment state
    └── Button/, Card/, Input/       # Common components
```

---

## Part 3: API Endpoints the Frontend Expects

### Current API Configuration
- **Base URL**: `http://localhost:3001/api` (configurable via env)
- **Default Port**: 3001
- **Auth**: Bearer token in header (`Authorization: Bearer <token>`)
- **Token Storage**: localStorage key `healthguard_token`

### API Endpoints Needed (By Module)

#### 1. AUTHENTICATION APIs
```
POST   /api/auth/login
       Input: { email, password, userType: 'organization' | 'individual' }
       Output: { token, user: { id, name, email, role } }

POST   /api/auth/logout
       Input: {}
       Output: { success: true }

GET    /api/auth/validate
       Input: (Bearer token required)
       Output: { valid: true, user: {...} }

POST   /api/auth/refresh
       Input: {}
       Output: { token }
```

#### 2. MEMBERS/PATIENTS APIs (Organization Side)
```
GET    /api/members
       Query: ?page=1&limit=20&search=text&riskTier=1-5&department=CARDIOLOGY
       Output: { data: [...], total, page, pages }

GET    /api/members/:memberId
       Output: { 
         id, name, age, gender, department, 
         predictions: { 30day, 60day, 90day },
         financialProjections: {...}
       }

POST   /api/members
       Input: { name, age, gender, email, ... }
       Output: { id, ... }

PUT    /api/members/:memberId
       Input: { updated fields }
       Output: { success: true }

GET    /api/members/search
       Query: ?query=text
       Output: [{ id, name, ... }]
```

#### 3. RISK PREDICTION APIs
```
POST   /api/predictions/calculate
       Input: {
         patientData: {
           age, gender, race,
           conditions: { has_chf: true, ... },
           utilization: { admissions, visits, ... },
           costs: { annual_cost, ... }
         }
       }
       Output: {
         predictions: {
           30day: { riskScore, riskTier, tierLabel },
           60day: { riskScore, riskTier, tierLabel },
           90day: { riskScore, riskTier, tierLabel }
         }
       }

GET    /api/predictions/roi
       Query: ?department=CARDIOLOGY&riskTier=4
       Output: [{ patientId, riskScore, roiPercent, ... }]

GET    /api/predictions/effectiveness
       Output: { modelAccuracy, precision, recall, auc }

GET    /api/predictions/transitions
       Query: ?window=30day
       Output: [{ fromTier, toTier, count }]
```

#### 4. INTERVENTION APIs
```
POST   /api/interventions/care-plan/:memberId
       Input: {
         interventions: ['medication', 'follow-up', ...],
         notes: "Care plan details"
       }
       Output: { id, memberId, ... }

PUT    /api/interventions/:interventionId
       Input: { status, outcome, notes }
       Output: { success: true }

GET    /api/interventions/roi
       Query: ?window=30day&sortBy=roiPercent
       Output: [{ patientId, interventionCost, expectedSavings, roiPercent }]

GET    /api/interventions/effectiveness
       Output: { avgROI, positiveROICount, totalInterventions }

GET    /api/interventions/transitions
       Query: ?window=30day
       Output: [{ fromTier, toTier, interventionType, count }]
```

#### 5. UPLOAD APIs
```
POST   /api/upload/csv
       Input: multipart/form-data { file: CSV }
       Output: { 
         success: true, 
         uploaded: 150,
         errors: [...],
         results: [{ memberId, status }]
       }
```

#### 6. INDIVIDUAL ASSESSMENT APIs
```
POST   /api/assessment/predict
       Input: {
         age, gender, race,
         conditions: [...],
         utilization: {...},
         costs: {...}
       }
       Output: {
         predictions: { 30day, 60day, 90day },
         report: { ... },
         recommendations: [...]
       }

POST   /api/assessment/save-report
       Input: { assessmentData, predictions, pdfData }
       Output: { reportId, url }

GET    /api/assessment/report/:reportId
       Output: { ... full report data ... }
```

---

## Part 4: Environment Variables Setup

Create a `.env` file in the frontend folder (or set via system):

```bash
# .env or set in terminal before running
VITE_API_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

**Note**: The apiClient uses `process.env.REACT_APP_API_URL` which maps to `VITE_API_URL` in Vite.

---

## Part 5: Build for Production

```bash
# Build the optimized production bundle
npm run build

# Output will be in dist/
# Files ready to deploy to any static hosting

# Preview production build locally
npm run preview
# Runs on http://localhost:4173
```

---

## Part 6: Debugging & Development Tips

### 1. Check Network Requests
```
Open DevTools → Network tab → Filter by XHR/Fetch
See all API requests and responses
```

### 2. Check Console
```
Open DevTools → Console tab
See any API errors, validation issues, or warnings
```

### 3. Redux DevTools (if added later)
```
npm install redux-devtools-extension
Install browser extension for Redux DevTools
```

### 4. Common Issues

**Issue**: `localhost:3001 refused connection`
- **Solution**: Make sure `npm run dev` is running in frontend folder

**Issue**: API returns 404
- **Solution**: Backend server not running or wrong baseURL in apiClient.js

**Issue**: CORS errors
- **Solution**: Backend needs to set CORS headers for localhost:3001

**Issue**: Token missing from requests
- **Solution**: Login first, token stored in localStorage as `healthguard_token`

---

## Summary

### To Run Frontend:
```bash
cd /Users/abdullah/Dept\ Hackathon/frontend
npm install              # One time only
npm run dev              # Starts on localhost:3001
```

### What You'll See:
1. **Login Page** (`/login`) - Entry point
2. **Organization Path** (`/org/dashboard`) - Full dashboard for clinics
3. **Individual Path** (`/assessment`) - Self-assessment for patients

### Next Steps:
1. Run frontend and explore all pages
2. Document which pages call which APIs
3. Create Node.js/Express backend with these endpoints
4. Connect to PostgreSQL database
5. Integrate ML model predictions

