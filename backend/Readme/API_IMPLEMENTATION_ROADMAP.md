# 📡 Frontend API Integration Roadmap

## Current State
- ✅ Frontend running on http://localhost:3002
- ✅ Backend running on http://localhost:3000/api
- ✅ All endpoints return mock data
- ✅ Database connected but queries not implemented
- ✅ Authentication middleware prepared but not implemented

---

## 🎯 API Implementation Priority by Feature

### TIER 1: Critical (Implement First)

#### 1. Authentication
**File**: `src/routes/auth.routes.js`

```javascript
POST /api/auth/login
  Input:  { email, password, userType: 'organization' | 'individual' }
  Output: { success: true, token, user: { id, email, role } }
  
  TODO:
  - Query users table by email
  - Hash password comparison (bcryptjs)
  - Generate JWT token
  - Return token + user info
```

**Called By**:
- Login page (both organization and individual)
- Every subsequent request (token in localStorage)

---

#### 2. Members/Patients List
**File**: `src/routes/members.routes.js`

```javascript
GET /api/members?page=1&limit=20&search=&riskTier=&department=CARDIOLOGY
  Query DB:
  - SELECT p.*, d.dept_name FROM patients p
  - LEFT JOIN departments d
  - Filter by risk tier if provided
  - Filter by department if provided
  - Return paginated results
  
  Response: { 
    data: [
      {
        id, name, age, gender, email, department,
        predictions: { 30day, 60day, 90day },
        financialProjections: {...}
      }
    ],
    total, page, pages
  }
```

**Called By**:
- AllMembersPage
- Dashboard (for member summary)
- Department view

---

#### 3. Member Detail
**File**: `src/routes/members.routes.js`

```javascript
GET /api/members/:memberId
  Query DB:
  - Get patient by ID
  - Join with predictions
  - Join with financial_projections
  - Join with department
  - Return full patient profile
  
  Response: {
    id, name, age, gender, email, department,
    phone, address, race,
    predictions: {
      30day: { riskScore, riskTier, tierLabel },
      60day: { riskScore, riskTier, tierLabel },
      90day: { riskScore, riskTier, tierLabel }
    },
    financialProjections: {
      30day: { windowCost, interventionCost, roi_percent },
      60day: {...},
      90day: {...}
    }
  }
```

**Called By**:
- MemberDetailPage
- Dashboard cards (when expanded)

---

### TIER 2: High Priority (Implement Second)

#### 4. Risk Predictions
**File**: `src/routes/predictions.routes.js`

```javascript
POST /api/predictions/calculate
  Input: { patientData: { age, gender, conditions, utilization, costs } }
  
  TODO:
  - Call Python ML model at ML_SERVICE_URL
  - Or use pre-trained model locally
  - Get risk scores: 0.35, 0.45, 0.65 for 30/60/90 days
  - Map scores to tiers (1-5)
  
  Response: {
    predictions: {
      30day: { riskScore: 0.35, riskTier: 2, tierLabel: 'Low-Moderate' },
      60day: { riskScore: 0.45, riskTier: 3, tierLabel: 'Moderate' },
      90day: { riskScore: 0.65, riskTier: 4, tierLabel: 'High' }
    }
  }
```

**Called By**:
- Individual Assessment page
- Member detail page (when recalculating)

---

#### 5. Financial Projections / ROI
**File**: `src/routes/predictions.routes.js`

```javascript
GET /api/predictions/roi?department=CARDIOLOGY&riskTier=4
  Query DB:
  - SELECT * FROM financial_projections
  - WHERE risk_tier = riskTier (if provided)
  - JOIN with patients WHERE dept_code = department (if provided)
  
  Calculate/Return: {
    patientId, name, riskScore, riskTier,
    interventionCost, expectedSavings, netBenefit,
    roiPercent, roiCategory
  }
```

**Called By**:
- ROI Analysis page
- Dashboard ROI cards
- High Risk Members page

---

#### 6. File Upload / CSV Import
**File**: `src/routes/upload.routes.js`

```javascript
POST /api/upload/csv (multipart/form-data)
  Input: { file: <CSV file> }
  
  TODO:
  - Parse CSV rows
  - For each row:
    - Validate patient data
    - INSERT into patients table
    - Calculate predictions
    - INSERT into predictions table
    - Calculate ROI
    - INSERT into financial_projections table
  
  Response: {
    success: true,
    uploaded: 150,
    errors: 5,
    results: [
      { row: 1, patientId: 101, status: 'success' },
      { row: 2, patientId: 102, status: 'success' },
      { row: 3, patientId: null, status: 'error', error: 'Invalid data' }
    ]
  }
```

**Called By**:
- Upload page
- Bulk import flow

---

### TIER 3: Medium Priority (Implement Third)

#### 7. Interventions / Care Plans
**File**: `src/routes/interventions.routes.js`

```javascript
POST /api/interventions/care-plan/:memberId
  Input: { interventions: ['med', 'followup'], notes: '...', window: '30day' }
  
  TODO:
  - INSERT into care_plans table
  - Track intervention type, status
  
GET /api/interventions/roi?window=30day
  - Query care plans with ROI metrics
  - Show which interventions have positive ROI

PUT /api/interventions/:interventionId
  - Update intervention status (pending → active → completed)
  - Track outcomes
```

**Called By**:
- Care plan creation
- Intervention tracking
- ROI analysis

---

#### 8. Model Metrics / Effectiveness
**File**: `src/routes/predictions.routes.js`

```javascript
GET /api/predictions/effectiveness
  Query DB or static data:
  - Model accuracy: 0.87
  - Precision: 0.82
  - Recall: 0.78
  - AUC: 0.91
  
  Response: { metrics: {...}, lastUpdated: timestamp }
```

**Called By**:
- Reports page
- Model info section
- Admin dashboard

---

### TIER 4: Lower Priority (Implement Last)

#### 9. Tier Transitions
**File**: `src/routes/predictions.routes.js`

```javascript
GET /api/predictions/transitions?window=30day
  Query DB:
  - Track patient movement between risk tiers
  - Count how many moved from Tier 1 → Tier 2, etc.
  
  Response: [
    { fromTier: 1, toTier: 1, count: 45 },
    { fromTier: 1, toTier: 2, count: 5 },
    ...
  ]
```

**Called By**:
- Analytics dashboards
- Sankey charts

---

#### 10. Individual Assessment
**File**: `src/routes/assessment.routes.js`

```javascript
POST /api/assessment/predict
  Input: { age, gender, conditions, utilization, costs }
  
  TODO:
  - Call ML model
  - Generate personalized report
  - Return recommendations
  
POST /api/assessment/save-report
  - Store report in database (or file system)
  - Generate unique reportId
  
GET /api/assessment/report/:reportId
  - Retrieve saved report for viewing/printing
```

**Called By**:
- Individual assessment flow
- Report generation/viewing

---

## 📋 Database Queries Needed

### High Priority Queries

```sql
-- 1. Get all patients with predictions (for members list)
SELECT p.*, d.dept_name, pred.risk_score, pred.risk_tier
FROM patients p
LEFT JOIN departments d ON p.dept_id = d.department_id
LEFT JOIN predictions pred ON p.patient_id = pred.patient_id
WHERE pred.prediction_window = '30day'
LIMIT $1 OFFSET $2;

-- 2. Get patient detail with all predictions and projections
SELECT p.*, d.dept_name
FROM patients p
LEFT JOIN departments d ON p.dept_id = d.department_id
WHERE p.patient_id = $1;

-- Then get related predictions and projections separately

-- 3. Get ROI data for high-risk patients
SELECT p.patient_id, p.name, pred.risk_score, pred.risk_tier,
       fp.intervention_cost, fp.expected_savings, fp.net_benefit, fp.roi_percent
FROM patients p
JOIN predictions pred ON p.patient_id = pred.patient_id
JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
WHERE pred.risk_tier >= 4
ORDER BY fp.roi_percent DESC;

-- 4. Count by department and risk tier
SELECT d.dept_name, pred.risk_tier, COUNT(*) as count
FROM patients p
JOIN departments d ON p.dept_id = d.department_id
JOIN predictions pred ON p.patient_id = pred.patient_id
GROUP BY d.dept_name, pred.risk_tier;

-- 5. Get user by email for authentication
SELECT * FROM users WHERE email = $1;
```

---

## 🔄 Implementation Checklist

### Week 1: Authentication & Members
- [ ] Implement login (password hashing, JWT)
- [ ] Implement members list query
- [ ] Implement member detail query
- [ ] Test in Postman or curl

### Week 2: Predictions & ROI
- [ ] Connect to ML model service (or local model)
- [ ] Implement prediction calculation
- [ ] Implement ROI calculation
- [ ] Add financial projections queries

### Week 3: File Upload & Interventions
- [ ] Implement CSV parsing and import
- [ ] Add bulk prediction calculation
- [ ] Implement care plan endpoints
- [ ] Track intervention outcomes

### Week 4: Polish & Testing
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add logging
- [ ] Unit tests
- [ ] Integration tests

---

## 🚀 Getting Started

### To Start Implementation:

1. **Pick TIER 1 items** (Auth + Members)
2. **Replace mock data** with real database queries using `src/models/db.js`
3. **Test with curl/Postman** before checking frontend
4. **Update frontend** to handle real API responses
5. **Move to TIER 2** once TIER 1 is working

### Example: Implementing GET /api/members

**Current (Mock)**:
```javascript
// src/routes/members.routes.js
router.get('/', authMiddleware, async (req, res) => {
  const mockMembers = [...];  // Mock data
  res.json({ data: mockMembers, ... });
});
```

**Real Implementation**:
```javascript
import { Patient } from '../models/db.js';

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20, department, riskTier } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const filters = { department, riskTier };
    const members = await Patient.getAll(limit, offset, filters);
    const total = await Patient.count(filters);
    
    res.json({
      data: members,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

**Status**: Backend scaffold complete. Ready for real database implementation!
