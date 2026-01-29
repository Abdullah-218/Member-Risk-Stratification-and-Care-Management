# PostgreSQL Database Design for Healthcare Risk ML Platform
**Date**: January 29, 2026  
**Status**: Design Document (Pre-Implementation)

---

## 📊 Executive Summary

Your system requires **5 core database entities** with complex relationships to support:
1. **Organization-wide patient registry** (3K baseline + new patients)
2. **ML predictions** across 3 windows (30/60/90 days) + 5 risk tiers
3. **Financial projections** (costs, ROI, intervention impact)
4. **Department-level stratification** (which departments have high-risk patients)
5. **Real-time model updates** (predictions stored for audit trail + re-evaluation)

---

## 🏗️ Database Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  HEALTHCARE RISK ML DATABASE                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Core Tables:                                                │
│  ├── patients (3K baseline + new)                            │
│  ├── patient_features (27 clinical features per patient)     │
│  ├── departments (organizational structure)                  │
│  ├── predictions (window-specific risk scores & tiers)       │
│  ├── financial_projections (ROI, costs, savings)             │
│  └── audit_log (track model updates over time)               │
│                                                              │
│  Materialized Views:                                         │
│  ├── org_tier_summary (window-wise tier counts)              │
│  ├── dept_risk_distribution (high/critical per dept)         │
│  └── roi_positive_patients (patients with positive ROI)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Table Design Recommendations

### 1. **PATIENTS TABLE** (Core Registry)
**Purpose**: Master patient record + baseline data
**Cardinality**: 3,000 baseline + X new patients
**Update Frequency**: New patients added in real-time, baseline refreshes quarterly

```sql
-- Recommended Schema
CREATE TABLE patients (
    -- Primary Keys & Identifiers
    patient_id BIGSERIAL PRIMARY KEY,
    patient_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    external_id VARCHAR(50) UNIQUE,  -- Maps to X_test original ID
    
    -- Demographics
    age INT NOT NULL,
    gender VARCHAR(10),  -- 'M', 'F', 'Other'
    race VARCHAR(50),    -- 'White', 'Black', 'Hispanic', etc.
    
    -- Organizational Assignment
    department_id INT NOT NULL REFERENCES departments(department_id),
    primary_provider_id INT,  -- References healthcare providers table (future)
    
    -- Patient Classification
    data_source VARCHAR(20) NOT NULL,  -- 'X_TEST' | 'NEW_PATIENT' | 'IMPORTED'
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Financial Baseline
    annual_cost DECIMAL(10,2),
    cost_percentile DECIMAL(5,3),  -- 0.0-1.0
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),  -- Which system/user added patient
    updated_at TIMESTAMP,
    updated_by VARCHAR(50),
    
    -- Indexes for Performance
    INDEX idx_department (department_id),
    INDEX idx_data_source (data_source),
    INDEX idx_created_at (created_at),
    INDEX idx_annual_cost (annual_cost)
);
```

**Why this design:**
- `patient_uuid`: Allows HIPAA-compliant de-identification
- `data_source`: Tracks which patients are from baseline vs new
- `department_id`: Enables department-level analytics
- Timestamps: Audit trail for compliance
- Indexes: Optimized for common queries (filter by dept, cost, date)

---

### 2. **PATIENT_FEATURES TABLE** (Clinical Data)
**Purpose**: Store all 27 features per patient
**Cardinality**: 1:1 with patients (one feature vector per patient)
**Rationale**: Separates feature data from demographics for easier feature updates

```sql
CREATE TABLE patient_features (
    feature_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL UNIQUE REFERENCES patients(patient_id) ON DELETE CASCADE,
    
    -- Demographics (already in patients, but duplicated for feature completeness)
    is_elderly BOOLEAN,
    
    -- Chronic Conditions (10 binary flags)
    has_alzheimers INT,           -- 0, 1, 2 (missing/no/yes)
    has_chf INT,
    has_ckd INT,
    has_cancer INT,
    has_copd INT,
    has_depression INT,
    has_diabetes INT,
    has_ischemic_heart INT,
    has_ra_oa INT,
    has_stroke INT,
    
    -- Utilization Metrics
    total_admissions_2008 DECIMAL(8,2),
    total_hospital_days_2008 DECIMAL(8,2),
    days_since_last_admission DECIMAL(8,2),
    recent_admission INT,  -- Binary flag
    total_outpatient_visits_2008 DECIMAL(8,2),
    high_outpatient_user INT,  -- Binary flag
    
    -- Costs
    total_annual_cost DECIMAL(10,2),
    cost_percentile DECIMAL(5,3),
    high_cost INT,  -- Binary flag
    total_inpatient_cost DECIMAL(10,2),
    
    -- Derived Risk Metrics
    frailty_score DECIMAL(8,4),
    complexity_index DECIMAL(8,4),
    
    -- Audit
    feature_version INT DEFAULT 1,  -- Which feature set version
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_complexity (complexity_index)
);
```

**Why separate table:**
- Reduces patients table width (keeps it focused on demographics)
- Allows feature re-computation without touching patient metadata
- Easy to version features (if you update engineering)
- Better query performance for predictions that need all features

---

### 3. **PREDICTIONS TABLE** (Model Outputs)
**Purpose**: Store ML model outputs across 3 windows
**Cardinality**: Multiple records per patient (one per prediction run)
**Strategy**: Temporal design to track prediction history

```sql
CREATE TABLE predictions (
    prediction_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    
    -- Prediction Window & Timing
    prediction_window VARCHAR(10) NOT NULL,  -- '30_day', '60_day', '90_day'
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(20) NOT NULL,  -- 'v1.0', 'v1.1', etc.
    
    -- Risk Score (0-1 probability)
    risk_score DECIMAL(5,4) NOT NULL,
    
    -- Risk Tier (1-5 category)
    risk_tier INT NOT NULL CHECK (risk_tier BETWEEN 1 AND 5),
    
    -- Tier Metadata
    tier_label VARCHAR(20),  -- 'Normal', 'Low Risk', 'Moderate', 'High', 'Critical'
    is_high_risk BOOLEAN GENERATED ALWAYS AS (risk_tier >= 4) STORED,
    is_critical_risk BOOLEAN GENERATED ALWAYS AS (risk_tier = 5) STORED,
    
    -- Model Confidence (optional, for future use)
    prediction_confidence DECIMAL(5,4),
    
    -- Audit Trail
    created_by VARCHAR(50),  -- Which system made prediction
    
    -- Indexes for Analytics
    INDEX idx_patient_window (patient_id, prediction_window),
    INDEX idx_risk_tier (risk_tier),
    INDEX idx_timestamp (prediction_timestamp),
    INDEX idx_risk_score (risk_score),
    
    -- Constraint: Latest prediction per window per patient
    UNIQUE (patient_id, prediction_window, model_version)
);
```

**Why this design:**
- `prediction_timestamp`: Track when each prediction was made (audit trail)
- `model_version`: If you update models, know which version made each prediction
- Generated columns: Automatically mark high/critical risk (no recomputation)
- UNIQUE constraint: Prevents duplicate predictions from same model
- Separate records per window: Easy to query "all 30-day predictions"

---

### 4. **FINANCIAL_PROJECTIONS TABLE** (ROI Calculations)
**Purpose**: Store calculated ROI, intervention costs, savings
**Cardinality**: 1 record per patient per window (matches predictions)
**Frequency**: Calculated after each prediction run

```sql
CREATE TABLE financial_projections (
    projection_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(patient_id),
    prediction_id BIGINT REFERENCES predictions(prediction_id),
    
    -- Window & Timing
    projection_window VARCHAR(10) NOT NULL,  -- '30_day', '60_day', '90_day'
    days_in_window INT NOT NULL,  -- 30, 60, or 90
    projected_date DATE,  -- When is this projection for?
    
    -- Cost Projections (from patient baseline)
    annual_cost DECIMAL(10,2) NOT NULL,
    daily_cost DECIMAL(8,2) GENERATED ALWAYS AS (annual_cost / 365.0) STORED,
    window_cost DECIMAL(10,2) GENERATED ALWAYS AS (annual_cost / 365.0 * days_in_window) STORED,
    
    -- Addressable Cost (portion intervention can prevent)
    addressable_cost_pct DECIMAL(5,3) DEFAULT 0.60,  -- 60%
    addressable_cost DECIMAL(10,2) GENERATED ALWAYS AS 
        (annual_cost / 365.0 * days_in_window * 0.60) STORED,
    
    -- Intervention Cost (tier-dependent, time-scaled)
    -- From your model: 30-day: $0-900, 60-day: $0-1650, 90-day: $0-1900
    risk_tier INT NOT NULL,
    intervention_cost DECIMAL(10,2) NOT NULL,
    
    -- Success Rate (random range per tier, stored for reproducibility)
    -- From your model ranges
    success_rate_min DECIMAL(5,3),
    success_rate_max DECIMAL(5,3),
    success_rate_actual DECIMAL(5,3) NOT NULL,  -- What was actually used in calc
    
    -- Calculated Savings & ROI
    expected_savings DECIMAL(10,2) GENERATED ALWAYS AS 
        (annual_cost / 365.0 * days_in_window * 0.60 * 0.50) STORED,  -- Placeholder
    actual_savings DECIMAL(10,2),  -- Updated when intervention outcome known
    
    net_benefit DECIMAL(10,2) GENERATED ALWAYS AS 
        (expected_savings - intervention_cost) STORED,
    
    roi_percentage DECIMAL(8,2) GENERATED ALWAYS AS (
        CASE 
            WHEN intervention_cost > 0 
            THEN (expected_savings - intervention_cost) / intervention_cost * 100
            ELSE 0
        END
    ) STORED,
    
    roi_category VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN roi_percentage >= 50 THEN 'HIGHLY_POSITIVE'
            WHEN roi_percentage >= 0 THEN 'POSITIVE'
            WHEN roi_percentage >= -25 THEN 'BREAKEVEN'
            ELSE 'NEGATIVE'
        END
    ) STORED,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_patient_window (patient_id, projection_window),
    INDEX idx_roi_category (roi_category),
    INDEX idx_risk_tier (risk_tier),
    INDEX idx_created_at (created_at)
);
```

**Why this design:**
- **Generated columns**: Automatic calculations reduce errors
- **Stored success_rate**: Reproducible ROI (same result if queried later)
- **ROI categories**: Easy filtering for "positive ROI patients"
- **Separates expected vs actual**: You can update with real intervention outcomes
- **Window flexibility**: Supports any time period

---

### 5. **DEPARTMENTS TABLE** (Organizational Structure)
**Purpose**: Map healthcare departments/specialties
**Cardinality**: Small reference table (10-50 departments)
**Strategy**: Lookup table for patient assignment

```sql
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20) UNIQUE,  -- 'CARDIO', 'ONCOLOGY', etc.
    
    -- Contact & Management
    department_head VARCHAR(100),
    contact_email VARCHAR(100),
    
    -- Risk Thresholds (customizable per dept)
    -- Some depts might focus on critical, others on all high-risk
    flag_high_risk BOOLEAN DEFAULT TRUE,
    flag_critical_risk BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_department_code (department_code)
);
```

**Sample data:**
```sql
INSERT INTO departments (department_name, department_code, department_head) VALUES
('Cardiology', 'CARDIO', 'Dr. Smith'),
('Oncology', 'ONCOLOGY', 'Dr. Johnson'),
('Nephrology', 'NEPHRO', 'Dr. Williams'),
('Pulmonology', 'PULMO', 'Dr. Brown'),
('Neurology', 'NEURO', 'Dr. Davis');
```

---

### 6. **AUDIT_LOG TABLE** (Model Updates & Tracking)
**Purpose**: Track when ML models are updated, predictions change
**Cardinality**: High volume (one entry per significant model change)
**Use case**: If same patient gets predicted again, compare results

```sql
CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    
    -- What changed
    event_type VARCHAR(50) NOT NULL,  -- 'MODEL_UPDATE', 'PREDICTION_RUN', 'PATIENT_ADDED'
    entity_type VARCHAR(50),  -- 'PATIENT', 'PREDICTION', 'MODEL'
    entity_id BIGINT,  -- patient_id or prediction_id
    
    -- Old vs New
    old_values JSON,  -- Previous state (if applicable)
    new_values JSON,  -- New state
    
    -- Context
    model_version VARCHAR(20),
    prediction_window VARCHAR(10),
    
    -- Who/When
    changed_by VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_event_type (event_type),
    INDEX idx_changed_at (changed_at)
);
```

**Why comprehensive audit:**
- HIPAA/compliance requirement
- Debug model changes (why did patient risk change?)
- Track when system was last updated
- Investigate anomalies

---

## 📈 Materialized Views (For Analytics)

These are **pre-calculated summaries** that update on-demand. Much faster than computing on the fly.

### View 1: **ORG_TIER_SUMMARY** (Window-wise Tier Distribution)

```sql
CREATE MATERIALIZED VIEW org_tier_summary AS
SELECT 
    p.prediction_window,
    p.risk_tier,
    p.tier_label,
    COUNT(DISTINCT p.patient_id) as patient_count,
    ROUND(100.0 * COUNT(DISTINCT p.patient_id) / SUM(COUNT(DISTINCT p.patient_id)) 
          OVER (PARTITION BY p.prediction_window), 2) as percentage,
    ROUND(AVG(p.risk_score), 4) as avg_risk_score,
    MIN(p.risk_score) as min_risk_score,
    MAX(p.risk_score) as max_risk_score,
    COUNT(DISTINCT CASE WHEN p.is_critical_risk THEN p.patient_id END) as critical_count
FROM predictions p
WHERE p.prediction_timestamp = (
    SELECT MAX(prediction_timestamp) 
    FROM predictions 
    WHERE patient_id = p.patient_id 
    AND prediction_window = p.prediction_window
)
GROUP BY p.prediction_window, p.risk_tier, p.tier_label
ORDER BY p.prediction_window, p.risk_tier;

-- Example output:
-- Window    | Tier | Label        | Count | % of Total | Avg Risk | Critical
-- 30_day    | 1    | Normal       | 1950  | 65.0%      | 0.0540   | 0
-- 30_day    | 2    | Low Risk     | 600   | 20.0%      | 0.1750   | 0
-- 30_day    | 3    | Moderate     | 300   | 10.0%      | 0.3750   | 0
-- 30_day    | 4    | High Risk    | 120   | 4.0%       | 0.6250   | 45
-- 30_day    | 5    | Critical     | 30    | 1.0%       | 0.8750   | 30
```

**Use cases:**
- Dashboard: "How many patients in each risk tier?"
- Planning: "Next month, expect X critical-risk interventions"
- Benchmarking: "Compare tier distribution across time"

---

### View 2: **DEPT_RISK_DISTRIBUTION** (High/Critical Risk by Department)

```sql
CREATE MATERIALIZED VIEW dept_risk_distribution AS
SELECT 
    d.department_id,
    d.department_name,
    d.department_code,
    p_pred.prediction_window,
    COUNT(DISTINCT CASE WHEN p_pred.risk_tier >= 4 THEN p_pred.patient_id END) as high_risk_count,
    COUNT(DISTINCT CASE WHEN p_pred.risk_tier = 5 THEN p_pred.patient_id END) as critical_risk_count,
    COUNT(DISTINCT p_pred.patient_id) as total_patients,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN p_pred.risk_tier >= 4 THEN p_pred.patient_id END) / 
          COUNT(DISTINCT p_pred.patient_id), 2) as high_risk_percentage,
    ROUND(AVG(p_pred.risk_score), 4) as avg_risk_score
FROM departments d
LEFT JOIN patients p ON d.department_id = p.department_id
LEFT JOIN predictions p_pred ON p.patient_id = p_pred.patient_id
WHERE p_pred.prediction_timestamp = (
    SELECT MAX(prediction_timestamp)
    FROM predictions
    WHERE patient_id = p.patient_id
    AND prediction_window = p_pred.prediction_window
)
GROUP BY d.department_id, d.department_name, p_pred.prediction_window
ORDER BY d.department_id, p_pred.prediction_window;

-- Example output:
-- Department   | Window | High Risk | Critical | Total | High Risk % | Avg Risk
-- Cardiology   | 30_day | 45        | 12       | 450   | 10.0%       | 0.2450
-- Oncology     | 30_day | 78        | 28       | 300   | 26.0%       | 0.3620
-- Nephrology   | 30_day | 32        | 5        | 200   | 16.0%       | 0.2840
```

**Use cases:**
- Department dashboards: "Oncology has highest risk concentration"
- Intervention planning: "Which departments need most resources?"
- Comparative analysis: "Trends over time by department"

---

### View 3: **ROI_POSITIVE_PATIENTS** (Profitable Interventions)

```sql
CREATE MATERIALIZED VIEW roi_positive_patients AS
SELECT 
    p.patient_id,
    p.patient_uuid,
    p.age,
    p.gender,
    d.department_name,
    fp.projection_window,
    fp.risk_tier,
    pred.tier_label,
    fp.annual_cost,
    fp.intervention_cost,
    fp.expected_savings,
    fp.roi_percentage,
    fp.roi_category,
    CASE 
        WHEN fp.roi_percentage >= 100 THEN 'EXCEPTIONAL'
        WHEN fp.roi_percentage >= 50 THEN 'EXCELLENT'
        WHEN fp.roi_percentage >= 25 THEN 'GOOD'
        WHEN fp.roi_percentage >= 0 THEN 'POSITIVE'
        ELSE 'NEGATIVE'
    END as roi_grade
FROM patients p
JOIN departments d ON p.department_id = d.department_id
JOIN financial_projections fp ON p.patient_id = fp.patient_id
JOIN predictions pred ON p.patient_id = pred.patient_id 
    AND fp.projection_window = pred.prediction_window
WHERE fp.roi_percentage >= 0  -- Only positive ROI
AND pred.prediction_timestamp = (
    SELECT MAX(prediction_timestamp)
    FROM predictions
    WHERE patient_id = p.patient_id
    AND prediction_window = fp.projection_window
)
ORDER BY fp.roi_percentage DESC, fp.risk_tier DESC;

-- Example output shows patients with positive ROI, sortable by grade
```

**Use cases:**
- Intervention targeting: "Which patients to prioritize?"
- Financial planning: "Expected savings from these interventions"
- ROI tracking: "Monitor actual outcomes vs predictions"

---

## 🔄 Data Flow & Update Strategy

### Scenario 1: Initial Load (3K X_test Patients)

```
Step 1: Load into patients table
   3000 rows from X_test.csv
   data_source = 'X_TEST'
   department_id = assigned based on data

Step 2: Load into patient_features table
   27 features per patient
   linked to patient_id

Step 3: Run predictions
   For each patient + each window (30/60/90):
   - Load feature vector from patient_features
   - Run through model
   - Store risk_score + tier in predictions table
   - Timestamp each prediction

Step 4: Calculate ROI
   For each prediction:
   - Load patient annual_cost
   - Load tier-specific intervention cost
   - Calculate savings based on success rate
   - Store in financial_projections

Step 5: Refresh materialized views
   org_tier_summary
   dept_risk_distribution
   roi_positive_patients
```

**SQL workflow pseudo-code:**
```sql
-- 1. Insert patients
INSERT INTO patients (age, gender, department_id, annual_cost, data_source, created_by)
SELECT age, gender, COALESCE(dept_id, 1), annual_cost, 'X_TEST', 'BATCH_LOAD'
FROM staging_x_test_load;

-- 2. Insert features
INSERT INTO patient_features (patient_id, has_chf, has_diabetes, ...)
SELECT patient_id, has_chf, has_diabetes, ...
FROM staging_features_load;

-- 3. Generate predictions (Python script)
-- (Call from backend)

-- 4. Refresh views
REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY dept_risk_distribution;
REFRESH MATERIALIZED VIEW CONCURRENTLY roi_positive_patients;
```

---

### Scenario 2: New Patient Entry (Real-time)

```
Step 1: Insert new patient record
   INSERT into patients (demographics + department)
   Returns: patient_id

Step 2: Insert feature vector
   INSERT into patient_features
   
Step 3: Run prediction (immediately)
   Python backend:
   - Load patient_id
   - Retrieve features from patient_features
   - Pass through 3 models
   - INSERT into predictions (3 rows, one per window)

Step 4: Calculate ROI
   For each prediction:
   - INSERT into financial_projections

Step 5: Update audit log
   INSERT into audit_log
   event_type = 'PATIENT_ADDED'
   new_values = {patient_id, demographics}

Step 6: Trigger view refresh
   REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;
   REFRESH MATERIALIZED VIEW CONCURRENTLY dept_risk_distribution;
```

**Benefits:**
- New patient available for analytics immediately
- Views stay current
- Audit trail captures when added
- No need to reload all 3K patients

---

### Scenario 3: Model Re-evaluation (Scheduled)

```
When: Weekly or monthly (not real-time)
Trigger: New model version or retraining

Step 1: Update patient features (if changed)
   UPDATE patient_features SET ...

Step 2: Run predictions with NEW model
   For each patient + window:
   - Load patient_id + features
   - Run new model
   - INSERT into predictions (new rows with model_version='v1.1')

Step 3: New ROI calculations
   For each new prediction:
   - INSERT into financial_projections

Step 4: Audit trail
   INSERT into audit_log
   event_type = 'MODEL_UPDATE'
   old_values = previous predictions
   new_values = new predictions

Step 5: Compare results
   Query: Which patients' risk changed significantly?
   Which moved tiers?

Step 6: Refresh views
   REFRESH MATERIALIZED VIEW ...
```

**SQL to compare old vs new:**
```sql
SELECT 
    p.patient_id,
    old_pred.risk_score as old_score,
    new_pred.risk_score as new_score,
    old_pred.risk_tier as old_tier,
    new_pred.risk_tier as new_tier,
    ABS(new_pred.risk_score - old_pred.risk_score) as score_change
FROM predictions old_pred
JOIN predictions new_pred ON old_pred.patient_id = new_pred.patient_id
WHERE old_pred.model_version = 'v1.0'
AND new_pred.model_version = 'v1.1'
ORDER BY score_change DESC;
```

---

## ⚡ Performance Considerations

### Indexing Strategy

| Table | Index On | Why |
|-------|----------|-----|
| **patients** | department_id, data_source, created_at | Filter by dept/source, time range queries |
| **predictions** | (patient_id, prediction_window), risk_tier, timestamp | Primary query: "get latest prediction for patient/window" |
| **financial_projections** | (patient_id, projection_window), roi_category | Filter positive ROI, by window |
| **audit_log** | (entity_type, entity_id), changed_at | Track changes per entity |

### Query Optimization Tips

**Problem**: "Show me all 30-day critical-risk patients in Cardiology"

```sql
-- GOOD: Uses indexes
SELECT p.patient_id, p.age, pred.risk_score
FROM patients p
JOIN predictions pred ON p.patient_id = pred.patient_id
WHERE p.department_id = 3  -- Index exists
AND pred.prediction_window = '30_day'  -- Part of composite index
AND pred.risk_tier = 5;

-- FAST: Uses materialized view
SELECT * FROM dept_risk_distribution
WHERE department_id = 3
AND prediction_window = '30_day'
AND critical_risk_count > 0;
```

### Materialized View Refresh Strategy

**Option 1: On-demand (Manual)**
- Refresh only when needed
- Pro: No background processing
- Con: Data might be stale
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;
```

**Option 2: Scheduled (Automated)**
- Refresh every hour/day
- Pro: Always current
- Con: Uses resources
```sql
-- Run via cron or pg_cron extension
SELECT cron.schedule('refresh-summaries', '0 */1 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;
   REFRESH MATERIALIZED VIEW CONCURRENTLY dept_risk_distribution;
   REFRESH MATERIALIZED VIEW CONCURRENTLY roi_positive_patients;'
);
```

**Option 3: Trigger-based (Event-driven)**
- Refresh when predictions inserted
- Pro: Always in sync
- Con: Slower inserts during batch loads
```sql
CREATE TRIGGER refresh_views_after_prediction
AFTER INSERT ON predictions
EXECUTE FUNCTION refresh_prediction_views();
```

---

## 🔐 Security & Constraints

### Data Integrity

```sql
-- Prevent invalid tier assignments
ALTER TABLE predictions 
ADD CONSTRAINT check_tier CHECK (risk_tier BETWEEN 1 AND 5);

-- Prevent negative costs
ALTER TABLE financial_projections
ADD CONSTRAINT check_costs CHECK (annual_cost >= 0 AND intervention_cost >= 0);

-- Prevent invalid risk scores
ALTER TABLE predictions
ADD CONSTRAINT check_risk_score CHECK (risk_score BETWEEN 0.0 AND 1.0);

-- Foreign key cascade
ALTER TABLE patient_features
ADD CONSTRAINT fk_patient
FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;
```

### HIPAA Compliance

```sql
-- De-identification: Use UUIDs externally
SELECT patient_uuid, age, risk_tier
FROM predictions
WHERE risk_tier >= 4;
-- Never expose actual patient_id externally

-- Audit sensitive access
CREATE AUDIT TRIGGER audit_patient_access
AFTER SELECT ON patients
FOR EACH ROW
EXECUTE FUNCTION log_data_access();
```

---

## 📊 Sample Queries You'll Need

### Query 1: "Which patients have high ROI in 30-day window?"
```sql
SELECT *
FROM roi_positive_patients
WHERE projection_window = '30_day'
AND roi_grade IN ('EXCELLENT', 'EXCEPTIONAL')
ORDER BY roi_percentage DESC
LIMIT 50;
```

### Query 2: "What's the cost of treating all Tier-5 patients?"
```sql
SELECT 
    SUM(fp.intervention_cost) as total_intervention_cost,
    SUM(fp.expected_savings) as total_expected_savings,
    COUNT(DISTINCT p.patient_id) as patient_count
FROM patients p
JOIN predictions pred ON p.patient_id = pred.patient_id
JOIN financial_projections fp ON p.patient_id = fp.patient_id
WHERE pred.risk_tier = 5
AND pred.prediction_window = '30_day';
```

### Query 3: "How did predictions change after model update?"
```sql
SELECT 
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE old_tier = new_tier) as tier_unchanged,
    COUNT(*) FILTER (WHERE old_tier != new_tier) as tier_changed,
    COUNT(*) FILTER (WHERE new_tier > old_tier) as risk_increased
FROM (
    SELECT 
        old.patient_id,
        old.risk_tier as old_tier,
        new.risk_tier as new_tier
    FROM predictions old
    JOIN predictions new ON old.patient_id = new.patient_id
    WHERE old.model_version = 'v1.0'
    AND new.model_version = 'v1.1'
) changes;
```

---

## 🎯 Best Practices Summary

| Aspect | Best Practice | Why |
|--------|---------------|-----|
| **Feature Storage** | Separate table from demographics | Easy to update/version features |
| **Predictions** | Multiple records per patient (one per window) | Flexible querying by window |
| **ROI Calculations** | Store all intermediate values (success_rate, daily_cost) | Reproducible, debuggable results |
| **Audit Trail** | Log all model updates + patient additions | HIPAA compliance + debugging |
| **Views** | Pre-calculate summaries materialized | Analytics queries execute in <1 second |
| **Indexing** | Composite indexes on common filter combinations | Optimize most common queries |
| **Refresh Strategy** | Trigger-based during batch, scheduled otherwise | Balance freshness vs performance |

---

## 🚀 Next Steps (Implementation Order)

1. **Create base schema** (patients, patient_features, departments)
2. **Load 3K X_test patients** (batch insert)
3. **Add prediction tables** (predictions, financial_projections)
4. **Run initial model predictions** (Python → DB)
5. **Create materialized views** (summary analytics)
6. **Build audit logging** (track changes)
7. **Optimize indexes** (performance tuning)
8. **Set up refresh strategy** (keep views current)

---

## ❓ Questions for You Before Implementation

1. **Department assignment**: How should the 3K X_test patients be assigned to departments?
   - Random? By condition patterns? Manually?

2. **Real-time vs batch**: How fast do new patient predictions need to happen?
   - Immediately (milliseconds)? Within a minute? Daily batch?

3. **Historical predictions**: Keep all predictions or just latest?
   - Recommend: Keep all for audit, but query only latest for active use

4. **Cost data frequency**: How often does annual_cost update?
   - Only at load? Monthly? Real-time from EHR?

5. **Model retraining frequency**: How often will you retrain models?
   - Monthly? Quarterly? Based on performance threshold?

---

This design provides **scalability, auditability, and flexibility** for your use cases. Ready to implement?
