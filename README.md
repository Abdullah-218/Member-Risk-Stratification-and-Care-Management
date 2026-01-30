# 🏥 HealthGuard AI - Intelligent Healthcare Risk Prediction Platform

## 📋 Abstract

**HealthGuard AI** is an advanced healthcare risk management platform that combines machine learning, real-time data analytics, and financial modeling to predict patient readmission risks and optimize healthcare interventions. The system serves two primary user groups: **individual patients** seeking personalized health risk assessments and **healthcare organizations** managing large patient populations.

By analyzing 27 clinical and demographic features, HealthGuard AI predicts readmission probabilities across 30, 60, and 90-day windows, stratifies patients into 5 actionable risk tiers, and calculates expected Return on Investment (ROI) for preventive interventions. The platform integrates AI-powered explainability (SHAP analysis) to provide transparent, interpretable risk drivers for both patients and care coordinators.

**Key Capabilities:**
- 🎯 **Dual-Mode Operation**: Individual patient self-assessment + Organization-wide population management
- 🤖 **ML-Powered Predictions**: Random Forest, LightGBM, Catboost, XGboost, Extratrees and ensemble models trained on 15,000 CMS patient records
- 💰 **Financial Impact Analysis**: Real-time ROI calculations with tier-based intervention costs
- 🔍 **Explainable AI**: SHAP analysis reveals top 5 risk drivers per prediction window
- 📊 **Interactive Dashboards**: React-based UI for patients and care teams
- 🗄️ **Enterprise Database**: PostgreSQL storage for predictions, patient records, and financial projections
- 🚀 **Production-Ready**: Full-stack application with Node.js backend, React frontend, and Python ML services

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      HealthGuard AI Platform                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐              ┌──────▼───────┐
        │  Individual UI  │              │Organization UI│
        │   (Patients)    │              │(Care Teams)   │
        └───────┬─────────┘              └──────┬───────┘
                │                               │
                └───────────────┬───────────────┘
                                │
                        ┌───────▼────────┐
                        │  Frontend (React)│
                        │  Vite + Router   │
                        └───────┬─────────┘
                                │
                        ┌───────▼────────┐
                        │Backend (Node.js)│
                        │  Express REST   │
                        └───────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼─────┐
        │Python ML     │ │PostgreSQL  │ │Future:    │
        │Service       │ │Database    │ │AI Gemini  │
        │(Predictions) │ │(Port 5433) │ │Nodemailer │
        └──────────────┘ └────────────┘ └───────────┘
```

---

## 🚀 Quick Start Guide

### Complete System Launch (All Components)

```bash
# Terminal 1: Start Database
cd "/Users/abdullah/Dept Hackathon/database"
docker-compose up -d

# Terminal 2: Start Backend
cd "/Users/abdullah/Dept Hackathon/backend"
npm run dev

# Terminal 3: Start Frontend
cd "/Users/abdullah/Dept Hackathon/frontend"
npm run dev

# Access the application:
# Individual Assessment: http://localhost:5173/
# Organization Portal: http://localhost:5173/org/login (admin/admin123)
# Database Admin: http://localhost:8080/
```

---

## 📁 Project Structure

```
/Users/abdullah/Dept Hackathon/
│
├── 📂 frontend/                       # React Frontend Application
│   ├── src/
│   │   ├── individual_assessment_ui/  # Patient self-assessment
│   │   │   ├── AssessmentReportPage.jsx
│   │   │   └── IndividualAssessmentPage/
│   │   ├── organization_ui/           # Care team dashboard
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage/
│   │   │   │   ├── AllMembersPage/
│   │   │   │   ├── HighRiskMembersPage/
│   │   │   │   ├── DepartmentMembersPage/
│   │   │   │   └── MemberDetailPage/
│   │   │   └── components/
│   │   └── common/
│   └── package.json
│
├── 📂 backend/                        # Node.js Backend API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── dashboard.routes.js
│   │   │   ├── members.routes.js
│   │   │   └── predictions.routes.js
│   │   ├── services/
│   │   │   └── mlPredictionService.js
│   │   └── config/
│   │       └── database.js
│   └── package.json
│
├── 📂 healthcare-risk-ml/             # Machine Learning Pipeline
│   ├── src/                           # Data pipeline scripts
│   ├── models/                        # Trained models
│   │   ├── best_30_day_model.pkl
│   │   ├── best_60_day_model.pkl
│   │   └── best_90_day_model.pkl
│   ├── new_patient_risk_prediction.py
│   ├── run_pipeline.py
│   └── hackathon_dept/                # Python venv
│
└── 📂 database/                       # PostgreSQL Database
    ├── docker-compose.yml
    └── scripts/
```

---

## 🔄 Complete Data Flow

### Individual Patient Journey
```
1. Patient opens http://localhost:5173/
   ↓
2. Completes 4-step assessment form
   ↓
3. Frontend → Backend → Python ML Service
   ↓
4. ML predicts 30/60/90-day risks + SHAP
   ↓
5. Backend stores in PostgreSQL
   ↓
6. Frontend displays results with explanations
   ↓
7. Options: AI recommendations, Email report (mock)
```

### Organization Workflow
```
1. Login → Dashboard metrics
   ↓
2. Search patients by ID
   ↓
3. View risk profiles + SHAP
   ↓
4. Export reports
```

---

## 🛠️ Detailed Installation Guide

### Prerequisites
- **Node.js**: v20.19.2+
- **Python**: 3.11.9+
- **Docker**: Latest
- **Git**: Latest

---

### 1️⃣ Database Setup (PostgreSQL)

```bash
cd "/Users/abdullah/Dept Hackathon/database"

# Start PostgreSQL (Port 5433)
docker-compose up -d

# Verify
docker ps

# Access Adminer: http://localhost:8080
# Server: db
# Username: postgres  
# Password: postgres
# Database: health_risk_db
```

---

### 2️⃣ Machine Learning Setup

```bash
cd "/Users/abdullah/Dept Hackathon/healthcare-risk-ml"

# Activate Python environment
source hackathon_dept/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Test ML service
python new_patient_risk_prediction.py --test

# ✅ Pre-trained models already available
```

---

### 3️⃣ Backend Setup (Node.js)

```bash
cd "/Users/abdullah/Dept Hackathon/backend"

# Install dependencies
npm install

# Verify .env exists with correct settings
cat .env

# Start server (Port 5000)
npm run dev
```

**API Endpoints:**
- `POST /api/predictions/predict` - ML predictions
- `GET /api/dashboard/stats` - Organization metrics
- `GET /api/members` - All patients
- `GET /api/members/:id` - Patient details

---

### 4️⃣ Frontend Setup (React)

```bash
cd "/Users/abdullah/Dept Hackathon/frontend"

# Install dependencies
npm install

# Start dev server (Port 5173)
npm run dev
```

**Access Points:**
- Individual: `http://localhost:5173/`
- Organization: `http://localhost:5173/org/login`

---

## 🎮 Usage Guide

### For Patients

1. **Open**: http://localhost:5173/
2. **Complete 4 Steps**:
   - Demographics (age, gender, BMI)
   - Chronic Conditions (11 checkboxes)
   - Healthcare Utilization (visits, admissions)
   - Review & Predict
3. **View Results**:
   - Risk scores (30/60/90-day)
   - SHAP explanations (click ℹ️)
   - Mock AI recommendations
   - Mock email report

### For Organizations

1. **Login**: admin / admin123
2. **Dashboard**: View metrics
3. **Search**: Type patient ID (e.g., "9725")
4. **Analyze**: View SHAP + ROI details
5. **Export**: Download reports

---

## 🤖 Machine Learning Details

### Training Data
- **Source**: CMS 2008-2010
- **Patients**: 15,000 stratified
- **Features**: 27 engineered
- **Split**: 80% train / 20% test

### Models
- **30-Day**: Random Forest (ROC-AUC 0.78)
- **60-Day**: ExtraTrees (ROC-AUC 0.81)
- **90-Day**: LightGBM (ROC-AUC 0.82)

### Risk Tiers
| Tier | Range | Label | Color |
|------|-------|-------|-------|
| 1 | 0-10% | Normal | 🟢 |
| 2 | 10-25% | Low | 💚 |
| 3 | 25-50% | Moderate | 🔵 |
| 4 | 50-75% | High | 🟠 |
| 5 | 75-100% | Critical | 🔴 |

---

## 💰 ROI Calculation

### Formula
```python
window_cost = (annual_cost / 365) × days
preventable = window_cost × 0.60
expected_savings = preventable × success_rate
net_benefit = expected_savings - intervention_cost
ROI = (net_benefit / intervention_cost) × 100
```

### Intervention Costs
| Tier | 30-Day | 60-Day | 90-Day |
|------|--------|--------|--------|
| 1 | $0 | $0 | $0 |
| 2 | $150 | $250 | $350 |
| 3 | $400 | $700 | $1,050 |
| 4 | $700 | $1,100 | $1,550 |
| 5 | $900 | $1,650 | $1,900 |

---

## 🔍 Key Features

### 1. SHAP Explanations
- Click ℹ️ next to risk scores
- See top 5 risk drivers
- Visual bars with percentages
- Direction indicators (↑ increases / ↓ decreases)

### 2. Patient Search
- Available in all member pages
- Search by numeric ID
- Real-time filtering

### 3. Mock AI Recommendations
- 7-day meal plan
- Weekly exercise schedule
- Lifestyle tips
- Medical follow-ups
- **Status**: Mock UI (future Gemini API)

### 4. Mock Email Reports
- Email input modal
- PDF download/send options
- Success confirmation
- **Status**: Mock UI (future Nodemailer)

---

## 🔧 Technology Stack

**Frontend**: React 18.2, Vite 7.3, React Router 6.20, Recharts, Lucide Icons  
**Backend**: Node.js 20.19, Express 4.18, PostgreSQL (pg)  
**ML**: Python 3.11, scikit-learn, LightGBM, SHAP, Pandas, NumPy  
**Database**: PostgreSQL 15 (Docker), Adminer  
**Future**: Google Gemini API, Nodemailer, PDFKit  

---

## 📊 Database Schema

**Tables:**
- `patients` - Demographics + conditions
- `predictions` - 30/60/90-day risks + tiers
- `financial_projections` - Costs + ROI
- `patient_features` - 27 ML features
- `departments` - Organization structure

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
docker ps  # Check if running
docker-compose up -d  # Restart
```

### Python Script Not Found
```bash
cd healthcare-risk-ml
source hackathon_dept/bin/activate
python new_patient_risk_prediction.py --test
```

### Port Already in Use
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill it
```

---

## 🚀 Future Roadmap

### Phase 1: Core Integrations
- ✅ PDF report generation
- ✅ Email delivery (Nodemailer)
- ✅ AI recommendations (Gemini)

### Phase 2: Advanced Features
- [ ] Real-time dashboard updates
- [ ] Care plan tracking
- [ ] Patient portal login
- [ ] Automated scheduling

### Phase 3: Clinical Integration
- [ ] HL7/FHIR import
- [ ] EHR integration
- [ ] Real-time alerts

---

## 📚 Documentation

- `healthcare-risk-ml/Readme/START_HERE.md`
- `healthcare-risk-ml/Readme/SYSTEM_GUIDE.md`
- `frontend/Readme/FRONTEND_SETUP_AND_API_GUIDE.md`
- `database/Readme/`

---

## 📞 Quick Commands

```bash
# Start Database
cd database && docker-compose up -d

# Start Backend  
cd backend && npm run dev

# Start Frontend
cd frontend && npm run dev

# Test ML
cd healthcare-risk-ml
source hackathon_dept/bin/activate
python new_patient_risk_prediction.py --test
```

**URLs:**
- Frontend: http://localhost:5173/
- Backend: http://localhost:5000/
- DB Admin: http://localhost:8080/
- Org Login: http://localhost:5173/org/login

---

## 🎯 Summary

HealthGuard AI is a **production-ready** healthcare risk prediction platform that:

✅ Predicts 30/60/90-day risks with 78-82% accuracy  
✅ Explains predictions with SHAP  
✅ Calculates financial ROI  
✅ Serves patients & organizations  
✅ Full-stack: Python ML + Node.js + React + PostgreSQL  
✅ Ready for demonstration  

---

**Built with ❤️ for better healthcare outcomes**

**Project**: HealthGuard AI  
**Event**: Department Hackathon 2026  
**License**: SMVEC

**Disclaimer**: Research tool only. Not for clinical diagnosis. Consult healthcare professionals for medical decisions.
