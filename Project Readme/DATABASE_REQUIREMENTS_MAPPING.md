# Database Design Recommendations for Your 5 Requirements

## 📌 Your 5 Requirements & How They Map to Database

### Requirement 1: Organization Database (3K Patients)
**"The X_test 3k rows dataset should be stored as an organization database where all patients data are available"**

**Recommended Implementation:**

```
PATIENTS Table (3,000 rows)
├── Patient demographics (age, gender, race)
├── Organizational assignment (department)
├── Financial baseline (annual_cost)
├── Data source flag (data_source = 'X_TEST')
└── Audit timestamps (when added, by whom)

PATIENT_FEATURES Table (3,000 rows, 1:1 with PATIENTS)
├── 27 engineered features for ML
├── Chronic conditions (10 flags)
├── Utilization metrics (6 counts)
├── Cost metrics (4 values)
└── Derived risk scores (frailty, complexity)

Data Flow:
┌─────────────┐
│  X_test.csv │ (3,001 rows, 27 columns)
└──────┬──────┘
       │ Parse
       ▼
┌─────────────────────────┐
│ Batch Load Script       │
│ (Python or SQL COPY)    │
└──────┬──────────────────┘
       │
       ├─→ PATIENTS (demo + metadata)
       └─→ PATIENT_FEATURES (27 features)

Query Examples:
- "Show me all patients in Cardiology"
- "Find all patients with diabetes"
- "Get annual cost distribution"
```

**Specific Recommendations:**

1. **Use COPY for bulk load (faster than INSERT):**
   ```bash
   # Copy X_test.csv directly into staging table
   # Then INSERT with department assignment
   ```

2. **Department Assignment:**
   - Recommend condition-based routing (see checklist)
   - Cardiology: CHF, ischemic heart disease
   - Oncology: Cancer
   - Nephrology: CKD, diabetes
   - Etc.

3. **Data Source Tracking:**
   - Mark X_test patients with `data_source='X_TEST'`
   - Later new patients get `data_source='NEW_PATIENT'`
   - Enables filtering/comparisons between cohorts

4. **Schema Impact:**
   ```sql
   -- You need:
   PATIENTS (primary key: patient_id)
   PATIENT_FEATURES (foreign key: patient_id)
   DEPARTMENTS (referenced by patients.department_id)
   
   -- Indexes needed:
   - patients(department_id)  -- for dept queries
   - patients(data_source)    -- for cohort filtering
   - patient_features(patient_id)  -- fast feature lookup
   ```

---

### Requirement 2: Predicted Organization Data (Window/Tier Wise)
**"Predicted organization data that is window wise / tier wise data and no. of patients in each data are stored accordingly"**

**Recommended Implementation:**

```
This is your materialized view: ORG_TIER_SUMMARY

Example Output:
┌──────────┬──────┬──────────┬───────────┬──────────┐
│ Window   │ Tier │ Label    │ Count     │ %        │
├──────────┼──────┼──────────┼───────────┼──────────┤
│ 30_day   │ 1    │ Normal   │ 1,950     │ 65.0%    │
│ 30_day   │ 2    │ Low      │ 600       │ 20.0%    │
│ 30_day   │ 3    │ Moderate │ 300       │ 10.0%    │
│ 30_day   │ 4    │ High     │ 120       │ 4.0%     │
│ 30_day   │ 5    │ Critical │ 30        │ 1.0%     │
│ 60_day   │ 1    │ Normal   │ 1,800     │ 60.0%    │
│ 60_day   │ 2    │ Low      │ 750       │ 25.0%    │
│ 60_day   │ 3    │ Moderate │ 300       │ 10.0%    │
│ 60_day   │ 4    │ High     │ 120       │ 4.0%     │
│ 60_day   │ 5    │ Critical │ 30        │ 1.0%     │
│ 90_day   │ 1    │ Normal   │ 1,500     │ 50.0%    │
│ 90_day   │ 2    │ Low      │ 900       │ 30.0%    │
│ 90_day   │ 3    │ Moderate │ 450       │ 15.0%    │
│ 90_day   │ 4    │ High     │ 120       │ 4.0%     │
│ 90_day   │ 5    │ Critical │ 30        │ 1.0%     │
└──────────┴──────┴──────────┴───────────┴──────────┘

Data Source:
PREDICTIONS table → Materialized View (ORG_TIER_SUMMARY)

Schema:
PREDICTIONS Table
├── prediction_id (PK)
├── patient_id (FK → PATIENTS)
├── prediction_window ('30_day', '60_day', '90_day')
├── risk_score (0-1)
├── risk_tier (1-5)
├── tier_label ('Normal', 'Low Risk', etc.)
└── prediction_timestamp

Materialized View calculates:
SELECT 
    prediction_window,
    risk_tier,
    tier_label,
    COUNT(DISTINCT patient_id) as patient_count,
    ROUND(100.0 * COUNT / SUM() OVER (PARTITION BY window), 2) as percentage
FROM predictions
GROUP BY prediction_window, risk_tier
ORDER BY prediction_window, risk_tier;
```

**Specific Recommendations:**

1. **Storage Strategy:**
   - Store raw predictions in PREDICTIONS table
   - Create MATERIALIZED VIEW for summary (pre-calculated)
   - Refresh view after every prediction run (takes <1 second)

2. **Query Access:**
   ```sql
   -- Fast: Use view (pre-calculated)
   SELECT * FROM org_tier_summary 
   WHERE prediction_window = '30_day';
   
   -- Slow: Calculate on the fly (don't do this)
   SELECT prediction_window, risk_tier, COUNT(*)
   FROM predictions
   GROUP BY prediction_window, risk_tier;
   ```

3. **Performance:**
   - 3,000 predictions analyzed: <100ms
   - 30,000 predictions (multiple runs): <500ms
   - 300,000 predictions (1 year data): <2 seconds

4. **Frontend Integration:**
   ```python
   # Python backend
   import psycopg2
   
   cursor.execute("SELECT * FROM org_tier_summary ORDER BY prediction_window, risk_tier")
   results = cursor.fetchall()
   
   # Convert to JSON for frontend
   tier_distribution = {
       '30_day': {'tier_1': 1950, 'tier_2': 600, ...},
       '60_day': {'tier_1': 1800, 'tier_2': 750, ...},
       '90_day': {'tier_1': 1500, 'tier_2': 900, ...}
   }
   ```

5. **Refresh Strategy:**
   - After each prediction batch: `REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;`
   - Automatic: Set up pg_cron job to refresh hourly
   - Manual: Refresh on-demand from backend

---

### Requirement 3: ROI Calculations & Investments
**"Calculate ROI investments, intervention cost, net benefits, overall ROI, positive ROI patients with their details"**

**Recommended Implementation:**

```
FINANCIAL_PROJECTIONS Table (One per prediction)
├── projection_id (PK)
├── patient_id (FK)
├── prediction_id (FK → links to specific prediction)
├── projection_window ('30_day', '60_day', '90_day')
│
├── COST DATA (Calculated or Stored)
│   ├── annual_cost (from patient)
│   ├── window_cost (calculated: annual / 365 * days)
│   ├── addressable_cost (calculated: window_cost * 60%)
│   └── daily_cost (calculated: annual / 365)
│
├── INTERVENTION DATA
│   ├── risk_tier (from prediction)
│   ├── intervention_cost (tier-specific, time-scaled)
│   ├── success_rate (random between tier range, stored)
│   └── reduction_rate (implicit in success_rate)
│
└── OUTPUTS (All Generated/Calculated)
    ├── expected_savings (addressable × success_rate)
    ├── net_benefit (savings - intervention_cost)
    ├── roi_percentage (net_benefit / intervention_cost * 100)
    └── roi_category ('POSITIVE', 'NEGATIVE', etc.)

Time-Scaled Intervention Costs (From Your Model):
┌──────────┬─────────┬─────────┬──────────┬──────────┬──────────┐
│ Window   │ Tier 1  │ Tier 2  │ Tier 3   │ Tier 4   │ Tier 5   │
├──────────┼─────────┼─────────┼──────────┼──────────┼──────────┤
│ 30-day   │ $0      │ $150    │ $400     │ $700     │ $900     │
│ 60-day   │ $0      │ $250    │ $700     │ $1,100   │ $1,650   │
│ 90-day   │ $0      │ $350    │ $1,050   │ $1,550   │ $1,900   │
└──────────┴─────────┴─────────┴──────────┴──────────┴──────────┘

Success Rate Ranges (Window & Tier Specific):
┌──────────┬────────────────┬────────────────┬──────────────────┬────────────────┬──────────────┐
│ Window   │ Tier 1         │ Tier 2         │ Tier 3           │ Tier 4         │ Tier 5       │
├──────────┼────────────────┼────────────────┼──────────────────┼────────────────┼──────────────┤
│ 30-day   │ 3% - 8%        │ 10% - 20%      │ 25% - 40%        │ 30% - 50%      │ 40% - 60%    │
│ 60-day   │ 10% - 25%      │ 25% - 40%      │ 35% - 55%        │ 45% - 65%      │ 55% - 75%    │
│ 90-day   │ 20% - 35%      │ 35% - 50%      │ 45% - 60%        │ 60% - 80%      │ 70% - 90%    │
└──────────┴────────────────┴────────────────┴──────────────────┴────────────────┴──────────────┘

Example Calculation (30-day, High-Risk Patient, $50K annual cost):
Step 1: Window cost
  window_cost = 50,000 / 365 * 30 = $4,110

Step 2: Addressable portion
  addressable_cost = 4,110 * 0.60 = $2,466

Step 3: Intervention cost (Tier 4, 30-day)
  intervention_cost = $700

Step 4: Success rate (random between 30-50% for Tier 4)
  success_rate = 45% (example)

Step 5: Expected savings
  expected_savings = 2,466 * 0.45 = $1,110

Step 6: Net benefit & ROI
  net_benefit = 1,110 - 700 = $410
  roi_percentage = (410 / 700) * 100 = 58.6%
  roi_category = 'POSITIVE'
```

**Specific Recommendations:**

1. **Storage Approach:**
   - Store ALL intermediate calculations (not just final ROI)
   - Makes debugging easier
   - Enables audit trail

   ```sql
   CREATE TABLE financial_projections (
       -- Keys
       projection_id BIGSERIAL PRIMARY KEY,
       patient_id BIGINT NOT NULL,
       prediction_id BIGINT,
       
       -- Window
       projection_window VARCHAR(10),
       days_in_window INT,
       
       -- Cost breakdown (all stored)
       annual_cost DECIMAL(10,2),
       daily_cost DECIMAL(8,2) GENERATED,
       window_cost DECIMAL(10,2) GENERATED,
       addressable_cost DECIMAL(10,2) GENERATED,
       addressable_cost_pct DECIMAL(5,3) DEFAULT 0.60,
       
       -- Intervention (stored + generated)
       risk_tier INT,
       intervention_cost DECIMAL(10,2),  -- Stored from tier table
       success_rate_actual DECIMAL(5,3),  -- Stored (for reproducibility)
       
       -- Results (all generated)
       expected_savings DECIMAL(10,2) GENERATED,
       net_benefit DECIMAL(10,2) GENERATED,
       roi_percentage DECIMAL(8,2) GENERATED,
       roi_category VARCHAR(20) GENERATED
   );
   ```

2. **Python Calculation Function:**
   ```python
   def calculate_roi_for_prediction(patient_id, prediction_id, 
                                    window, annual_cost, risk_tier):
       # Get tier-specific costs
       intervention_cost = TIER_COSTS[window][risk_tier]
       
       if intervention_cost == 0:  # Tier 1
           return {
               'projection_window': window,
               'annual_cost': annual_cost,
               'intervention_cost': 0,
               'expected_savings': 0,
               'net_benefit': 0,
               'roi_percentage': 0,
               'roi_category': 'NO_INTERVENTION'
           }
       
       # Calculate costs
       days = {'30_day': 30, '60_day': 60, '90_day': 90}[window]
       window_cost = (annual_cost / 365) * days
       addressable_cost = window_cost * 0.60
       
       # Get success rate range for tier
       success_range = SUCCESS_RATES[window][risk_tier]
       success_rate = random.uniform(success_range[0], success_range[1])
       
       # Calculate savings
       expected_savings = addressable_cost * success_rate
       net_benefit = expected_savings - intervention_cost
       roi_pct = (net_benefit / intervention_cost) * 100 if intervention_cost > 0 else 0
       
       # Cap ROI at 100% (realistic constraint)
       roi_pct = min(roi_pct, 100)
       
       # Determine category
       if roi_pct >= 50:
           roi_category = 'HIGHLY_POSITIVE'
       elif roi_pct >= 0:
           roi_category = 'POSITIVE'
       elif roi_pct >= -25:
           roi_category = 'BREAKEVEN'
       else:
           roi_category = 'NEGATIVE'
       
       return {
           'projection_window': window,
           'annual_cost': annual_cost,
           'intervention_cost': intervention_cost,
           'expected_savings': expected_savings,
           'net_benefit': net_benefit,
           'roi_percentage': roi_pct,
           'roi_category': roi_category,
           'success_rate_actual': success_rate
       }
   ```

3. **Materialized View for Positive ROI Patients:**
   ```sql
   CREATE MATERIALIZED VIEW roi_positive_patients AS
   SELECT 
       p.patient_id,
       p.age,
       p.gender,
       d.department_name,
       fp.projection_window,
       fp.risk_tier,
       fp.annual_cost,
       fp.intervention_cost,
       fp.expected_savings,
       fp.net_benefit,
       fp.roi_percentage,
       CASE 
           WHEN fp.roi_percentage >= 100 THEN 'EXCEPTIONAL'
           WHEN fp.roi_percentage >= 50 THEN 'EXCELLENT'
           WHEN fp.roi_percentage >= 25 THEN 'GOOD'
           WHEN fp.roi_percentage >= 0 THEN 'POSITIVE'
       END as roi_grade
   FROM patients p
   JOIN departments d ON p.department_id = d.department_id
   JOIN financial_projections fp ON p.patient_id = fp.patient_id
   WHERE fp.roi_percentage >= 0
   ORDER BY fp.roi_percentage DESC, fp.risk_tier DESC;
   ```

4. **Sample Queries:**
   ```sql
   -- How many patients have positive ROI in 30-day window?
   SELECT COUNT(*) 
   FROM roi_positive_patients 
   WHERE projection_window = '30_day';
   
   -- What's the total expected savings if we intervene on all positive-ROI patients?
   SELECT 
       projection_window,
       COUNT(*) as patient_count,
       ROUND(SUM(intervention_cost)::numeric, 2) as total_intervention_cost,
       ROUND(SUM(expected_savings)::numeric, 2) as total_expected_savings,
       ROUND(SUM(net_benefit)::numeric, 2) as total_net_benefit
   FROM roi_positive_patients
   GROUP BY projection_window;
   
   -- Which departments have highest average ROI?
   SELECT 
       department_name,
       ROUND(AVG(roi_percentage)::numeric, 2) as avg_roi,
       COUNT(*) as patient_count
   FROM roi_positive_patients
   GROUP BY department_name
   ORDER BY avg_roi DESC;
   ```

---

### Requirement 4: Department Database (High/Critical Risk Distribution)
**"Departments database where high risk and critical patients based on departments are distributed accordingly"**

**Recommended Implementation:**

```
This combines DEPARTMENTS + MATERIALIZED VIEW: DEPT_RISK_DISTRIBUTION

DEPARTMENTS Table (Reference):
┌──────────────┬──────────────┬─────────────────┬──────────────────┐
│ department_id│ department_  │ department_code │ contact_email    │
│              │ name         │                 │                  │
├──────────────┼──────────────┼─────────────────┼──────────────────┤
│ 1            │ Cardiology   │ CARDIO          │ cardio@org.com   │
│ 2            │ Oncology     │ ONCOLOGY        │ onc@org.com      │
│ 3            │ Nephrology   │ NEPHRO          │ nephro@org.com   │
│ 4            │ Pulmonology  │ PULMO           │ pulmo@org.com    │
│ 5            │ General      │ GENERAL         │ general@org.com  │
└──────────────┴──────────────┴─────────────────┴──────────────────┘

DEPT_RISK_DISTRIBUTION View (Calculated):
┌──────────────┬──────────┬───────────┬──────────────┬──────────────┬───────────────┐
│ Department   │ Window   │ High Risk │ Critical     │ Total        │ High Risk %    │
│              │          │ (T4+T5)   │ Risk (T5)    │ Patients     │                │
├──────────────┼──────────┼───────────┼──────────────┼──────────────┼───────────────┤
│ Cardiology   │ 30_day   │ 45        │ 12           │ 450          │ 10.0%          │
│ Cardiology   │ 60_day   │ 85        │ 25           │ 450          │ 18.9%          │
│ Cardiology   │ 90_day   │ 120       │ 40           │ 450          │ 26.7%          │
│ Oncology     │ 30_day   │ 78        │ 28           │ 300          │ 26.0%          │
│ Oncology     │ 60_day   │ 130       │ 55           │ 300          │ 43.3%          │
│ Oncology     │ 90_day   │ 165       │ 75           │ 300          │ 55.0%          │
│ Nephrology   │ 30_day   │ 32        │ 5            │ 200          │ 16.0%          │
│ Nephrology   │ 60_day   │ 65        │ 15           │ 200          │ 32.5%          │
│ Nephrology   │ 90_day   │ 98        │ 28           │ 200          │ 49.0%          │
│ Pulmonology  │ 30_day   │ 42        │ 8            │ 250          │ 16.8%          │
│ Pulmonology  │ 60_day   │ 75        │ 20           │ 250          │ 30.0%          │
│ Pulmonology  │ 90_day   │ 110       │ 35           │ 250          │ 44.0%          │
│ General      │ 30_day   │ 23        │ 2            │ 1,800        │ 1.3%           │
│ General      │ 60_day   │ 45        │ 5            │ 1,800        │ 2.5%           │
│ General      │ 90_day   │ 67        │ 10           │ 1,800        │ 3.7%           │
└──────────────┴──────────┴───────────┴──────────────┴──────────────┴───────────────┘

Data Derivation:
PATIENTS table → patients.department_id
PREDICTIONS table → risk_tier (4 = high, 5 = critical)
→ GROUP BY department, window
→ COUNT(patient_id) WHERE risk_tier >= 4 as high_risk_count
→ COUNT(patient_id) WHERE risk_tier = 5 as critical_risk_count
```

**Specific Recommendations:**

1. **Schema Structure:**
   ```sql
   -- DEPARTMENTS is a small reference table
   CREATE TABLE departments (
       department_id INT PRIMARY KEY,
       department_name VARCHAR(100) UNIQUE,
       department_code VARCHAR(20),
       department_head VARCHAR(100),
       contact_email VARCHAR(100),
       flag_high_risk BOOLEAN DEFAULT TRUE,
       flag_critical_risk BOOLEAN DEFAULT TRUE
   );
   
   -- PATIENTS links to DEPARTMENTS
   ALTER TABLE patients 
   ADD CONSTRAINT fk_department 
   FOREIGN KEY (department_id) REFERENCES departments(department_id);
   
   -- When you assign a patient, they get department_id (1-5)
   ```

2. **View Definition:**
   ```sql
   CREATE MATERIALIZED VIEW dept_risk_distribution AS
   SELECT 
       d.department_id,
       d.department_name,
       d.department_code,
       d.contact_email,
       p_pred.prediction_window,
       COUNT(DISTINCT p_pred.patient_id) as total_patients,
       COUNT(DISTINCT CASE WHEN p_pred.risk_tier >= 4 THEN p_pred.patient_id END) 
           as high_risk_count,
       COUNT(DISTINCT CASE WHEN p_pred.risk_tier = 5 THEN p_pred.patient_id END) 
           as critical_risk_count,
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN p_pred.risk_tier >= 4 
           THEN p_pred.patient_id END) / COUNT(DISTINCT p_pred.patient_id), 2) 
           as high_risk_percentage,
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN p_pred.risk_tier = 5 
           THEN p_pred.patient_id END) / COUNT(DISTINCT p_pred.patient_id), 2) 
           as critical_risk_percentage
   FROM departments d
   LEFT JOIN patients p ON d.department_id = p.department_id
   LEFT JOIN predictions p_pred ON p.patient_id = p_pred.patient_id
   WHERE p_pred.prediction_timestamp = (
       SELECT MAX(prediction_timestamp)
       FROM predictions
       WHERE patient_id = p.patient_id
       AND prediction_window = p_pred.prediction_window
   )
   GROUP BY d.department_id, d.department_name, d.department_code, 
            d.contact_email, p_pred.prediction_window
   ORDER BY d.department_id, p_pred.prediction_window;
   ```

3. **Frontend Integration:**
   ```python
   # Get high/critical risk patients for a specific department
   cursor.execute("""
       SELECT * FROM dept_risk_distribution 
       WHERE department_id = %s AND prediction_window = '30_day'
   """, (dept_id,))
   
   dept_risk_data = cursor.fetchone()
   
   response = {
       'department': dept_risk_data['department_name'],
       'window': '30_day',
       'total_patients': dept_risk_data['total_patients'],
       'high_risk_patients': dept_risk_data['high_risk_count'],
       'critical_risk_patients': dept_risk_data['critical_risk_count'],
       'high_risk_percentage': dept_risk_data['high_risk_percentage'],
       'critical_risk_percentage': dept_risk_data['critical_risk_percentage']
   }
   ```

4. **Actionable Insights:**
   - "Oncology needs intervention for 55% of patients by 90 days"
   - "Cardiology: 12 critical cases in 30-day window"
   - "General department: only 1.3% high-risk (good risk profile)"

---

### Requirement 5: Real-time Model Updates
**"When an individual patient predicts, their info is stored in 3k row database, then it updates by the ML model"**

**Recommended Implementation:**

```
Data Flow for New Patient:
┌──────────────────────────────────────┐
│ New Patient Entry (Manual/Import)    │
│ - Demographics (age, gender, dept)   │
│ - 27 features (conditions, costs)    │
└──────────────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ PATIENTS table INSERT    │
        │ (patient_id generated)   │
        │ data_source='NEW_PATIENT'│
        │ created_at=NOW()         │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ PATIENT_FEATURES INSERT  │
        │ (27 features from input) │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Python: Run Predictions  │
        │ (3 models × 1 patient)   │
        └──────────────┬───────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
        30-day       60-day       90-day
        Model        Model        Model
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ PREDICTIONS INSERT       │
        │ (3 rows: one per window) │
        │ prediction_timestamp=NOW │
        │ model_version='v1.0'     │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Calculate ROI for patient│
        │ (3 rows in ROI table)    │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Update Materialized Views│
        │ - org_tier_summary       │
        │ - dept_risk_distribution │
        │ - roi_positive_patients  │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Log to AUDIT_LOG         │
        │ event='PATIENT_ADDED'    │
        │ changed_by='SYSTEM'      │
        └──────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ Response to Frontend              │
    │ {patient_id: 3001,                │
    │  risk_scores: {...},              │
    │  roi_summary: {...}}              │
    └──────────────────────────────────┘


Database Now Contains:
- Patient 1-3000: Original X_test data
- Patient 3001+: Newly added patients (all stored)

Analytics Updated:
- Tier summaries include new patients
- Dept distribution updated
- Positive ROI list updated

Model Re-evaluation:
When new model trained (v1.1):
┌─────────────────────────┐
│ New Model Available     │
└────────┬────────────────┘
         │
         ▼
    ┌────────────────────────────┐
    │ Option A: Scheduled Update  │
    │ - Run prediction on all     │
    │   3000+ patients monthly    │
    │ - Store new predictions     │
    │ - Keep old predictions      │
    │ - Compare results           │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ INSERT into predictions    │
    │ (same patient_id, new      │
    │  model_version, timestamp) │
    │                            │
    │ Query to track changes:    │
    │ SELECT old.risk_score,     │
    │        new.risk_score,     │
    │        old.risk_tier,      │
    │        new.risk_tier       │
    │ FROM predictions old       │
    │ JOIN predictions new       │
    │ WHERE old.model='v1.0'     │
    │ AND new.model='v1.1'       │
    │ AND old.patient_id=new... │
    └────────────────────────────┘
```

**Specific Recommendations:**

1. **New Patient Insertion Workflow (Python):**
   ```python
   import psycopg2
   from datetime import datetime
   import pandas as pd
   
   def add_new_patient_and_predict(
       age, gender, race, department_id,
       chronic_conditions, utilization_metrics,
       annual_cost, feature_dict
   ):
       """
       Add new patient to DB and generate predictions
       Returns: patient_id, prediction results
       """
       
       try:
           conn = psycopg2.connect(
               host="localhost", port=5433,
               database="risk_predictionDB",
               user="abdullah", password="abdullah123"
           )
           cursor = conn.cursor()
           
           # Step 1: Insert patient
           cursor.execute("""
               INSERT INTO patients 
               (age, gender, race, department_id, annual_cost, 
                data_source, created_by, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING patient_id
           """, (age, gender, race, department_id, annual_cost,
                 'NEW_PATIENT', 'FRONTEND', datetime.now()))
           
           patient_id = cursor.fetchone()[0]
           
           # Step 2: Insert features
           cursor.execute("""
               INSERT INTO patient_features 
               (patient_id, has_chf, has_diabetes, ..., complexity_index)
               VALUES (%s, %s, %s, ..., %s)
           """, (patient_id, feature_dict['has_chf'], ...))
           
           # Step 3: Run predictions
           predictions_results = predict_patient(patient_id, feature_dict)
           
           # Step 4: Store predictions
           for window in ['30_day', '60_day', '90_day']:
               cursor.execute("""
                   INSERT INTO predictions
                   (patient_id, prediction_window, risk_score, 
                    risk_tier, model_version, created_by)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   RETURNING prediction_id
               """, (patient_id, window, 
                     predictions_results[window]['risk_score'],
                     predictions_results[window]['risk_tier'],
                     'v1.0', 'FRONTEND'))
               
               prediction_id = cursor.fetchone()[0]
               
               # Step 5: Calculate ROI
               roi_data = calculate_roi(
                   patient_id, prediction_id, window,
                   annual_cost, predictions_results[window]['risk_tier']
               )
               
               cursor.execute("""
                   INSERT INTO financial_projections
                   (patient_id, prediction_id, projection_window, ...)
                   VALUES (%s, %s, %s, ...)
               """, (patient_id, prediction_id, window, ...))
           
           # Step 6: Log to audit
           cursor.execute("""
               INSERT INTO audit_log
               (event_type, entity_type, entity_id, new_values, changed_by)
               VALUES (%s, %s, %s, %s, %s)
           """, ('PATIENT_ADDED', 'PATIENT', patient_id,
                 json.dumps({'demographics': {...}}), 'FRONTEND'))
           
           # Step 7: Refresh views
           cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary")
           cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY dept_risk_distribution")
           cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY roi_positive_patients")
           
           conn.commit()
           
           return {
               'patient_id': patient_id,
               'predictions': predictions_results,
               'roi': roi_data,
               'status': 'SUCCESS'
           }
           
       except Exception as e:
           conn.rollback()
           return {'status': 'ERROR', 'message': str(e)}
       finally:
           cursor.close()
           conn.close()
   ```

2. **Model Re-evaluation (Scheduled via Backend):**
   ```python
   def monthly_model_reevaluation():
       """
       Run on: 1st of each month via scheduler (APScheduler)
       """
       
       conn = psycopg2.connect(...)
       cursor = conn.cursor()
       
       # Get all patients (both X_test and new)
       cursor.execute("SELECT patient_id FROM patients WHERE is_active = TRUE")
       patient_ids = [row[0] for row in cursor.fetchall()]
       
       # Load features for all patients
       cursor.execute("""
           SELECT patient_id, all_27_features FROM patient_features
       """)
       features_map = {row[0]: row[1] for row in cursor.fetchall()}
       
       # Run predictions with NEW model (v1.1)
       new_predictions = []
       
       for patient_id in patient_ids:
           features = features_map[patient_id]
           
           # Run models v1.1
           for window in ['30_day', '60_day', '90_day']:
               risk_score = models[window].predict_proba(features)[0, 1]
               risk_tier = stratify_to_tier(risk_score)
               
               new_predictions.append({
                   'patient_id': patient_id,
                   'prediction_window': window,
                   'risk_score': risk_score,
                   'risk_tier': risk_tier,
                   'model_version': 'v1.1'
               })
       
       # Batch insert new predictions
       for pred in new_predictions:
           cursor.execute("""
               INSERT INTO predictions
               (patient_id, prediction_window, risk_score, 
                risk_tier, model_version, created_by)
               VALUES (%s, %s, %s, %s, %s, %s)
           """, (pred['patient_id'], pred['prediction_window'],
                 pred['risk_score'], pred['risk_tier'], 'v1.1', 'SYSTEM'))
       
       # Calculate ROI for all new predictions
       # ... (similar ROI calculation logic)
       
       # Refresh all views
       cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary")
       # ... (refresh others)
       
       # Log model update
       cursor.execute("""
           INSERT INTO audit_log
           (event_type, model_version, changed_by)
           VALUES ('MODEL_UPDATE', 'v1.1', 'SYSTEM')
       """)
       
       conn.commit()
       cursor.close()
       conn.close()
   ```

3. **Comparison Query (Track Model Changes):**
   ```sql
   -- Which patients' risk tier changed significantly?
   SELECT 
       p.patient_id,
       p.age,
       p.gender,
       d.department_name,
       old_pred.risk_tier as old_tier_30day,
       new_pred.risk_tier as new_tier_30day,
       old_pred.risk_score as old_score_30day,
       new_pred.risk_score as new_score_30day,
       CASE 
           WHEN new_pred.risk_tier > old_pred.risk_tier THEN 'RISK_INCREASED'
           WHEN new_pred.risk_tier < old_pred.risk_tier THEN 'RISK_DECREASED'
           ELSE 'TIER_UNCHANGED'
       END as tier_change
   FROM predictions old_pred
   JOIN predictions new_pred 
       ON old_pred.patient_id = new_pred.patient_id
       AND old_pred.prediction_window = new_pred.prediction_window
   JOIN patients p ON p.patient_id = old_pred.patient_id
   JOIN departments d ON p.department_id = d.department_id
   WHERE old_pred.model_version = 'v1.0'
   AND new_pred.model_version = 'v1.1'
   AND new_pred.risk_tier != old_pred.risk_tier
   ORDER BY ABS(new_pred.risk_score - old_pred.risk_score) DESC;
   ```

4. **Database Growth Management:**
   ```sql
   -- After 1 year:
   SELECT 
       'patients' as table_name,
       COUNT(*) as row_count,
       pg_size_pretty(pg_total_relation_size('patients')) as size
   FROM patients
   UNION ALL
   SELECT 'predictions', COUNT(*), pg_size_pretty(pg_total_relation_size('predictions'))
   FROM predictions
   UNION ALL
   SELECT 'financial_projections', COUNT(*), pg_size_pretty(...)
   FROM financial_projections;
   
   -- Expected:
   -- patients: ~3,500-5,000 (3K baseline + new)
   -- predictions: ~100K-200K (multiple model versions)
   -- financial_projections: ~100K-200K (matching predictions)
   -- Total DB size: <500 MB
   ```

---

## 📊 Summary: All 5 Requirements Addressed

| Req | Purpose | Storage | Query Pattern | Update Frequency |
|-----|---------|---------|----------------|-------------------|
| 1 | Organization patient registry | `patients` + `patient_features` | "Show all patients" | New patient added (real-time) |
| 2 | Tier distribution analytics | `org_tier_summary` view | "Count by tier by window" | After each prediction (auto) |
| 3 | ROI calculations | `financial_projections` + `roi_positive_patients` view | "Show positive ROI patients" | After each prediction (auto) |
| 4 | Dept risk distribution | `dept_risk_distribution` view | "Show high/critical per dept" | After each prediction (auto) |
| 5 | Real-time model updates | `predictions` with version tracking + `audit_log` | "Compare v1.0 vs v1.1" | Monthly model retraining |

---

## 🎯 Implementation Order (Recommended)

1. **Create base tables** (patients, patient_features, departments) - 30 min
2. **Load 3K X_test patients** - 30 min
3. **Create prediction tables** (predictions, financial_projections) - 30 min
4. **Run initial batch predictions** - 1 hour
5. **Create materialized views** - 30 min
6. **Set up audit logging** - 30 min
7. **Build new patient insertion pipeline** - 1-2 hours
8. **Test model re-evaluation workflow** - 1 hour

**Total**: ~6-8 hours to full working database

Ready to start implementation?
