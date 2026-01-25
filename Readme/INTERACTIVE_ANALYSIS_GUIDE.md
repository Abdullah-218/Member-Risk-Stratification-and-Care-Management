# Interactive Model Analysis - Input Guide

## Overview
Two interactive scripts allow you to input your own parameters via terminal and see REAL trained model output in real-time.

---

## 1. ORGANIZATION-LEVEL ANALYSIS
### Command
```bash
python src/14_interactive_organization_analysis.py
```

### Inputs Needed (in order)

#### Input 1️⃣ : Number of Patients
```
Question: How many patients to analyze? (1-3000, default=100):

Example responses:
  - Press Enter for default: 100 patients
  - Type: 50 (for 50 patients)
  - Type: 500 (for 500 patients)
  - Type: 1000 (for 1000 patients)

Valid range: 1-3000
```

#### Input 2️⃣ : Prediction Window(s)
```
Question: Which prediction window(s)?
   1) 30-day only
   2) 60-day only
   3) 90-day only
   4) All windows (30, 60, 90-day)

Enter choice (1-4, default=4):

Example responses:
  - Press Enter for default: All 3 windows
  - Type: 1 (for 30-day only)
  - Type: 4 (for all windows)
```

#### Input 3️⃣ : Top Patients to Display
```
Question: Show top how many patients? (1-{num_patients}, default=20):

Example responses (if analyzing 100 patients):
  - Press Enter for default: Show top 20
  - Type: 10 (show top 10)
  - Type: 50 (show top 50)

Valid range: 1 to number of patients selected
```

### What Happens
1. **Loads REAL Models**: ExtraTrees (30-day), RandomForest (60-day), CatBoost (90-day)
2. **Samples Patients**: Randomly selects N patients from test data
3. **Sends to Models**: Passes patient features through actual trained ML models
4. **Gets Predictions**: Receives risk scores (0.0-1.0) from models
5. **Calculates ROI**: Determines intervention cost and expected savings
6. **Displays Results**: Shows top patients, tier distribution, program-level metrics
7. **Saves CSV**: Exports detailed results to `data/output/interactive_analysis/`

### Sample Output
```
Organization Analysis - 100 Patients, 30-day Window

TOP 20 PATIENTS (HIGHEST RISK):
Patient ID   Risk Score   Tier  Risk Level   Cost         ROI     
2756         0.6209       4     High         $45,230      99.00%
1628         0.6209       4     High         $32,100      99.00%
...

STATISTICS (All 100 patients):
  Normal      :  85 patients | Avg Risk: 0.0164 | Avg ROI: 5.00%
  Low         :   7 patients | Avg Risk: 0.1445 | Avg ROI: 98.57%
  ...

PROGRAM-LEVEL METRICS:
  Average ROI: 18.12%
  Total Intervention Cost: $8,600.00
  Total Expected Savings: $46,107.50
  Net Benefit: $37,507.50
```

---

## 2. INDIVIDUAL PATIENT ANALYSIS
### Command
```bash
python src/15_interactive_individual_patient_analysis.py
```

### Inputs Needed (in order)

#### Input 1️⃣ : Patient Selection
```
Question: Patient ID or 'random':

Example responses:
  - Type: 640 (for specific patient ID 640)
  - Type: 1050 (for patient 1050)
  - Type: random (for random patient)
  - Type: 0 (for first patient)

Valid range: 0-2999 OR type 'random'
```

#### Input 2️⃣ : Prediction Window(s)
```
Question: Which prediction window(s)?
   1) 30-day only
   2) 60-day only
   3) 90-day only
   4) All windows (30, 60, 90-day)

Enter choice (1-4, default=4):

Example responses:
  - Press Enter for default: All 3 windows
  - Type: 1 (for 30-day only)
  - Type: 3 (for 90-day only)
```

### What Happens
1. **Loads REAL Models**: ExtraTrees (30-day), RandomForest (60-day), CatBoost (90-day)
2. **Retrieves Patient**: Gets patient's feature data by ID
3. **Sends to Models**: Passes patient through each selected model
4. **Gets Predictions**: Receives risk scores from actual trained ML models
5. **Stratifies Risk**: Assigns patient to tier (Normal, Low, Moderate, High, Critical)
6. **Calculates ROI**: Determines intervention cost and ROI for this patient
7. **Generates Recommendations**: Clinical guidance based on risk profile
8. **Saves CSV**: Exports detailed results to `data/output/interactive_analysis/`

### Sample Output
```
PATIENT 640 ANALYSIS
👤 Patient ID: 640
💰 Annual Cost: $9,554.00

30-DAY WINDOW
  Model: ExtraTrees
  Risk Score: 0.1135
  Tier: 2 (Low)
  Intervention Cost: $200.00
  Expected Savings: $955.40
  ROI: 99.00%

60-DAY WINDOW
  Model: RandomForest
  Risk Score: 0.3443
  Tier: 3 (Moderate)
  ...

90-DAY WINDOW
  Model: CatBoost
  Risk Score: 0.7273
  Tier: 4 (High)
  ...

QUICK SUMMARY TABLE
Window        Model          Risk Score   Risk Level   ROI
30-day        ExtraTrees     0.1135       Low          99.00%
60-day        RandomForest   0.3443       Moderate     99.00%
90-day        CatBoost       0.7273       High         99.00%

CLINICAL RECOMMENDATIONS
⚠️  HIGH RISK
   Patient shows High tier risk in 90-DAY window
   Action: Schedule intervention soon
   ROI: 99.00% for intervention
```

---

## 3. RISK TIER REFERENCE

| Tier | Level | Risk Score | Intervention Cost | Expected Savings |
|------|-------|-----------|------------------|-----------------|
| 1 | Normal | 0.00-0.10 | $0 | 0% |
| 2 | Low | 0.10-0.25 | $200 | 10% |
| 3 | Moderate | 0.25-0.50 | $600 | 20% |
| 4 | High | 0.50-0.75 | $1,200 | 25% |
| 5 | Critical | 0.75-1.00 | $2,500 | 30% |

**ROI Calculation:**
```
ROI % = (Expected Savings - Intervention Cost) / Intervention Cost × 100

Example: Patient with $10,000 annual cost, High tier (25% savings rate)
  - Expected Savings = $10,000 × 0.25 = $2,500
  - Intervention Cost = $1,200
  - ROI = ($2,500 - $1,200) / $1,200 × 100 = 108.33%
```

---

## 4. QUICK START EXAMPLES

### Organization Analysis - 100 Patients, All Windows
```bash
python src/14_interactive_organization_analysis.py
# Press Enter 3 times (use all defaults)
```

### Organization Analysis - 250 Patients, 30-day Only
```bash
python src/14_interactive_organization_analysis.py
# Input 1: 250
# Input 2: 1
# Input 3: Press Enter (default 20)
```

### Individual Patient - Specific Patient ID
```bash
python src/15_interactive_individual_patient_analysis.py
# Input 1: 640
# Input 2: 4 (all windows)
```

### Individual Patient - Random Patient, 60-day Only
```bash
python src/15_interactive_individual_patient_analysis.py
# Input 1: random
# Input 2: 2
```

---

## 5. OUTPUT FILES

### Organization Analysis
```
data/output/interactive_analysis/
├── 100_patients_30_day.csv
├── 100_patients_60_day.csv
└── 100_patients_90_day.csv

Columns: patient_id, risk_score, tier, tier_label, base_cost, 
         intervention_cost, expected_savings, roi_percentage
```

### Individual Patient Analysis
```
data/output/interactive_analysis/
└── individual_patient_640_analysis.csv

Columns: patient_id, window, model, risk_score, risk_tier, 
         risk_level, intervention_cost, expected_savings, roi_percentage
```

---

## 6. KEY DIFFERENCES FROM MOCK DATA

| Aspect | Interactive Scripts |
|--------|-------------------|
| **Data Source** | Real patient features (X_test.csv) |
| **Models** | Actual trained ML models |
| **Predictions** | Model probability outputs (0.0-1.0) |
| **Calculation** | Dynamic based on model output |
| **Variability** | Different for each patient |
| **Tier Assignment** | Based on actual risk scores |
| **ROI** | Realistic based on cost data |

---

## 7. VALIDATION CHECKLIST

Before running, verify:
- ✅ Models exist: `models/best_*_day_model.pkl` (should be 3 files)
- ✅ Test data exists: `data/processed/X_test.csv`
- ✅ Output folder created: `data/output/interactive_analysis/` (auto-created)
- ✅ Python environment configured with required packages

Check models:
```bash
ls -la models/best_*_model.pkl
# Should show 3 files: best_30_day_model.pkl, best_60_day_model.pkl, best_90_day_model.pkl
```

Check test data:
```bash
wc -l data/processed/X_test.csv
# Should show 3001 lines (3000 patients + 1 header)
```

---

## 8. TROUBLESHOOTING

### "Patient ID must be between 0 and 2999"
- Valid range: 0-2999 (3000 patients in test set)
- Valid input: `640` or `random`

### "Please enter a number between 1 and 3000"
- For organization analysis, patient count must be 1-3000
- Example: `100` is valid

### "ModelNotFound" or "FileNotFoundError"
- Verify trained models exist: `ls models/best_*_model.pkl`
- Verify test data exists: `ls data/processed/X_test.csv`
- Run full pipeline first: `python run_pipeline.py`

### Model takes too long
- This is normal for large datasets
- 100 patients typically takes 5-10 seconds
- 1000 patients may take 30-60 seconds

---

## Summary

**For Organization Analysis:**
- Inputs: Number of patients, Window(s), Top N to display
- Output: Risk distribution, program-level ROI, patient-level details

**For Individual Patient:**
- Inputs: Patient ID (or random), Window(s)
- Output: Risk profile across windows, ROI, clinical recommendations

**Both use REAL trained models** - not mock/hardcoded data!
