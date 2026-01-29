# Quick Reference: Database Strategy at a Glance

**Date**: January 29, 2026  
**Status**: Strategy Complete - Design Ready  

---

## 📊 Your 5 Requirements → Database Solution

| # | Your Requirement | Database Solution | Size | Key Table |
|---|------------------|-------------------|------|-----------|
| 1️⃣ | 3K patient baseline | patients + patient_features | 3,000 rows | `patients`, `patient_features` |
| 2️⃣ | Predictions (window-wise, tier-wise) | predictions table + org_tier_summary view | 9,000 rows | `predictions`, `org_tier_summary` |
| 3️⃣ | ROI & investments | financial_projections table + roi_aggregations view | 9,000 rows | `financial_projections`, `roi_aggregations` |
| 4️⃣ | 10 departments + high-risk | departments table + dept_risk_distribution view | 10+50 rows | `departments`, `dept_risk_distribution` |
| 5️⃣ | New patient integration | Full pipeline: raw → features → predictions → ROI | N rows | All tables auto-update |

---

## 🗂️ All Database Objects (13 Total)

### TABLES (6 Core + 1 Optional)

```
┌─ MASTER DATA TABLES (6)
│
├─ organizations (1 row)
│  └─ Your org metadata
│
├─ departments (10 rows)
│  └─ 10 clinical departments (Cardiology, Nephrology, etc.)
│
├─ patients (3,000+N rows)
│  └─ Master patient registry with demographics, costs
│
├─ patient_features (3,000+N rows)
│  └─ 27 engineered features per patient (queryable columns)
│
├─ predictions (9,000+3N rows)
│  └─ Risk scores per patient per window (30/60/90 day)
│
├─ financial_projections (9,000+3N rows)
│  └─ ROI calculations per prediction
│
└─ new_patient_raw_input (optional, for audit trail)
   └─ Raw input as received from frontend (OPTIONAL)

TOTAL CORE TABLES: 6
OPTIONAL TABLES: 1
```

### MATERIALIZED VIEWS (5 Pre-Calculated)

```
┌─ FAST QUERY RESULTS (5)
│
├─ org_tier_summary (15 rows = 3 windows × 5 tiers)
│  └─ What: Tier distribution by prediction window
│  └─ Use: "Show me tier breakdown for 30_day window"
│  └─ Query time: <10ms
│
├─ roi_aggregations (3 rows = 1 per window)
│  └─ What: Organization-wide ROI statistics
│  └─ Use: "What's our average ROI for 30_day window?"
│  └─ Query time: <10ms
│
├─ positive_roi_patients (1,500-1,800 rows)
│  └─ What: Patients where roi_percent > 0
│  └─ Use: "Who should we target for intervention?"
│  └─ Query time: <100ms
│
├─ dept_risk_distribution (50 rows = 10 depts × 5 tiers)
│  └─ What: Patient count per department per tier
│  └─ Use: "How many high-risk patients in Cardiology?"
│  └─ Query time: <10ms
│
└─ high_risk_by_department (20 rows = 10 depts × 2 tiers)
   └─ What: Only Tier 4+5 patients per department
   └─ Use: "Alert: Cardiology has 80 high-risk patients"
   └─ Query time: <10ms

TOTAL MATERIALIZED VIEWS: 5
```

---

## 🎯 The 27 Features Stored in Database

```
patient_features table columns:
├─ Demographics (5)
│  ├─ is_elderly
│  ├─ [race_encoded] (in patients table as race)
│  ├─ [age] (in patients table)
│  ├─ [gender] (in patients table)
│  └─ has_esrd
│
├─ Chronic Conditions (10 binary: 0/1/2)
│  ├─ has_alzheimers
│  ├─ has_chf
│  ├─ has_ckd
│  ├─ has_cancer
│  ├─ has_copd
│  ├─ has_depression
│  ├─ has_diabetes
│  ├─ has_ischemic_heart
│  ├─ has_ra_oa
│  └─ has_stroke
│
├─ Utilization (6 decimal values)
│  ├─ total_admissions_2008
│  ├─ total_hospital_days_2008
│  ├─ days_since_last_admission
│  ├─ recent_admission
│  ├─ total_outpatient_visits_2008
│  └─ high_outpatient_user
│
├─ Financial (4 decimal values)
│  ├─ total_annual_cost
│  ├─ cost_percentile
│  ├─ high_cost
│  └─ total_inpatient_cost
│
└─ Derived (2 decimal values)
   ├─ frailty_score
   └─ complexity_index

TOTAL: 27 features (stored as columns, NOT JSON)
```

---

## 🔄 Data Flow Summary

### Baseline Data (X_test):
```
X_test.csv (3,000 × 27)
    ↓
[Batch Load]
    ↓
patients table (3,000)
patient_features table (3,000)
[Assign departments by condition]
    ↓
predictions table (9,000 = 3,000 × 3 windows)
    ↓
financial_projections table (9,000 = 3,000 × 3 windows)
    ↓
Materialized views refresh
    ↓
Dashboard ready! ✅
```

### New Patient (Realtime):
```
Frontend form (raw data, 10-15 fields)
    ↓
[Feature engineering]
    ↓
patients table (+1)
patient_features table (+1)
[Auto-assign department]
    ↓
predictions table (+3)
    ↓
financial_projections table (+3)
    ↓
Materialized views refresh (auto)
    ↓
Dashboard updated! ✅
```

---

## 💾 Storage Size

| Phase | Total Records | Database Size |
|-------|---------------|---------------|
| After baseline load | 27,000 | ~5-6 MB |
| After 1 month | 27,300 | ~6-7 MB |
| After 1 year | 28,650 | ~7-8 MB |
| After 5 years | 46,250 | ~40-50 MB |

**Verdict**: Tiny database! No storage concerns.

---

## 🚀 Implementation Timeline

| Phase | Tasks | Timeline |
|-------|-------|----------|
| 1 | Schema creation + indexes + views | 1-2 days |
| 2 | Load 3K baseline patients | 1 day |
| 3 | Run predictions + calculate ROI | 1 day |
| 4 | New patient integration | 2-3 days |
| 5 | Dashboard development | 3-5 days |
| **TOTAL** | **Full system implementation** | **1-2 weeks** |

---

## ✅ 5 Critical Decisions Needed

```
1. Department Assignment
   ├─ A: Condition-based (RECOMMENDED) ✅
   │  └─ Route by primary condition (CHF→Cardiology, etc.)
   │
   └─ B: Risk-tier based
      └─ Route by risk tier (Tier 5→Critical, etc.)

2. Data Source Distinction
   ├─ A: Keep X_TEST vs NEW_PATIENT separate
   └─ B: Combine seamlessly

3. Audit Trail Depth
   ├─ A: Store raw input (new_patient_raw_input table)
   └─ B: Don't store raw input

4. High-Risk Definition
   ├─ A: Tier 4 + Tier 5 (~200-250 patients)
   └─ B: Tier 5 only (~30-50 patients)

5. Multi-Organization Support
   ├─ A: Design for multiple orgs (scalable)
   └─ B: Single org only (simpler)
```

---

## 📈 Key Metrics (Baseline - 3K Patients)

```
Baseline Cohort:
├─ Total patients: 3,000
├─ Features per patient: 27
├─ Prediction windows: 3 (30, 60, 90 day)
├─ Predictions per patient: 3
├─ Total predictions: 9,000
│
├─ Risk Tier Distribution (typical):
│  ├─ Tier 1 (Normal): ~1,950 (65%)
│  ├─ Tier 2 (Low): ~600 (20%)
│  ├─ Tier 3 (Moderate): ~300 (10%)
│  ├─ Tier 4 (High): ~120 (4%)
│  └─ Tier 5 (Critical): ~30 (1%)
│
├─ Department Distribution (Cardiology example):
│  ├─ Tier 1: ~300 patients
│  ├─ Tier 2: ~250 patients
│  ├─ Tier 3: ~150 patients
│  ├─ Tier 4: ~80 patients
│  └─ Tier 5: ~20 patients
│
├─ ROI Statistics (typical):
│  ├─ Average ROI: ~85-95%
│  ├─ Positive ROI: ~50-60% of patients
│  ├─ Excellent ROI (>75%): ~5-10%
│  └─ High-risk (Tier 4+5): ~150 patients
│
└─ Cost Profile:
   ├─ Average annual cost: ~$8,000-$12,000
   ├─ High-cost patients (top 20%): ~$35,000+
   └─ Total addressable costs: ~$25M annually
```

---

## 🔗 How Everything Connects

```
                                    PATIENT ENTERS SYSTEM
                                            ↓
                          ┌─────────────────┴──────────────────┐
                          │                                    │
                    ┌─────▼─────┐                  ┌──────────▼──────┐
                    │ X_test.csv │                  │ New Patient Form│
                    │ (3,000 rows)                  │ (Frontend)      │
                    └─────┬─────┘                   └──────────┬──────┘
                          │                                   │
                          │ Batch Load                    Raw → Engineering
                          │                                   │
         ┌────────────────┴──────────────────┐                │
         │                                   │                │
    ┌────▼─────┐                  ┌─────────▼──────┐         │
    │  patients │                  │ patient_features          │
    │ (3,000)   │──────────────────│  (3,000)       │         │
    └────┬─────┘                   └────────────────┘         │
         │                                   │                │
         │ Connect to departments            │ Get 27 features│
         ↓                                   ↓                │
    ┌──────────────┐              ┌──────────────────┐       │
    │ departments  │              │  ML Models (3)   │       │
    │   (10)       │              │ 30/60/90 day     │◄──────┘
    └──────────────┘              └────────┬─────────┘
         ▲                                 │
         │                    ┌────────────▼──────────────┐
         │                    │    predictions           │
         │                    │  (9,000 or 9,000+3N)     │
         │                    └────────┬──────────────────┘
         │                             │
         │            ┌────────────────▼──────────────┐
         │            │  financial_projections        │
         │            │ (9,000 or 9,000+3N)           │
         │            └────────┬─────────────────────┘
         │                     │
         │    ┌────────────────▼──────────────┐
         │    │ Materialized Views (5)        │
         │    ├───────────────────────────────┤
         │    │ • org_tier_summary            │
         │    │ • roi_aggregations            │
         │    │ • positive_roi_patients       │
         │    │ • dept_risk_distribution      │
         │    │ • high_risk_by_department     │
         │    └────────────────┬──────────────┘
         │                     │
         └─────────────────────┼──────────────────┐
                               │                  │
                         ┌─────▼─────┐      ┌────▼──────┐
                         │ DASHBOARD │      │ ALERTS    │
                         │  (Fast!)  │      │ (Auto)    │
                         └───────────┘      └───────────┘
```

---

## 🎯 Key Design Principles

```
1. SEPARATION OF CONCERNS
   ├─ patient_features: Stores 27 columns (queryable)
   ├─ predictions: Stores risk_score + tier (for audit)
   └─ financial_projections: Stores ROI details (for analysis)

2. PRE-CALCULATION FOR SPEED
   ├─ Materialized views: Pre-calculated summaries
   ├─ Frontend queries: Hit views, not raw tables
   └─ Refresh: After each prediction batch

3. DATA SOURCE DISTINCTION
   ├─ X_test patients: Baseline reference (3,000)
   ├─ New patients: Real-time intake (N growing over time)
   └─ Same database: Both flows merge at predictions

4. MULTI-TENANCY READY
   ├─ Every table has org_id
   ├─ Can scale to multiple organizations
   └─ Currently: 1 org, but infrastructure ready

5. AUDIT TRAIL
   ├─ Timestamps on everything
   ├─ Track data_source (X_TEST vs NEW_PATIENT)
   ├─ Optional: Store raw input (new_patient_raw_input)
   └─ Full compliance: HIPAA-ready
```

---

## 📋 Documents in Database Folder

```
database/
├─ docker-compose.yml
│  └─ PostgreSQL container setup (already exists)
│
├─ DATABASE_STRATEGY_ANALYSIS.md ✅
│  └─ Comprehensive strategy (500+ lines)
│
├─ VISUAL_DATABASE_ARCHITECTURE.md ✅
│  └─ Visual diagrams & data flows
│
├─ DECISION_LOG_AND_CHECKLIST.md ✅
│  └─ Implementation tracking & 5 decisions
│
└─ QUICK_REFERENCE.md (THIS FILE) ✅
   └─ Quick summary for at-a-glance reference

ANALYSIS STATUS: ✅ COMPLETE
AWAITING: Your decisions on 5 key points
```

---

## 🚀 Next Steps

### FOR YOU:
1. ✅ Read this quick reference
2. ✅ Review DATABASE_STRATEGY_ANALYSIS.md (detailed)
3. ❓ Decide on 5 critical decisions (see above)
4. ✅ Fill out DECISION_LOG_AND_CHECKLIST.md
5. ✅ Approve design
6. ✅ Give go-ahead to start implementation

### FOR ME (Once Approved):
1. Create all SQL schema files
2. Build baseline data loader
3. Integrate with ML models
4. Create materialized views
5. Connect to new patient pipeline
6. Build dashboards
7. Deploy to production

### TIMELINE:
- Decision making: 1-3 days
- Implementation: 1-2 weeks
- Testing & refinement: 3-5 days
- Go-live: Ready!

---

## ❓ Common Questions

```
Q: Can I change departments after assigning?
A: YES. Departments are just a foreign key. Can be updated.

Q: What if I want different department logic?
A: Easy to change. Decision point #1 determines this.

Q: How many new patients can the system handle?
A: Unlimited. Database grows linearly.

Q: Can I query predictions by patient?
A: YES. predictions table has patient_id index (fast queries).

Q: What if I want to change ROI calculation?
A: Easy. ROI is calculated and stored (not on-the-fly).

Q: Can I delete a patient?
A: YES. Cascade delete removes all related records.

Q: Do I need to refresh views manually?
A: NO. Auto-refresh after each prediction batch.

Q: Is the database secure?
A: Basic schema. HIPAA encryption/access control needed (future).

Q: What about backups?
A: Docker volume + SQL backups (to be implemented).

Q: Can I export data for reports?
A: YES. Query any table/view for Excel/CSV export.
```

---

**Status**: ✅ STRATEGY COMPLETE - READY FOR YOUR APPROVAL

**Questions?** See DATABASE_STRATEGY_ANALYSIS.md for detailed answers.
