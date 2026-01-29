# Visual Database Architecture Summary

## 🎯 Your 5 Requirements & Database Mapping

### Requirement 1: Organization Database (3K Patients)
```
X_test.csv (3,001 rows, 27 columns)
         ↓
         │ PARSE BATCH
         ↓
    ┌────────────────────────────────────┐
    │   BASELINE ORGANIZATION DATA       │
    ├────────────────────────────────────┤
    │  patients (3,000 records)          │
    │  ├─ patient_id (PK)                │
    │  ├─ age, gender, race              │
    │  ├─ annual_cost                    │
    │  ├─ department_id (assigned)       │
    │  └─ data_source = 'X_TEST'         │
    │                                    │
    │  patient_features (3,000 records)  │
    │  ├─ patient_id (FK)                │
    │  └─ 27 columns (all features)      │
    └────────────────────────────────────┘
         ↓
    Ready for Prediction
```

---

### Requirement 2: Predicted Org Data (Window-Wise & Tier-Wise)
```
27 Features per Patient
         ↓
    ┌─────────────────────┐
    │ ML MODELS (3)       │
    │ ├─ 30_day model     │
    │ ├─ 60_day model     │
    │ └─ 90_day model     │
    └────────┬────────────┘
             ↓
         PREDICTIONS TABLE
    ┌──────────────────────────────────────┐
    │ patient_id │ window  │ risk_score │   │
    ├────────────┼─────────┼────────────┤   │
    │    1001    │ 30_day  │   0.23     │→ Tier 2
    │    1001    │ 60_day  │   0.45     │→ Tier 3
    │    1001    │ 90_day  │   0.82     │→ Tier 5
    │    1002    │ 30_day  │   0.15     │→ Tier 1
    │     ...    │   ...   │    ...     │
    │    3000    │ 90_day  │   0.92     │→ Tier 5
    └──────────────────────────────────────┘
    
    TOTAL PREDICTIONS: 3,000 × 3 = 9,000 records

              ↓ MATERIALIZE VIEW

    org_tier_summary (15 rows)
    ┌──────────┬──────┬────────┬────────────┐
    │ Window   │ Tier │ Count  │ Percentage │
    ├──────────┼──────┼────────┼────────────┤
    │ 30_day   │  1   │ 1,950  │   65.0%    │
    │ 30_day   │  2   │  600   │   20.0%    │
    │ 30_day   │  3   │  300   │   10.0%    │
    │ 30_day   │  4   │  120   │    4.0%    │
    │ 30_day   │  5   │   30   │    1.0%    │
    │ 60_day   │  1   │ 1,800  │   60.0%    │
    │ 60_day   │  2   │  750   │   25.0%    │
    │ 60_day   │  3   │  300   │   10.0%    │
    │ 60_day   │  4   │  120   │    4.0%    │
    │ 60_day   │  5   │   30   │    1.0%    │
    │ 90_day   │  1   │ 1,500  │   50.0%    │
    │ 90_day   │  2   │  900   │   30.0%    │
    │ 90_day   │  3   │  450   │   15.0%    │
    │ 90_day   │  4   │  120   │    4.0%    │
    │ 90_day   │  5   │   30   │    1.0%    │
    └──────────┴──────┴────────┴────────────┘
    
    FRONTEND: Tier distribution charts ready!
```

---

### Requirement 3: ROI Calculations & Investments
```
For EACH prediction (9,000 calculations):

Input:
├─ annual_cost = $45,000 (from patient)
├─ prediction_window = '30_day'
├─ risk_tier = 4 (from prediction)
└─ days_in_window = 30

CALCULATIONS:
├─ window_cost = 45,000 / 365 × 30 = $3,699
├─ addressable_cost = 3,699 × 0.60 = $2,219 (60% preventable)
├─ intervention_cost = $500 (tier 4 intervention)
├─ success_rate = 45% (tier 4 × 30_day)
├─ expected_savings = 2,219 × 0.45 = $999
├─ net_benefit = 999 - 500 = $499
└─ roi_percent = (499 / 500) × 100 = 99.8%

              ↓ STORE IN

    financial_projections (9,000 records)
    ┌──────────┬──────┬─────────────┬────────────┐
    │ window   │ tier │ roi_percent │ category   │
    ├──────────┼──────┼─────────────┼────────────┤
    │ 30_day   │  1   │    156.5    │ EXCELLENT  │
    │ 30_day   │  2   │     89.2    │ STRONG     │
    │ 30_day   │  3   │     45.3    │ POSITIVE   │
    │ 30_day   │  4   │     99.8    │ EXCELLENT  │
    │ 30_day   │  5   │    250.0    │ EXCELLENT  │
    │   ...    │ ...  │     ...     │    ...     │
    └──────────┴──────┴─────────────┴────────────┘

              ↓ MATERIALIZE VIEWS

    View 1: roi_aggregations (3 rows)
    ┌──────────┬────────────┬──────────────┬─────────────────┐
    │ window   │ avg_roi%   │ positive_roi │ total_benefits  │
    ├──────────┼────────────┼──────────────┼─────────────────┤
    │ 30_day   │    87.5%   │    2,100     │   $1,245,000    │
    │ 60_day   │    92.3%   │    2,250     │   $1,450,000    │
    │ 90_day   │   105.8%   │    2,400     │   $1,680,000    │
    └──────────┴────────────┴──────────────┴─────────────────┘

    View 2: positive_roi_patients (1,500-1,800 rows)
    ┌────────┬─────────────────┬──────────┬──────────┬─────────┐
    │ pt_id  │ annual_cost     │ tier     │ window   │ roi%    │
    ├────────┼─────────────────┼──────────┼──────────┼─────────┤
    │ 1001   │  $45,000        │   4      │ 30_day   │ 99.8%   │
    │ 1002   │  $62,500        │   5      │ 30_day   │ 250.0%  │
    │ 1003   │  $12,000        │   1      │ 30_day   │ 156.5%  │
    │  ...   │    ...          │  ...     │   ...    │  ...    │
    └────────┴─────────────────┴──────────┴──────────┴─────────┘

    FRONTEND: ROI dashboard & intervention target list ready!
```

---

### Requirement 4: Department Database (10 Departments)
```
CONDITION-BASED DEPARTMENT ASSIGNMENT (Recommended):

Patient has condition X
         ↓
    ┌──────────────────────────────┐
    │ LOGIC: Route to Department   │
    ├──────────────────────────────┤
    │ IF has_chf OR ischemic_heart │
    │    → CARDIOLOGY              │
    │ ELSE IF has_ckd OR has_esrd  │
    │    → NEPHROLOGY              │
    │ ELSE IF has_diabetes         │
    │    → ENDOCRINOLOGY           │
    │ ELSE IF has_copd             │
    │    → PULMONOLOGY             │
    │ ELSE IF has_stroke           │
    │    → NEUROLOGY               │
    │ ELSE IF has_cancer           │
    │    → ONCOLOGY                │
    │ ELSE IF has_depression       │
    │    → PSYCHIATRY              │
    │ ELSE IF has_ra_oa            │
    │    → RHEUMATOLOGY            │
    │ ELSE IF is_elderly+complex   │
    │    → GERIATRICS              │
    │ ELSE                         │
    │    → GENERAL_MEDICINE        │
    └──────────────────────────────┘
         ↓

    departments table (10 records)
    ┌────────────┬──────────────────┬──────────────────┐
    │ dept_id    │ dept_code        │ expected_patients│
    ├────────────┼──────────────────┼──────────────────┤
    │    1       │ CARDIOLOGY       │   800-1,000      │
    │    2       │ NEPHROLOGY       │   600-800        │
    │    3       │ ENDOCRINOLOGY    │   400-600        │
    │    4       │ PULMONOLOGY      │   200-300        │
    │    5       │ NEUROLOGY        │   150-250        │
    │    6       │ ONCOLOGY         │   100-150        │
    │    7       │ PSYCHIATRY       │   100-150        │
    │    8       │ RHEUMATOLOGY     │    50-100        │
    │    9       │ GERIATRICS       │   200-300        │
    │   10       │ GENERAL_MEDICINE │   300-500        │
    └────────────┴──────────────────┴──────────────────┘

    TOTAL: 3,000 patients distributed across 10 departments

              ↓ MATERIALIZE VIEW

    dept_risk_distribution (50 rows = 10 depts × 5 tiers)
    ┌─────────────────────┬──────┬────────┬────────────┐
    │ department          │ tier │ count  │ percentage │
    ├─────────────────────┼──────┼────────┼────────────┤
    │ CARDIOLOGY          │  1   │  300   │    10%     │
    │ CARDIOLOGY          │  2   │  250   │     8%     │
    │ CARDIOLOGY          │  3   │  150   │     5%     │
    │ CARDIOLOGY          │  4   │   80   │     3%     │
    │ CARDIOLOGY          │  5   │   20   │     1%     │
    │ NEPHROLOGY          │  1   │  200   │     7%     │
    │ NEPHROLOGY          │  2   │  200   │     7%     │
    │ ... (40 more rows)                              │
    └─────────────────────┴──────┴────────┴────────────┘

              ALSO:

    high_risk_by_department (20 rows = 10 depts × 2 tiers)
    ┌─────────────────────┬──────┬────────┐
    │ department          │ tier │ count  │
    ├─────────────────────┼──────┼────────┤
    │ CARDIOLOGY          │  4   │   80   │
    │ CARDIOLOGY          │  5   │   20   │
    │ NEPHROLOGY          │  4   │   60   │
    │ NEPHROLOGY          │  5   │   10   │
    │ ... (16 more rows)                │
    │ TOTAL HIGH-RISK     │ 4+5  │  200   │
    └─────────────────────┴──────┴────────┘

    FRONTEND: Department dashboards & high-risk lists ready!
```

---

### Requirement 5: New Patient Integration & Database Updates
```
STEP 1: User submits new patient form (Frontend)
         ↓
    Raw Input:
    ├─ age: 72
    ├─ gender: F
    ├─ has_diabetes: 1
    ├─ has_copd: 0
    ├─ annual_cost: $35,000
    └─ ... (~10-15 fields)

         ↓ FEATURE ENGINEERING (Backend)

    STEP 2: Transform raw → 27 features
         ├─ is_elderly: 1 (age > 65)
         ├─ complexity_index: 4.2 (calculated from conditions)
         ├─ frailty_score: 0.78 (calculated)
         └─ ... (24 more engineered features)

         ↓ DATABASE INSERT

    STEP 3: patients table
    ┌────────────────────────────────┐
    │ INSERT INTO patients           │
    │ (external_id, age, gender,     │
    │  annual_cost, department_id,   │
    │  data_source = 'NEW_PATIENT')  │
    │                                │
    │ Result: patient_id = 3001      │
    └────────────────────────────────┘

    STEP 4: patient_features table
    ┌────────────────────────────────┐
    │ INSERT INTO patient_features   │
    │ (patient_id=3001,              │
    │  is_elderly=1,                 │
    │  has_diabetes=1,               │
    │  complexity_index=4.2,         │
    │  frailty_score=0.78,           │
    │  ... 27 features total)        │
    │                                │
    │ Result: feature_id stored      │
    └────────────────────────────────┘

         ↓ RUN PREDICTIONS

    STEP 5: predictions table (3 inserts)
    ┌──────────────────────────────────────┐
    │ INSERT INTO predictions              │
    │ (patient_id=3001,                    │
    │  prediction_window='30_day',         │
    │  risk_score=0.35)  → risk_tier=2    │
    │                                      │
    │ INSERT INTO predictions              │
    │ (patient_id=3001,                    │
    │  prediction_window='60_day',         │
    │  risk_score=0.52)  → risk_tier=3    │
    │                                      │
    │ INSERT INTO predictions              │
    │ (patient_id=3001,                    │
    │  prediction_window='90_day',         │
    │  risk_score=0.68)  → risk_tier=4    │
    │                                      │
    │ Result: 3 predictions stored         │
    └──────────────────────────────────────┘

         ↓ CALCULATE ROI

    STEP 6: financial_projections table (3 inserts)
    ┌──────────────────────────────────────┐
    │ INSERT INTO financial_projections    │
    │ (patient_id=3001, window='30_day',   │
    │  annual_cost=35000,                  │
    │  risk_tier=2,                        │
    │  roi_percent=75.5,                   │
    │  roi_category='STRONG')              │
    │ ... (similar for 60_day, 90_day)     │
    │                                      │
    │ Result: 3 ROI records stored         │
    └──────────────────────────────────────┘

         ↓ REFRESH MATERIALIZED VIEWS

    STEP 7: Auto-update dashboards
    ┌──────────────────────────────────────┐
    │ REFRESH MATERIALIZED VIEW            │
    │   org_tier_summary                   │
    │   (updated: patient counts +1)       │
    │                                      │
    │ REFRESH MATERIALIZED VIEW            │
    │   roi_aggregations                   │
    │   (updated: total ROI recalculated)  │
    │                                      │
    │ REFRESH MATERIALIZED VIEW            │
    │   dept_risk_distribution             │
    │   (updated: Pulmonology tier 3 +1)   │
    │                                      │
    │ REFRESH MATERIALIZED VIEW            │
    │   positive_roi_patients              │
    │   (updated: added new patient)       │
    └──────────────────────────────────────┘

         ↓ RETURN TO USER

    STEP 8: Frontend displays
    {
      "patient_id": 3001,
      "department": "PULMONOLOGY",
      "predictions": {
        "30_day": {"risk_score": 0.35, "risk_tier": 2, "roi": 75.5%},
        "60_day": {"risk_score": 0.52, "risk_tier": 3, "roi": 82.3%},
        "90_day": {"risk_score": 0.68, "risk_tier": 4, "roi": 68.9%}
      }
    }

    DATABASE STATUS:
    ├─ Total patients: 3,001 (was 3,000)
    ├─ Total predictions: 9,003 (was 9,000)
    ├─ Total ROI records: 9,003 (was 9,000)
    ├─ All views auto-updated ✓
    └─ Dashboard reflects new patient ✓
```

---

## 📊 Complete Data Model

```
┌──────────────────────────────────────────────────────────────┐
│              HEALTHCARE RISK ML DATABASE                      │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  MASTER TABLES (The "source of truth"):                       │
│                                                                │
│  ┌─────────────────────┐      ┌──────────────────┐           │
│  │  organizations      │      │  departments     │           │
│  ├─────────────────────┤      ├──────────────────┤           │
│  │ org_id (PK)         │      │ dept_id (PK)     │           │
│  │ org_code            │      │ org_id (FK)      │           │
│  │ org_name            │      │ dept_code        │           │
│  └─────────────────────┘      │ dept_name        │           │
│           ▲                     │ specialty_type   │           │
│           │                     └──────────────────┘           │
│           │ (1:many)                  ▲                       │
│           │                           │ (1:many)              │
│           │                           │                       │
│  ┌────────┴─────────────────────────┬┘                       │
│  │                                  │                         │
│  │        ┌──────────────────────────────┐                    │
│  │        │       patients (3,000+N)     │                    │
│  │        ├──────────────────────────────┤                    │
│  │        │ patient_id (PK)              │                    │
│  │        │ external_id                  │                    │
│  │        │ age, gender, race            │                    │
│  │        │ annual_cost                  │                    │
│  │        │ org_id (FK)                  │                    │
│  │        │ department_id (FK)           │                    │
│  │        │ data_source (X_TEST|NEW)     │                    │
│  │        │ created_at                   │                    │
│  │        └──────────────────────────────┘                    │
│  │                    │                                        │
│  │                    │ (1:1)                                  │
│  │                    │                                        │
│  │        ┌───────────▼──────────────────────┐                │
│  │        │ patient_features (3,000+N)      │                │
│  │        ├────────────────────────────────┤                │
│  │        │ feature_id (PK)                │                │
│  │        │ patient_id (FK,UNIQUE)         │                │
│  │        │ ─── 27 FEATURE COLUMNS ───     │                │
│  │        │ is_elderly, has_diabetes,      │                │
│  │        │ has_chf, has_copd,             │                │
│  │        │ total_admissions, ...          │                │
│  │        │ frailty_score,                 │                │
│  │        │ complexity_index               │                │
│  │        │ feature_version                │                │
│  │        └────────────────────────────────┘                │
│  │                    │                                        │
│  │                    │ (1:many)                               │
│  │                    │                                        │
│  │        ┌───────────▼────────────────────┐                 │
│  │        │ predictions (9,000+3N)         │                 │
│  │        ├────────────────────────────────┤                 │
│  │        │ prediction_id (PK)             │                 │
│  │        │ patient_id (FK)                │                 │
│  │        │ prediction_window (30/60/90)   │                 │
│  │        │ risk_score (0.0-1.0)           │                 │
│  │        │ risk_tier (1-5)                │                 │
│  │        │ prediction_timestamp           │                 │
│  │        │ model_version                  │                 │
│  │        └────────────────────────────────┘                 │
│  │                    │                                        │
│  │                    │ (1:1)                                  │
│  │                    │                                        │
│  │        ┌───────────▼──────────────────────┐                │
│  │        │ financial_projections (9,000+3N) │                │
│  │        ├──────────────────────────────────┤                │
│  │        │ projection_id (PK)               │                │
│  │        │ prediction_id (FK)               │                │
│  │        │ patient_id (FK)                  │                │
│  │        │ annual_cost                      │                │
│  │        │ window_cost                      │                │
│  │        │ intervention_cost                │                │
│  │        │ expected_savings                 │                │
│  │        │ net_benefit                      │                │
│  │        │ roi_percent (0-100)              │                │
│  │        │ roi_category (EXCELLENT/etc)     │                │
│  │        │ calculation_timestamp            │                │
│  │        └──────────────────────────────────┘                │
│  │                                                              │
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  │
│  │                 MATERIALIZED VIEWS                         │
│  │  (Pre-calculated for fast frontend access)                │
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  │
│  │                                                              │
│  │  ┌──────────────────┐  ┌──────────────────┐                │
│  │  │ org_tier_summary │  │  roi_aggregations│                │
│  │  ├──────────────────┤  ├──────────────────┤                │
│  │  │ 15 rows          │  │ 3 rows           │                │
│  │  │ (window×tier)    │  │ (1 per window)   │                │
│  │  │ Shows: count,    │  │ Shows: avg_roi,  │                │
│  │  │ percentage       │  │ positive_count   │                │
│  │  └──────────────────┘  └──────────────────┘                │
│  │                                                              │
│  │  ┌────────────────────────┐                                │
│  │  │ positive_roi_patients  │                                │
│  │  ├────────────────────────┤                                │
│  │  │ 1,500-1,800 rows       │                                │
│  │  │ Shows: patient details │                                │
│  │  │ with positive ROI      │                                │
│  │  └────────────────────────┘                                │
│  │                                                              │
│  │  ┌──────────────────────────┐                              │
│  │  │ dept_risk_distribution   │                              │
│  │  ├──────────────────────────┤                              │
│  │  │ 50 rows (dept×tier)      │                              │
│  │  │ Shows: patients per dept │                              │
│  │  │ broken down by risk tier │                              │
│  │  └──────────────────────────┘                              │
│  │                                                              │
│  │  ┌──────────────────────────┐                              │
│  │  │ high_risk_by_department  │                              │
│  │  ├──────────────────────────┤                              │
│  │  │ 20 rows (10 depts×2 tier)│                              │
│  │  │ Shows: only Tier 4+5     │                              │
│  │  │ per department           │                              │
│  │  └──────────────────────────┘                              │
│  │                                                              │
│  └──────────────────────────────────────────────────────────┘
│
│  OPTIONAL AUDIT TABLES:
│  ┌─────────────────────────┐
│  │ new_patient_raw_input   │  (Stores raw input for audit)
│  ├─────────────────────────┤
│  │ raw_input_id (PK)       │
│  │ patient_id (FK)         │
│  │ input_json              │
│  └─────────────────────────┘
│
└──────────────────────────────────────────────────────────────┘
```

---

## 💾 Record Counts at Different Scales

```
BASELINE (Just X_test loaded):
├─ organizations: 1
├─ departments: 10
├─ patients: 3,000
├─ patient_features: 3,000
├─ predictions: 9,000
├─ financial_projections: 9,000
├─ View rows: org_tier_summary (15), roi_agg (3), dept_dist (50)
└─ Database size: ~5-6 MB

AFTER 1 MONTH (assuming 10 new patients/day):
├─ patients: 3,300
├─ predictions: 9,900
├─ financial_projections: 9,900
└─ Database size: ~6-7 MB

AFTER 1 YEAR (assuming 10 new patients/day):
├─ patients: 3,650
├─ predictions: 10,950
├─ financial_projections: 10,950
└─ Database size: ~7-8 MB

AFTER 5 YEARS (assuming 10 new patients/day):
├─ patients: 21,250
├─ predictions: 63,750
├─ financial_projections: 63,750
└─ Database size: ~40-50 MB
```

---

## 🔑 Key Decision Points (For Your Approval)

### Decision 1: Department Assignment Strategy
```
OPTION A: Condition-Based (RECOMMENDED) ✅
├─ Cardiology (CHF, ischemic heart)
├─ Nephrology (CKD, ESRD)
├─ Endocrinology (Diabetes)
├─ Pulmonology (COPD)
├─ Neurology (Stroke, Alzheimer's)
├─ Oncology (Cancer)
├─ Psychiatry (Depression)
├─ Rheumatology (Arthritis)
├─ Geriatrics (Elderly + complex)
└─ General Medicine (Everything else)
✅ Pros: Clinically meaningful, data-driven
❌ Cons: Requires condition mapping logic

OPTION B: Risk-Tier Based (FAST)
├─ Critical Care (Tier 5)
├─ ICU Monitoring (Tier 4)
├─ High Risk Outpatient (Tier 3)
├─ Standard Care (Tier 2)
└─ Wellness (Tier 1)
✅ Pros: Fastest implementation
❌ Cons: Not clinically meaningful

CHOOSE ONE FOR YOUR SETUP ⬅️
```

### Decision 2: Data Retention Policy
```
How long to keep new patients?
└─ Forever (recommended for analytics)
└─ 1 year (compliance requirement)
└─ 6 months (cost control)
└─ 3 months (minimal storage)

CHOOSE ONE ⬅️
```

### Decision 3: Audit Trail Requirement
```
Do you need to store raw input data?
├─ YES: Store new_patient_raw_input table
│  └─ Enables audit trail, can re-engineer if logic changes
└─ NO: Skip new_patient_raw_input table
   └─ Saves space, but can't audit original inputs

CHOOSE ONE ⬅️
```

### Decision 4: High-Risk Definition
```
How to define "High-Risk" for department alerts?
├─ OPTION A: Tier 4 + Tier 5 (both high and critical)
├─ OPTION B: Tier 5 only (critical only)
└─ OPTION C: Tier 4+ in ROI > 0% (high + positive intervention)

CHOOSE ONE ⬅️
```

### Decision 5: Multi-Organization Support
```
Do you anticipate multiple organizations in future?
├─ YES: Design with org_id everywhere (already in schema)
└─ NO: Simplify schema (remove org_id)

CHOOSE ONE ⬅️
```

---

## ✅ What You Get When Implemented

```
IMMEDIATE (After baseline load):
✅ 3,000 patients in database
✅ 27 features per patient searchable
✅ 9,000 predictions (3 windows)
✅ 9,000 ROI calculations
✅ Department distribution visible
✅ Tier distribution by window
✅ High-risk patients identified
✅ Organization dashboard ready

ONGOING (As new patients added):
✅ Auto-assignment to departments
✅ Instant predictions (3 windows)
✅ Instant ROI calculations
✅ Auto-updated dashboards
✅ Intervention target lists
✅ Compliance audit trail
✅ Historical trend tracking
```

---

**Status**: ✅ STRATEGY & RECOMMENDATIONS COMPLETE

**Next Phase**: Wait for your approval on the 5 decision points above, then implementation begins.
