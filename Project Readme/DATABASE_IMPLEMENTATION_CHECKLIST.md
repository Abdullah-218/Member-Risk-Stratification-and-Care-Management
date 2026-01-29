# PostgreSQL Implementation Checklist & Schema Relationships

## 📐 Entity-Relationship Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HEALTHCARE RISK ML SCHEMA                    │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │    DEPARTMENTS   │
                              ├──────────────────┤
                              │ department_id PK │
                              │ department_name  │
                              │ department_code  │
                              │ department_head  │
                              └────────┬─────────┘
                                       │
                                       │ 1:M
                                       │
                          ┌────────────┴──────────────┐
                          │                           │
                          ▼                           ▼
        ┌──────────────────────────┐    ┌──────────────────────────┐
        │       PATIENTS           │    │    PATIENT_FEATURES      │
        ├──────────────────────────┤    ├──────────────────────────┤
        │ patient_id        PK     │───►│ patient_id        FK,UQ  │
        │ patient_uuid      UQ     │    │ has_alzheimers           │
        │ external_id       UQ     │    │ has_chf                  │
        │ age                      │    │ ... (25 more features)   │
        │ gender                   │    │ complexity_index         │
        │ race                     │    │ frailty_score            │
        │ department_id     FK     │    └──────────────────────────┘
        │ annual_cost              │
        │ data_source              │ ◄──┐
        │ created_at               │    │
        └────┬─────────────────────┘    │
             │                          │
             │ 1:M                      │
             │                          │
    ┌────────┴────────────────────────┐│
    │                                 ││
    ▼                                 ││
┌──────────────────────────┐          ││
│     PREDICTIONS          │          ││
├──────────────────────────┤          ││
│ prediction_id      PK    │          ││
│ patient_id         FK    │──────────┘│
│ prediction_window        │           │
│ risk_score               │           │
│ risk_tier (1-5)          │           │
│ tier_label               │           │
│ model_version            │           │
│ is_high_risk (GENERATED) │           │
│ is_critical_risk (GEN)   │           │
│ created_by               │           │
│ prediction_timestamp     │ ◄─────────┘
└────┬─────────────────────┘


         ┌────────────────────────────┐
         │ FINANCIAL_PROJECTIONS      │
         ├────────────────────────────┤
         │ projection_id       PK     │
         │ patient_id          FK     │
         │ prediction_id       FK     │
         │ projection_window          │
         │ annual_cost                │
         │ window_cost (GENERATED)    │
         │ addressable_cost (GEN)     │
         │ intervention_cost          │
         │ success_rate_actual        │
         │ expected_savings (GEN)     │
         │ net_benefit (GEN)          │
         │ roi_percentage (GEN)       │
         │ roi_category (GEN)         │
         └────────────────────────────┘
                    ▲
                    │
                    │ Links
                    │
         ┌──────────────────────────┐
         │      AUDIT_LOG           │
         ├──────────────────────────┤
         │ log_id           PK      │
         │ event_type               │
         │ entity_type              │
         │ entity_id         FK     │
         │ old_values (JSON)        │
         │ new_values (JSON)        │
         │ changed_by               │
         │ changed_at               │
         └──────────────────────────┘


MATERIALIZED VIEWS (Pre-calculated Analytics):
┌─────────────────────────────────────────────────────────┐
│ ORG_TIER_SUMMARY                                        │
│ (Count patients per tier per window)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ DEPT_RISK_DISTRIBUTION                                  │
│ (High/critical count per department per window)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ROI_POSITIVE_PATIENTS                                   │
│ (All patients with positive ROI, ranked by grade)       │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Table Relationships & Cardinality

### Primary Relationships

| From | To | Type | Condition |
|------|----|----|-----------|
| **DEPARTMENTS** | PATIENTS | 1:M | One dept has many patients |
| **PATIENTS** | PATIENT_FEATURES | 1:1 | One patient has one feature vector |
| **PATIENTS** | PREDICTIONS | 1:M | One patient has many predictions (3 windows × multiple runs) |
| **PREDICTIONS** | FINANCIAL_PROJECTIONS | 1:1 | One prediction has one ROI calculation |
| **PATIENTS/PREDICTIONS** | AUDIT_LOG | 1:M | Every change logged |

---

## 📋 Step-by-Step Implementation Checklist

### Phase 1: Schema Creation (1-2 hours)

- [ ] **1.1 Create departments table**
  ```sql
  CREATE TABLE departments (...)
  ```
  Dependency: None
  Expected rows: 5-50

- [ ] **1.2 Create patients table**
  ```sql
  CREATE TABLE patients (...)
  ```
  Dependency: departments (foreign key)
  Expected rows: 3,000 baseline + X new

- [ ] **1.3 Create patient_features table**
  ```sql
  CREATE TABLE patient_features (...)
  ```
  Dependency: patients (foreign key)
  Expected rows: 3,000 baseline + X new
  Note: 1:1 with patients

- [ ] **1.4 Create predictions table**
  ```sql
  CREATE TABLE predictions (...)
  ```
  Dependency: patients (foreign key)
  Expected rows: 3,000 × 3 windows = 9,000 (plus re-predictions)

- [ ] **1.5 Create financial_projections table**
  ```sql
  CREATE TABLE financial_projections (...)
  ```
  Dependency: patients, predictions (foreign keys)
  Expected rows: 3,000 × 3 windows = 9,000 (plus re-projections)

- [ ] **1.6 Create audit_log table**
  ```sql
  CREATE TABLE audit_log (...)
  ```
  Dependency: None
  Expected rows: High volume (1000s over time)

- [ ] **1.7 Add all indexes**
  ```sql
  CREATE INDEX idx_... ON ... (...)
  ```

- [ ] **1.8 Add all constraints**
  ```sql
  ALTER TABLE ... ADD CONSTRAINT ...
  ```

---

### Phase 2: Data Loading (1-3 hours)

- [ ] **2.1 Populate departments table**
  - Source: Manual SQL inserts
  - Check: `SELECT COUNT(*) FROM departments;`
  - Expected: 5-50 rows

- [ ] **2.2 Load X_test patients into patients table**
  - Source: Python script reading X_test.csv
  - Method: Batch INSERT or COPY command
  - Check: `SELECT COUNT(*) FROM patients WHERE data_source='X_TEST';`
  - Expected: 3,000 rows
  - Note: Need to assign department_id (how?)

- [ ] **2.3 Load features into patient_features table**
  - Source: X_test.csv (same 3,000 patients)
  - Method: Python script or CSV COPY
  - Check: `SELECT COUNT(*) FROM patient_features;`
  - Expected: 3,000 rows (1:1 with patients)

- [ ] **2.4 Validate referential integrity**
  ```sql
  SELECT COUNT(*) FROM patients p
  LEFT JOIN patient_features pf ON p.patient_id = pf.patient_id
  WHERE pf.patient_id IS NULL;  -- Should be 0
  ```

---

### Phase 3: Model Predictions (2-4 hours)

- [ ] **3.1 Create Python script for batch predictions**
  - Input: All 3,000 patients from patient_features table
  - Process: For each patient + each window (30/60/90):
    - Load patient_id + 27 features
    - Run through model
    - Calculate risk_score + tier
    - Store in predictions table
  - Output: 9,000 prediction records (3,000 × 3 windows)

- [ ] **3.2 Run predictions**
  - Command: `python predict_and_store.py`
  - Check: `SELECT COUNT(*) FROM predictions;`
  - Expected: 9,000 rows (or 3,000 if you deduplicate per window)

- [ ] **3.3 Verify prediction data**
  ```sql
  SELECT prediction_window, COUNT(*) 
  FROM predictions 
  GROUP BY prediction_window;
  -- Expected: 30_day: 3000, 60_day: 3000, 90_day: 3000
  
  SELECT risk_tier, COUNT(*)
  FROM predictions
  GROUP BY risk_tier;
  -- Sanity check: distribution roughly matches training data
  ```

---

### Phase 4: ROI Calculations (1-2 hours)

- [ ] **4.1 Create Python script for ROI calculations**
  - Input: All predictions from predictions table
  - For each prediction:
    - Load patient annual_cost
    - Look up tier-specific intervention_cost
    - Calculate window_cost, addressable_cost
    - Sample success_rate from tier range
    - Calculate savings + ROI
    - Store in financial_projections
  - Output: 9,000 ROI records

- [ ] **4.2 Run ROI calculations**
  - Command: `python calculate_roi.py`
  - Check: `SELECT COUNT(*) FROM financial_projections;`
  - Expected: 9,000 rows

- [ ] **4.3 Verify ROI data**
  ```sql
  SELECT 
    projection_window,
    roi_category,
    COUNT(*) as count
  FROM financial_projections
  GROUP BY projection_window, roi_category;
  -- Check distribution of POSITIVE vs NEGATIVE ROI
  
  SELECT 
    ROUND(AVG(roi_percentage), 2) as avg_roi,
    MIN(roi_percentage) as min_roi,
    MAX(roi_percentage) as max_roi
  FROM financial_projections;
  ```

---

### Phase 5: Materialized Views (1 hour)

- [ ] **5.1 Create ORG_TIER_SUMMARY view**
  ```sql
  CREATE MATERIALIZED VIEW org_tier_summary AS ...
  ```

- [ ] **5.2 Create DEPT_RISK_DISTRIBUTION view**
  ```sql
  CREATE MATERIALIZED VIEW dept_risk_distribution AS ...
  ```

- [ ] **5.3 Create ROI_POSITIVE_PATIENTS view**
  ```sql
  CREATE MATERIALIZED VIEW roi_positive_patients AS ...
  ```

- [ ] **5.4 Initial refresh of views**
  ```sql
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dept_risk_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY roi_positive_patients;
  ```

---

### Phase 6: Audit Logging Setup (30 min)

- [ ] **6.1 Create trigger for patient additions**
  ```sql
  CREATE TRIGGER audit_patient_insert
  AFTER INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION log_patient_addition();
  ```

- [ ] **6.2 Create trigger for predictions**
  ```sql
  CREATE TRIGGER audit_prediction_insert
  AFTER INSERT ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION log_prediction();
  ```

- [ ] **6.3 Test audit logging**
  ```sql
  INSERT INTO patients (...) VALUES (...);
  SELECT * FROM audit_log WHERE event_type='PATIENT_ADDED';
  ```

---

### Phase 7: Query Optimization (1-2 hours)

- [ ] **7.1 Analyze query plans**
  ```sql
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT * FROM predictions 
  WHERE patient_id = 123 AND prediction_window = '30_day';
  ```

- [ ] **7.2 Verify index usage**
  - All composite indexes used
  - No full table scans on large tables

- [ ] **7.3 Performance baseline**
  - Time 10 common queries
  - Document results for future comparison

---

### Phase 8: Testing (1-2 hours)

- [ ] **8.1 Test data integrity**
  ```sql
  -- All patients have features
  SELECT COUNT(*) FROM patients p
  WHERE NOT EXISTS (SELECT 1 FROM patient_features WHERE patient_id = p.patient_id);
  -- Should return 0
  
  -- All predictions valid
  SELECT COUNT(*) FROM predictions WHERE risk_score NOT BETWEEN 0 AND 1;
  -- Should return 0
  ```

- [ ] **8.2 Test referential integrity**
  ```sql
  -- No orphaned predictions
  SELECT COUNT(*) FROM predictions p
  WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_id = p.patient_id);
  -- Should return 0
  ```

- [ ] **8.3 Test new patient insertion**
  - Insert 1 new patient via Python script
  - Verify in all tables
  - Check audit log

- [ ] **8.4 Test model re-prediction**
  - Run predictions again with "new" model version
  - Verify old + new predictions both in DB
  - Compare results

---

## 🔧 Configuration Options Summary

### Q1: Department Assignment Strategy for 3K X_test

**Option A: Random Assignment (Simplest)**
```python
import random
patients_df['department_id'] = patients_df.apply(
    lambda x: random.randint(1, 5)  # Assuming 5 departments
)
```
Pro: Simple, balanced
Con: No medical logic

**Option B: Condition-Based Assignment (Recommended)**
```python
def assign_department(row):
    if row['has_chf'] == 1 or row['has_ischemic_heart'] == 1:
        return 1  # Cardiology
    elif row['has_cancer'] == 1:
        return 2  # Oncology
    elif row['has_ckd'] == 1 or row['has_diabetes'] == 1:
        return 3  # Nephrology
    elif row['has_copd'] == 1:
        return 4  # Pulmonology
    else:
        return 5  # General

patients_df['department_id'] = patients_df.apply(assign_department, axis=1)
```
Pro: Clinically meaningful
Con: Slightly more complex

**Option C: Cost-Based Assignment (Advanced)**
```python
def assign_by_cost(row):
    if row['annual_cost'] > 50000:
        return 1  # Cardiology (high cost)
    elif row['annual_cost'] > 25000:
        return 2  # Oncology
    elif row['annual_cost'] > 10000:
        return 3  # Nephrology
    else:
        return 4  # General
```
Pro: Focuses resources on high-cost patients
Con: Ignores clinical conditions

**Recommendation**: Use **Option B** (condition-based). Makes clinical sense and allows department-specific analyses.

---

### Q2: Real-time vs Batch Prediction

**Option A: Real-time (On-demand)**
```
New patient added → Immediately run predictions → Store in DB
Latency: ~100-500ms per patient
```
Best for: Interactive dashboards, immediate decision-making

**Option B: Batch Processing (Scheduled)**
```
New patients queued → Run 100 at a time every hour → Store in DB
Latency: Up to 1 hour
```
Best for: High volume, resource-constrained environments

**Recommendation**: Start with **Option A** (real-time). Easier to implement, better UX. Scale to Option B if performance issues.

---

### Q3: Prediction History (Keep All or Latest Only?)

**Option A: Keep All (Recommended)**
```
Patient 123 predicts on Jan 29 → Store
Patient 123 predicts on Jan 30 → Store new + keep old
Over time: 100+ predictions per patient (audit trail)
```
Pros: Full audit trail, can track prediction drift
Cons: Larger database, slower queries

**Option B: Keep Latest Only**
```
Patient 123 predicts on Jan 29 → Store
Patient 123 predicts on Jan 30 → Delete Jan 29, store Jan 30
Over time: Only 1 prediction per patient per window
```
Pros: Smaller database, faster queries
Cons: Can't track changes over time

**Recommendation**: **Keep all in predictions table** (cheap storage, useful for analysis). Create a `latest_predictions` view for common queries.

```sql
CREATE VIEW latest_predictions AS
SELECT DISTINCT ON (patient_id, prediction_window) *
FROM predictions
ORDER BY patient_id, prediction_window, prediction_timestamp DESC;
```

---

### Q4: Cost Data Update Frequency

**Option A: Static (Load Once)**
```
Load annual_cost on Jan 29
Use for all predictions indefinitely
No updates
```
Best for: Development/testing

**Option B: Monthly Update**
```
First of each month: Pull updated costs from EHR
Update annual_cost in patients table
Re-run ROI calculations
```
Best for: Production (realistic cost changes)

**Option C: Real-time Sync**
```
EHR sends cost updates → Trigger Python script → Update DB
Every patient update triggers ROI recalculation
```
Best for: Premium systems requiring live data

**Recommendation**: Start with **Option B** (monthly). Add Option C later if integrating with EHR.

---

### Q5: Model Retraining Frequency

**Option A: On-demand (Manual)**
```
When you decide: python run_pipeline.py
Creates new models (v1.1, v1.2, etc.)
Next prediction run uses new model
```

**Option B: Scheduled (Weekly/Monthly)**
```
Every Monday: Run retraining pipeline
If performance improves, replace models
Log results in audit_log
```

**Option C: Performance-triggered**
```
Monthly: Calculate model drift
If drift > threshold: Auto-retrain
Notify team of model update
```

**Recommendation**: Start with **Option B** (monthly retraining). Easy to implement, predictable.

---

## 💾 Estimated Storage Requirements

```
3,000 baseline patients + growth:

PATIENTS table:
  3,000 rows × 200 bytes = 0.6 MB

PATIENT_FEATURES table:
  3,000 rows × 300 bytes = 0.9 MB

PREDICTIONS table (after 12 months weekly retrains):
  3,000 patients × 3 windows × 52 weeks = 468,000 rows
  468,000 × 150 bytes = 70 MB

FINANCIAL_PROJECTIONS table:
  Same cardinality as predictions = 70 MB

AUDIT_LOG table (4 entries per patient per week):
  3,000 × 52 × 4 = 624,000 rows
  624,000 × 200 bytes = 125 MB

MATERIALIZED VIEWS:
  ~10 MB total

Total after 1 year: ~280 MB (very manageable)
Total after 5 years: ~1.4 GB (still small)
```

PostgreSQL can easily handle this. No archival needed for 5+ years.

---

## 🚀 Database Connection Details (Docker)

From your docker-compose.yml:
```
Host: localhost
Port: 5433 (not 5432)
Database: risk_predictionDB
User: abdullah
Password: abdullah123
```

Python connection:
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5433,
    database="risk_predictionDB",
    user="abdullah",
    password="abdullah123"
)
```

---

## ✅ Success Criteria

By end of Phase 8, you should have:

- ✅ 3,000 patients in database
- ✅ 3,000 feature vectors stored
- ✅ 9,000 predictions (3 windows × 3,000 patients)
- ✅ 9,000 ROI calculations
- ✅ 3 materialized views showing:
  - Tier distribution by window
  - Risk distribution by department
  - Patients with positive ROI
- ✅ Audit log tracking all changes
- ✅ All queries execute in <1 second
- ✅ Ready for frontend integration

---

## 🎯 Next Steps

Once you've reviewed this design and answered the 5 questions, we'll:

1. Create the actual SQL scripts (ready to copy-paste)
2. Build the Python data loading scripts
3. Create the model prediction pipeline
4. Build ROI calculation logic
5. Test everything end-to-end
6. Then integrate with frontend/backend

Ready to proceed?
