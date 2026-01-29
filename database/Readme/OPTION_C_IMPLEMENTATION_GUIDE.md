# Option C Implementation Guide: Hybrid Department Assignment

**Date**: January 29, 2026  
**Decision**: APPROVED - Option C: Hybrid (Clinical + Risk-Tier)  
**Status**: Ready for Implementation  

---

## 🎯 Option C Strategy Overview

### What This Means:
```
Step 1: Assign to CLINICAL department based on PRIMARY condition
        └─ Cardiology, Nephrology, Endocrinology, etc. (10 departments)

Step 2: TRACK risk_tier ALONGSIDE department
        └─ Each patient has BOTH clinical_dept AND risk_tier (1-5)

Result: BOTH clinical meaning AND risk stratification in ONE system!

Benefits:
✅ Clinically meaningful (real hospital departments)
✅ Risk-aware (know high-risk vs normal-risk in each dept)
✅ Intervention-ready (target high-risk cardiologists, etc.)
✅ Flexible reporting (can group by dept, by tier, or both)
```

---

## 📊 Expected Distribution with Option C

### Department Assignment (By Primary Condition):

```
┌──────────────────────────────────────────────────────────────┐
│           CLINICAL DEPARTMENT ASSIGNMENT (PRIMARY)            │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  1. CARDIOLOGY (CHF + Ischemic Heart Disease)                 │
│     Expected patients: ~800-1,000 (27-33%)                    │
│     ├─ has_chf = 1 OR has_ischemic_heart = 1                  │
│     └─ Rationale: Cardiac patients need specialized care      │
│                                                                │
│  2. NEPHROLOGY (CKD + ESRD)                                   │
│     Expected patients: ~600-800 (20-27%)                      │
│     ├─ has_ckd = 1 OR has_esrd = 1                            │
│     └─ Rationale: Kidney disease management                   │
│                                                                │
│  3. ENDOCRINOLOGY (Diabetes - if not in Cardio/Nephro)        │
│     Expected patients: ~400-600 (13-20%)                      │
│     ├─ has_diabetes = 1 (AND not already in 1-2)              │
│     └─ Rationale: Diabetes management                         │
│                                                                │
│  4. PULMONOLOGY (COPD - if not in above)                      │
│     Expected patients: ~200-300 (7-10%)                       │
│     ├─ has_copd = 1 (AND not already in 1-3)                  │
│     └─ Rationale: Respiratory care                            │
│                                                                │
│  5. NEUROLOGY (Stroke + Alzheimer's)                          │
│     Expected patients: ~150-250 (5-8%)                        │
│     ├─ has_stroke = 1 OR has_alzheimers = 1                   │
│     └─ Rationale: Neurological conditions                     │
│                                                                │
│  6. ONCOLOGY (Cancer - if not in above)                       │
│     Expected patients: ~100-150 (3-5%)                        │
│     ├─ has_cancer = 1 (AND not already in 1-5)                │
│     └─ Rationale: Cancer treatment                            │
│                                                                │
│  7. PSYCHIATRY (Depression - if not in above)                 │
│     Expected patients: ~100-150 (3-5%)                        │
│     ├─ has_depression = 1 (AND not already in 1-6)            │
│     └─ Rationale: Mental health                               │
│                                                                │
│  8. RHEUMATOLOGY (Arthritis - if not in above)                │
│     Expected patients: ~50-100 (2-3%)                         │
│     ├─ has_ra_oa = 1 (AND not already in 1-7)                 │
│     └─ Rationale: Arthritis/joint care                        │
│                                                                │
│  9. GERIATRICS (Elderly + High Complexity)                    │
│     Expected patients: ~200-300 (7-10%)                       │
│     ├─ age > 75 AND complexity_index > 5                      │
│     └─ Rationale: Elderly multi-morbidity                     │
│                                                                │
│  10. GENERAL MEDICINE (No primary condition)                  │
│      Expected patients: ~300-500 (10-17%)                     │
│      ├─ Everything else OR multiple equally severe            │
│      └─ Rationale: General preventive care                    │
│                                                                │
│  TOTAL: 3,000 patients distributed across 10 departments      │
└──────────────────────────────────────────────────────────────┘
```

### Risk Tier Distribution WITHIN Each Department:

```
CARDIOLOGY breakdown (example):
├─ Tier 1 (Normal): ~300 patients (37.5%)
├─ Tier 2 (Low Risk): ~250 patients (31.25%)
├─ Tier 3 (Moderate): ~150 patients (18.75%)
├─ Tier 4 (High Risk): ~80 patients (10%)
└─ Tier 5 (Critical): ~20 patients (2.5%)
   TOTAL CARDIOLOGY: ~800 patients

NEPHROLOGY breakdown:
├─ Tier 1 (Normal): ~200 patients (33%)
├─ Tier 2 (Low Risk): ~200 patients (33%)
├─ Tier 3 (Moderate): ~120 patients (20%)
├─ Tier 4 (High Risk): ~60 patients (10%)
└─ Tier 5 (Critical): ~20 patients (3%)
   TOTAL NEPHROLOGY: ~600 patients

... (similar breakdown for all 10 departments)
```

---

## 🗂️ Database Implementation for Option C

### Table Structure (Slightly Updated):

```
patients table:
├─ patient_id (PK)
├─ external_id (BIGINT)
├─ department_id (FK → departments) ← CLINICAL DEPARTMENT
├─ age, gender, race
├─ annual_cost, cost_percentile
└─ data_source ('X_TEST' | 'NEW_PATIENT')

predictions table (unchanged):
├─ prediction_id (PK)
├─ patient_id (FK)
├─ prediction_window ('30_day', '60_day', '90_day')
├─ risk_score (0.0-1.0)
├─ risk_tier (1-5) ← RISK TIER
└─ prediction_timestamp

Result: Each patient has BOTH:
├─ Clinical Department (via department_id in patients table)
└─ Risk Tier (via risk_tier in predictions table)
```

### Materialized Views for Option C:

**View 1: dept_risk_distribution** (50 rows = 10 depts × 5 tiers)
```
Shows patient count per department × per risk tier

Query:
SELECT 
    d.department_id,
    d.department_name,
    p.risk_tier,
    COUNT(DISTINCT p.patient_id) as patient_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) 
        OVER (PARTITION BY d.department_id), 2) as percentage_within_dept
FROM patients pat
JOIN departments d ON pat.department_id = d.department_id
JOIN predictions p ON pat.patient_id = p.patient_id
WHERE p.prediction_window = '30_day'
GROUP BY d.department_id, d.department_name, p.risk_tier
ORDER BY d.department_id, p.risk_tier;

Example Output:
┌─────────────┬───────────────────┬──────┬───────────┬──────────────────┐
│ dept_id     │ department_name    │ tier │ count     │ percent_in_dept  │
├─────────────┼───────────────────┼──────┼───────────┼──────────────────┤
│ 1           │ CARDIOLOGY        │  1   │ 300       │       37.5%      │
│ 1           │ CARDIOLOGY        │  2   │ 250       │       31.25%     │
│ 1           │ CARDIOLOGY        │  3   │ 150       │       18.75%     │
│ 1           │ CARDIOLOGY        │  4   │ 80        │       10.0%      │
│ 1           │ CARDIOLOGY        │  5   │ 20        │        2.5%      │
│ 2           │ NEPHROLOGY        │  1   │ 200       │       33.3%      │
│ 2           │ NEPHROLOGY        │  2   │ 200       │       33.3%      │
│ ... (40 more rows)                                                     │
└─────────────┴───────────────────┴──────┴───────────┴──────────────────┘
```

**View 2: high_risk_by_department** (20 rows = 10 depts × 2 tiers: Tier 4+5)
```
Shows only high-risk (Tier 4) and critical (Tier 5) patients per department

Query:
SELECT 
    d.department_id,
    d.department_name,
    p.risk_tier,
    COUNT(DISTINCT p.patient_id) as high_risk_count
FROM patients pat
JOIN departments d ON pat.department_id = d.department_id
JOIN predictions p ON pat.patient_id = p.patient_id
WHERE p.prediction_window = '30_day'
  AND p.risk_tier IN (4, 5)
GROUP BY d.department_id, d.department_name, p.risk_tier
ORDER BY d.department_id, p.risk_tier DESC;

Example Output:
┌─────────────┬───────────────────┬──────┬──────────────────┐
│ dept_id     │ department_name    │ tier │ high_risk_count  │
├─────────────┼───────────────────┼──────┼──────────────────┤
│ 1           │ CARDIOLOGY        │  4   │  80              │
│ 1           │ CARDIOLOGY        │  5   │  20              │
│ 2           │ NEPHROLOGY        │  4   │  60              │
│ 2           │ NEPHROLOGY        │  5   │  20              │
│ 3           │ ENDOCRINOLOGY     │  4   │  40              │
│ 3           │ ENDOCRINOLOGY     │  5   │  15              │
│ ... (14 more rows)                                         │
└─────────────┴───────────────────┴──────┴──────────────────┘

TOTAL HIGH-RISK ALERTS: ~200-250 patients across all departments
```

**View 3: dept_performance** (NEW - For Option C analysis)
```
Shows department-level ROI + risk profile

Query:
SELECT 
    d.department_id,
    d.department_name,
    COUNT(DISTINCT pat.patient_id) as total_patients,
    ROUND(AVG(CASE WHEN p.risk_tier IN (4,5) THEN 1 ELSE 0 END) * 100, 2) 
        as percent_high_risk,
    ROUND(AVG(fp.roi_percent), 2) as avg_roi,
    COUNT(DISTINCT CASE WHEN fp.roi_percent > 0 THEN pat.patient_id END) 
        as positive_roi_count
FROM patients pat
JOIN departments d ON pat.department_id = d.department_id
JOIN predictions p ON pat.patient_id = p.patient_id 
    AND p.prediction_window = '30_day'
LEFT JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
GROUP BY d.department_id, d.department_name
ORDER BY percent_high_risk DESC;

Example Output:
┌─────────────┬───────────────────┬────────────────┬─────────────┬──────────┐
│ dept_id     │ department_name    │ total_patients │ high_risk%  │ avg_roi  │
├─────────────┼───────────────────┼────────────────┼─────────────┼──────────┤
│ 5           │ NEUROLOGY         │ 200            │ 12.5%       │  87.3%   │
│ 1           │ CARDIOLOGY        │ 800            │ 10.0%       │  84.5%   │
│ 2           │ NEPHROLOGY        │ 600            │  9.5%       │  86.2%   │
│ ... (7 more departments)                                                 │
└─────────────┴───────────────────┴────────────────┴─────────────┴──────────┘
```

---

## 🔄 Implementation Algorithm for Option C

### Department Assignment Logic (Python Pseudocode):

```python
def assign_department_option_c(patient_features):
    """
    Assign patient to clinical department based on PRIMARY condition
    Option C: Hybrid - Clinical Department + Risk Tier tracking
    """
    
    # Priority order (check in order, stop at first match)
    
    if patient_features['has_chf'] == 1 or patient_features['has_ischemic_heart'] == 1:
        return 'CARDIOLOGY'
    
    elif patient_features['has_ckd'] == 1 or patient_features['has_esrd'] == 1:
        return 'NEPHROLOGY'
    
    elif patient_features['has_diabetes'] == 1:
        return 'ENDOCRINOLOGY'
    
    elif patient_features['has_copd'] == 1:
        return 'PULMONOLOGY'
    
    elif patient_features['has_stroke'] == 1 or patient_features['has_alzheimers'] == 1:
        return 'NEUROLOGY'
    
    elif patient_features['has_cancer'] == 1:
        return 'ONCOLOGY'
    
    elif patient_features['has_depression'] == 1:
        return 'PSYCHIATRY'
    
    elif patient_features['has_ra_oa'] == 1:
        return 'RHEUMATOLOGY'
    
    elif patient_features['age'] > 75 and patient_features['complexity_index'] > 5:
        return 'GERIATRICS'
    
    else:
        return 'GENERAL_MEDICINE'
```

### Data Loading Process:

```
Step 1: Load X_test.csv
Step 2: For each patient:
    a. Extract demographics (age, gender, race, cost)
    b. Extract all 27 features
    c. Call assign_department_option_c() → Get department_id
    d. INSERT into patients table with department_id
    e. INSERT into patient_features table with 27 columns

Step 3: Run ML predictions
    For each patient:
    a. Load 27 features from patient_features
    b. Run through 3 ML models (30, 60, 90 day)
    c. Get risk_scores (0-1)
    d. Convert to risk_tiers (1-5)
    e. INSERT into predictions table (3 records per patient)

Step 4: Calculate ROI
    For each of 9,000 predictions:
    a. Get window_cost, intervention_cost, success_rate
    b. Calculate expected_savings, net_benefit, roi_percent
    c. INSERT into financial_projections

Step 5: Refresh materialized views
    - dept_risk_distribution (50 rows)
    - high_risk_by_department (20 rows)
    - dept_performance (10 rows)
    - org_tier_summary (15 rows)
    - roi_aggregations (3 rows)
    - positive_roi_patients (1,500-1,800 rows)

COMPLETE: Database ready!
```

---

## 📊 Key Metrics for Option C

### Organization-Wide View:
```
Total Patients: 3,000
Total Predictions: 9,000 (3 per patient)
Total ROI Calculations: 9,000

Department Count: 10
Risk Tier Combinations: 50 (10 depts × 5 tiers)
High-Risk Combinations: 20 (10 depts × 2 high tiers)

High-Risk Patients Overall: ~200-250 (7-8%)
├─ Distributed across 10 departments
└─ Can see which dept has most high-risk

Positive ROI Patients: ~1,500-1,800 (50-60%)
├─ Distributed across 10 departments
└─ Can target by dept + tier
```

### Department-Level View (Example - Cardiology):
```
CARDIOLOGY DEPARTMENT:
├─ Total Patients: ~800
├─ Risk Tier Breakdown:
│  ├─ Tier 1 (Normal): 300 (37.5%)
│  ├─ Tier 2 (Low): 250 (31.25%)
│  ├─ Tier 3 (Moderate): 150 (18.75%)
│  ├─ Tier 4 (High): 80 (10%)
│  └─ Tier 5 (Critical): 20 (2.5%)
│
├─ High-Risk Count: 100 (Tier 4+5)
├─ Positive ROI Count: ~480 (60%)
├─ Average ROI: ~84.5%
└─ Recommended Interventions:
   ├─ Critical focus on 80 Tier 4 patients
   ├─ Monitor 20 Tier 5 patients weekly
   └─ Enroll 480 Tier 1-3 with positive ROI
```

---

## 🎨 Dashboard Views for Option C

### Dashboard 1: Organization Overview
```
┌─────────────────────────────────────────────────┐
│    ORGANIZATION DASHBOARD (3,000 patients)      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tier Distribution (30-day window):             │
│  ├─ Tier 1 (Normal): 1,950 (65%)               │
│  ├─ Tier 2 (Low): 600 (20%)                     │
│  ├─ Tier 3 (Moderate): 300 (10%)               │
│  ├─ Tier 4 (High): 120 (4%)                     │
│  └─ Tier 5 (Critical): 30 (1%)                  │
│                                                 │
│  Organization ROI:                              │
│  ├─ Average ROI: 87.5%                         │
│  ├─ Positive ROI: 1,800 (60%)                  │
│  └─ Investment: $450K / month                   │
│                                                 │
│  [Pie Chart] [Line Chart] [Table]               │
└─────────────────────────────────────────────────┘
```

### Dashboard 2: Department Comparison
```
┌──────────────────────────────────────────────────┐
│     DEPARTMENT DASHBOARD (Compare all 10)        │
├──────────────────────────────────────────────────┤
│                                                  │
│ Rank │ Department      │ Patients │ High-Risk │ │
│ ─────┼─────────────────┼──────────┼───────────│ │
│  1   │ CARDIOLOGY      │ 800      │ 100       │ │
│  2   │ NEPHROLOGY      │ 600      │ 80        │ │
│  3   │ ENDOCRINOLOGY   │ 500      │ 40        │ │
│  4   │ PULMONOLOGY     │ 250      │ 30        │ │
│  5   │ GERIATRICS      │ 250      │ 28        │ │
│  6   │ NEUROLOGY       │ 200      │ 20        │ │
│  7   │ PSYCHIATRY      │ 125      │ 12        │ │
│  8   │ ONCOLOGY        │ 125      │ 10        │ │
│  9   │ RHEUMATOLOGY    │ 75       │ 8         │ │
│ 10   │ GENERAL_MEDICINE│ 400      │ 24        │ │
│                                                  │
│ [Bar Chart] [Heatmap] [Details Button]          │
└──────────────────────────────────────────────────┘
```

### Dashboard 3: Department Drill-Down (Example - Cardiology)
```
┌────────────────────────────────────────────────────┐
│  CARDIOLOGY DEPARTMENT (800 patients)              │
├────────────────────────────────────────────────────┤
│                                                    │
│ Risk Tier Breakdown:                               │
│ ├─ Tier 1: 300 (37.5%) - Normal Risk              │
│ ├─ Tier 2: 250 (31.25%) - Low Risk                │
│ ├─ Tier 3: 150 (18.75%) - Moderate Risk           │
│ ├─ Tier 4: 80 (10%) - HIGH RISK ⚠️                │
│ └─ Tier 5: 20 (2.5%) - CRITICAL RISK 🚨           │
│                                                    │
│ High-Risk Alert: 100 patients need intervention   │
│ Positive ROI: 480 patients (60%)                  │
│ Department ROI: 84.5% average                     │
│                                                    │
│ [Risk Distribution Chart]                         │
│ [Patient List] [Export] [Intervention Plan]       │
└────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist for Option C

### Phase 1: Schema Setup (Day 1)
```
□ Create departments table (10 rows)
  ├─ CARDIOLOGY, NEPHROLOGY, ENDOCRINOLOGY, PULMONOLOGY
  ├─ NEUROLOGY, ONCOLOGY, PSYCHIATRY, RHEUMATOLOGY
  ├─ GERIATRICS, GENERAL_MEDICINE
  └─ Index on department_id

□ Create patients table (updated)
  ├─ Add department_id (FK → departments)
  ├─ Add data_source flag
  └─ Indexes on (department_id, data_source)

□ Create patient_features table (27 columns)
  └─ Index on complexity_index, frailty_score

□ Create predictions table (30/60/90 day)
  ├─ risk_score (0-1)
  ├─ risk_tier (1-5)
  └─ Indexes on (patient_id, prediction_window, risk_tier)

□ Create financial_projections table
  ├─ roi_percent, roi_category
  └─ Index on (patient_id, roi_percent)

□ Create materialized views
  ├─ org_tier_summary (15 rows)
  ├─ dept_risk_distribution (50 rows)
  ├─ high_risk_by_department (20 rows)
  ├─ dept_performance (10 rows)
  ├─ roi_aggregations (3 rows)
  └─ positive_roi_patients (1,500-1,800 rows)
```

### Phase 2: Data Loading (Day 2)
```
□ Load X_test.csv (3,000 patients)
  ├─ Parse demographics, costs, features
  ├─ Call assign_department_option_c() for each patient
  ├─ INSERT into patients with department_id
  └─ INSERT 27 features into patient_features

□ Verify loads
  ├─ patients table: 3,000 rows
  ├─ patient_features table: 3,000 rows
  ├─ All 10 departments have patients
  └─ No NULLs in critical fields
```

### Phase 3: Predictions (Day 3)
```
□ Run ML models on 3,000 patients
  ├─ 3 models × 3,000 patients = 9,000 predictions
  ├─ Convert risk_score (0-1) to risk_tier (1-5)
  ├─ INSERT into predictions table
  └─ Verify 9,000 records

□ Calculate ROI for 9,000 predictions
  ├─ Get intervention costs by tier
  ├─ Calculate expected savings
  ├─ Calculate roi_percent (0-100%)
  ├─ INSERT into financial_projections
  └─ Verify 9,000 records
```

### Phase 4: Materialized Views (Day 3)
```
□ Refresh materialized views
  ├─ org_tier_summary: Should have 15 rows
  ├─ dept_risk_distribution: Should have 50 rows
  ├─ high_risk_by_department: Should have 20 rows
  ├─ dept_performance: Should have 10 rows
  ├─ roi_aggregations: Should have 3 rows
  └─ positive_roi_patients: Should have 1,500-1,800 rows

□ Test view queries
  ├─ All return < 100ms
  └─ Data looks reasonable
```

### Phase 5: New Patient Integration (Days 4-5)
```
□ Update new patient pipeline
  ├─ Parse raw input
  ├─ Engineer to 27 features
  ├─ Call assign_department_option_c()
  ├─ INSERT into patients with assigned department
  ├─ INSERT into patient_features
  ├─ Run predictions (3 windows)
  ├─ Calculate ROI (3 windows)
  └─ Refresh materialized views

□ Test with 10 mock patients
  ├─ Verify all records inserted
  ├─ Verify department assignments
  ├─ Verify predictions generated
  ├─ Verify ROI calculated
  └─ Verify views updated
```

---

## 🎯 Advantages of Option C (Why This Is Best)

```
Compared to Option A (Clinical Only):
✅ +  Same clinical meaning
✅ +  PLUS risk-aware (can prioritize high-risk per dept)
✅ +  Better intervention targeting
✅ +  Enables dept-specific risk management

Compared to Option B (Risk-Tier Only):
✅ +  Real clinical departments (not just risk levels)
✅ +  Department heads can manage their own cohort
✅ +  Can route to specialists
✅ +  Better for real-world hospital workflows

Overall:
✅ Best of both worlds
✅ Scalable to multiple organizations
✅ Ready for real-world deployment
✅ Enables sophisticated analytics
```

---

## 📋 Summary: Option C Implementation

**What You've Chosen:**
- ✅ Assign patients to 10 CLINICAL departments (primary condition)
- ✅ TRACK risk tiers (1-5) alongside departments
- ✅ Create views showing dept × tier combinations
- ✅ Enable department-specific high-risk alerts
- ✅ Department heads manage own cohort's risk profile

**Database Changes:**
- ✅ Add department_id to patients table
- ✅ Keep risk_tier in predictions table
- ✅ Create 6 materialized views (including dept × tier views)
- ✅ No new tables needed (only 1 new column)

**Implementation Timeline:**
- Phase 1: Schema setup (1 day)
- Phase 2: Load 3K patients (1 day)
- Phase 3: Run predictions & ROI (1 day)
- Phase 4: Setup new patient flow (2 days)
- Phase 5: Dashboard development (3-5 days)
- **TOTAL**: 1-2 weeks

**Ready for Next Step:**
Once you confirm this implementation guide, I can:
1. Create SQL schema file (with department assignment logic)
2. Create Python loader script (with assign_department_option_c function)
3. Create dashboard queries (for all 3 dashboard types above)
4. Start Phase 1 of implementation

---

**Status**: ✅ OPTION C APPROVED & DOCUMENTED

**Next Step**: Approve this implementation plan, then we start Phase 1 (Schema Creation)
