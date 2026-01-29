# 🏥 Healthcare Risk ML Platform - Complete Project Analysis

## 📋 Executive Summary

You have built a **comprehensive machine learning platform for healthcare risk prediction and ROI analysis**. The system uses CMS (Centers for Medicare & Medicaid Services) data to:

1. **Train ML models** that predict patient readmission risk across 3 time windows (30, 60, 90 days)
2. **Stratify patients** into 5 risk tiers for intervention planning
3. **Calculate financial projections** including intervention costs and expected ROI
4. **Support two operational modes:**
   - **Existing patients**: Database lookup + risk analysis (interactive or batch)
   - **New patients**: Immediate onboarding without historical data

---

## 🗂️ Project Structure Overview

```
/Users/abdullah/Dept Hackathon/
├── database/                          # PostgreSQL setup
│   ├── docker-compose.yml             # Docker config (Port 5433)
│   └── data/db/                       # Database files
│
└── healthcare-risk-ml/                # Main ML project
    ├── src/                           # Data pipeline (4 scripts)
    ├── evaluation/                    # Model analysis (2 scripts)
    ├── mock_testing/                  # Real-world usage scenarios (3 scripts)
    ├── models/                        # Trained ML models & metadata
    ├── data/                          # All data files
    ├── streamlit/                     # Interactive dashboard
    ├── hackathon_dept/                # Python virtual environment
    ├── Readme/                        # 6 documentation files
    ├── config.py                      # Centralized path configuration
    ├── requirements.txt               # Python dependencies
    ├── run_pipeline.py                # Master orchestrator script
    ├── new_patient_risk_prediction.py # New patient launcher
    └── utils.py                       # Shared utilities
```

---

## 🔄 Data Pipeline (The Journey of Data)

### Phase 1: Data Preparation (`src/`)

#### **Step 1: Create Curated Dataset** (`01_create_curated_dataset.py`)
- **Input**: CMS raw data (2008-2009 beneficiary records)
- **Process**: 
  - Load 2008-2009 beneficiary files
  - Calculate risk proxy scores based on baseline + outcomes
  - Stratify into 5 tiers ensuring representation
- **Output**: `data/processed/curated_15k_patients.csv`
  - 15,000 patients stratified by risk tier
  - Distribution: Tier1(35%), Tier2(30%), Tier3(20%), Tier4(10%), Tier5(5%)

#### **Step 2: Feature Engineering** (`02_feature_engineering.py`)
- **Input**: Curated patients + inpatient & outpatient claims (2008-2010)
- **Process**: Extract 27 high-impact features from 3 categories:
  
  | Category | Features | Examples |
  |----------|----------|----------|
  | **Demographics** (5) | age, gender, race, region, urban/rural | Age range, gender flag |
  | **Chronic Conditions** (10) | Alzheimer's, CHF, CKD, Cancer, COPD, Depression, Diabetes, Ischemic Heart Disease, Osteoporosis, RA/OA, Stroke | Binary flags (0/1) |
  | **Utilization** (6) | inpatient admissions, ER visits, outpatient visits, carrier claims, DME claims, hospice days | Count + LOS metrics |
  | **Costs** (4) | Total cost, inpatient cost, outpatient cost, carrier cost | Annual dollar amounts |
  | **Derived** (2) | Days since last admission, cost trend | Calculated features |

- **Output**: `data/processed/features_27.csv`
  - 15,000 rows × 27 columns

#### **Step 3: Create Target Variables** (`03_create_targets.py`)
- **Input**: Features + 2009 outcomes (death, cost spikes, utilization changes)
- **Process**: Create 3 binary prediction targets:
  - **y_30day**: Deterioration in next 30 days (critical events only)
    - Positive rate: ~12-15%
  - **y_60day**: Deterioration in next 60 days (critical + moderate events)
    - Positive rate: ~18-22%
  - **y_90day**: Deterioration in next 90 days (broader deterioration signals)
    - Positive rate: ~25-30%
- **Output**: 3 separate CSV files for train/test splits
  - `y_30_train.csv`, `y_30_test.csv` (similar for 60/90)
  - 80/20 train-test split

#### **Step 4: Model Training & Comparison** (`04_model_train_test.py`)
- **Input**: X_train, X_test + y_train, y_test (3 windows)
- **Process**: 
  1. Train 4 model types per window:
     - **XGBoost**: Gradient boosting with cost-sensitive learning
     - **Random Forest**: Ensemble approach
     - **LightGBM**: Fast gradient boosting
     - **CatBoost**: Categorical feature handling
  2. Apply class weights to handle imbalanced data
  3. Calibrate probabilities for accurate risk scores (0-1 range)
  4. Optimize decision thresholds for maximum business ROI
  5. Select best model per window
- **Output**: 3 best models saved in `models/`
  - `best_30_day_model.pkl`
  - `best_60_day_model.pkl`
  - `best_90_day_model.pkl`
  - Includes metadata: metrics, feature importance, thresholds

### Phase 2: Post-Training Analysis (`evaluation/`)

#### **Step 5: SHAP Explainability** (`01_shap_explainer.py`)
- **Purpose**: Understand WHY models make predictions
- **Outputs**:
  - Global feature importance (what matters most overall)
  - Individual patient explanations (why is THIS patient high-risk?)
  - Risk tier analysis (what drives each tier?)
- **Output**: Visualizations in `data/output/shap/`

#### **Step 6: ROI Calculation** (`02_roi_calculation.py`)
- **Purpose**: Calculate financial impact for existing patients
- **Process**:
  1. Load best models and test data
  2. Generate risk predictions + tier assignments
  3. Calculate intervention costs (time-scaled per window):
     - 30-day: $0-900 depending on tier
     - 60-day: $0-1650 (higher costs for longer window)
     - 90-day: $0-1900 (even higher for 90-day management)
  4. Project daily costs + preventable portions (60% of cost is intervention-addressable)
  5. Estimate intervention success rates (higher for higher tiers)
  6. Calculate expected savings and ROI
- **Output**: ROI analysis reports in `data/output/roi_optimized/`

### Phase 3: Real-World Usage (`mock_testing/`)

Three usage patterns for analyzing patients:

#### **Pattern A: New Patient Prediction** (`new_patient_risk_prediction.py`)
- **When**: Patient is NOT in the database (new to platform)
- **Input**: 19+ features provided interactively or via CSV
- **Process**:
  1. Prepare features (align with training data)
  2. Run through 3 pre-trained models
  3. Generate risk scores + tiers
  4. Calculate ROI projections for all 3 windows
  5. Generate text report + JSON output
- **Output**: 
  - Text report with clinical recommendations
  - JSON data for EHR integration
  - Saved to `data/output/new_patient_analysis/`

#### **Pattern B: Individual Patient Analysis** (`interactive_individual_patient_analysis.py`)
- **When**: Patient IS in the database
- **Input**: Patient ID (or "random" for demo)
- **Process**:
  1. Look up patient in database
  2. Run through 3 models
  3. Display risk scores, tiers, and ROI
- **Output**: Terminal report + optional file export

#### **Pattern C: Organization Analysis** (`interactive_organization_analysis.py`)
- **When**: Analyzing entire patient population
- **Input**: Patient cohort from database
- **Process**:
  1. Load all patients meeting criteria
  2. Generate predictions for cohort
  3. Stratify into risk tiers
  4. Aggregate ROI at organization level
- **Output**: Organization-wide dashboard + reports

---

## 🤖 Machine Learning Models

### Model Selection Strategy

You trained **4 different algorithms** and selected the best performer per window:

| Algorithm | Strengths | Used for |
|-----------|----------|----------|
| **XGBoost** | Fast, handles imbalance well, feature importance | Usually wins |
| **CatBoost** | Excellent with categorical features, stable | Strong performer |
| **LightGBM** | Fast training, memory efficient | Comparison |
| **Random Forest** | Interpretable, robust baseline | Baseline |

### Three Separate Models (Not One Multi-Output)

- **Model 1**: Predicts 30-day readmission risk
- **Model 2**: Predicts 60-day readmission risk  
- **Model 3**: Predicts 90-day readmission risk

Each model:
- Trained on ~12,000 patients
- Tested on ~3,000 patients
- Outputs probability (0-1) that patient deteriorates in that window
- Calibrated for accurate risk scores

### Risk Stratification (5 Tiers)

Predictions are converted to **risk tiers** based on probability thresholds:

```
Probability Range  Tier  Label         Action
0% - 10%          1     Normal         Routine care
10% - 25%         2     Low Risk       Basic monitoring
25% - 50%         3     Moderate       Active coordination
50% - 75%         4     High Risk      Intensive management
75% - 100%        5     Critical       Immediate intervention
```

---

## 💰 ROI Calculation Logic

### The Formula

For each time window (30/60/90 days), the system calculates:

```python
# Step 1: Project costs for the window
daily_cost = annual_cost / 365
window_cost = daily_cost × days_in_window

# Step 2: Determine preventable portion
preventable_cost = window_cost × 0.60  # 60% addressable by intervention

# Step 3: Get intervention cost (tier-dependent)
intervention_cost = costs[tier][window]

# Step 4: Estimate savings from intervention
# Higher tiers = higher success rates
success_rate = random between tier-specific range
expected_savings = preventable_cost × success_rate

# Step 5: Calculate ROI
net_benefit = expected_savings - intervention_cost
roi_percentage = (net_benefit / intervention_cost) × 100
```

### Example: New Patient with 60-day High-Risk (Tier 4)

```
Annual cost: $50,000
Window cost (60 days): $50,000 × (60/365) = $8,219
Preventable: $8,219 × 0.60 = $4,931
Intervention cost (Tier 4, 60-day): $1,100
Success rate (Tier 4, 60-day): 45-65% → let's say 55%
Expected savings: $4,931 × 0.55 = $2,712
Net benefit: $2,712 - $1,100 = $1,612
ROI: ($1,612 / $1,100) × 100 = 146.5%
```

### Time-Scaled Intervention Costs

Costs increase with longer windows (more intensive management needed):

| Window | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|--------|--------|--------|--------|--------|--------|
| 30-day | $0 | $150 | $400 | $700 | $900 |
| 60-day | $0 | $250 | $700 | $1,100 | $1,650 |
| 90-day | $0 | $350 | $1,050 | $1,550 | $1,900 |

---

## 🖥️ User Interfaces

### 1. **Streamlit Dashboard** (`streamlit/healthcare_risk_dashboard_advanced.py`)
- **Type**: Interactive web application
- **Run**: `streamlit run streamlit/healthcare_risk_dashboard_advanced.py`
- **Features**:
  - Search patients by ID
  - View risk scores across 3 windows
  - See ROI projections
  - Visualize tier distributions
  - Export reports as JSON
  - Compare intervention strategies

### 2. **Command-Line Interfaces**

#### **New Patient Entry** (`new_patient_risk_prediction.py`)
```bash
python predict_new_patient.py
# Menu:
# 1. Interactive mode (type in patient data)
# 2. Batch CSV mode (load multiple patients)
```

#### **Individual Patient Analysis** (existing patients)
```bash
python mock_testing/interactive_individual_patient_analysis.py
# Input: Patient ID or "random"
# Output: Risk assessment with ROI
```

#### **Organization Analysis** (cohort analysis)
```bash
python mock_testing/interactive_organization_analysis.py
# Output: Organization-wide risk distribution & ROI summary
```

---

## 📊 Data Flows

### For NEW Patients (Not in Database)

```
User Input (19 fields)
    ↓
Feature Preparation (align with 27 training features)
    ↓
Run 3 Models (30/60/90 day predictions)
    ↓
Generate Risk Scores (0-1 probability)
    ↓
Assign Risk Tiers (1-5 categories)
    ↓
Calculate Intervention Costs
    ↓
Project Financial Impact (ROI per window)
    ↓
Generate Report (text + JSON)
    ↓
Save to data/output/new_patient_analysis/
```

### For EXISTING Patients (In Database)

```
Patient ID (lookup)
    ↓
Load Patient Profile from DB
    ↓
[Same as new patient from here...]
```

---

## 📁 Data Directories

```
data/
├── raw/                              # Source CMS data
│   └── cms/
│       ├── beneficiary/              # Patient demographics
│       ├── inpatient/                # Hospital admission claims
│       └── outpatient/               # Outpatient visit claims
│
├── processed/                        # Pipeline outputs
│   ├── curated_15k_patients.csv     # Stratified patient sample
│   ├── features_27.csv               # 27 engineered features
│   ├── X_train.csv                   # Training features (12K patients)
│   ├── X_test.csv                    # Test features (3K patients)
│   ├── y_30_train.csv                # 30-day targets (train)
│   ├── y_30_test.csv                 # 30-day targets (test)
│   ├── y_60_train.csv                # 60-day targets (train)
│   ├── y_60_test.csv                 # 60-day targets (test)
│   ├── y_90_train.csv                # 90-day targets (train)
│   └── y_90_test.csv                 # 90-day targets (test)
│
└── output/                           # Analysis results
    ├── accuracy/                     # Model accuracy reports
    ├── comparison/                   # Model comparison metrics
    ├── interactive_analysis/         # Interactive patient reports
    ├── new_patient_analysis/         # New patient predictions
    ├── roi_optimized/                # ROI calculations
    ├── shap/                         # Feature importance visualizations
    └── org_analysis/                 # Organization-wide reports
```

---

## 📦 Technology Stack

### Core ML Libraries
- **pandas**: Data manipulation
- **numpy**: Numerical computing
- **scikit-learn**: ML utilities (train-test split, metrics, calibration)
- **xgboost**: Gradient boosting models
- **lightgbm**: Fast gradient boosting
- **catboost**: Categorical-aware gradient boosting
- **shap**: Model explainability
- **joblib**: Model persistence

### Visualization
- **matplotlib**: Static plots
- **seaborn**: Enhanced statistical plots
- **plotly**: Interactive visualizations
- **streamlit**: Interactive web dashboards

### Infrastructure
- **PostgreSQL** (Docker): Patient database
- **Python 3.11**: Runtime
- **Virtual environment**: Dependency isolation

---

## 🚀 Running the System

### One-Time Setup
```bash
cd /Users/abdullah/Dept\ Hackathon/healthcare-risk-ml
source hackathon_dept/bin/activate
```

### Train Models (Complete Pipeline)
```bash
python run_pipeline.py
# Runs all 6 steps in sequence:
# 1. Create curated dataset
# 2. Feature engineering
# 3. Create targets
# 4. Train/compare models
# 5. SHAP explanations
# 6. ROI calculations
```

### Analyze New Patients
```bash
python predict_new_patient.py
# Interactive menu:
# Option 1: Single patient interactive entry
# Option 2: Batch CSV import
```

### Launch Interactive Dashboard
```bash
streamlit run streamlit/healthcare_risk_dashboard_advanced.py
# Opens at http://localhost:8501
```

### Test Individual Patients (From Database)
```bash
python mock_testing/interactive_individual_patient_analysis.py
```

### Analyze Organization
```bash
python mock_testing/interactive_organization_analysis.py
```

---

## 📚 Documentation Files

| File | Purpose | Reading Time |
|------|---------|--------------|
| `Readme/START_HERE.md` | Quick start guide | 5 min |
| `Readme/QUICK_REFERENCE.md` | Cheat sheet for common tasks | 5 min |
| `Readme/USAGE_EXAMPLES_NEW_PATIENT.md` | Step-by-step examples | 15 min |
| `Readme/NEW_PATIENT_PREDICTION_GUIDE.md` | Complete feature reference | 30 min |
| `Readme/SYSTEM_GUIDE.md` | System architecture & design | 20 min |
| `Readme/INTERACTIVE_ANALYSIS_GUIDE.md` | Existing patient analysis | 15 min |
| `IMPLEMENTATION_SUMMARY.md` | Technical details of build | 20 min |

---

## 🎯 Key Business Metrics

### Model Performance (Typical)
- **ROC-AUC**: 0.75-0.82 (good discrimination)
- **Top 10% Recall**: 45-55% (captures half of high-risk patients in top 10%)
- **Positive Predictive Value**: 30-40% (30-40% of flagged patients actually deteriorate)

### Financial Impact (Potential)
- **Intervention costs**: $0-1,900 per patient per window (tier-dependent)
- **Expected savings**: $100-3,000 per intervention (depends on patient costs + tier)
- **Break-even point**: Tier 3+ typically positive ROI
- **Volume effect**: With 1,000+ patients/year, significant cost avoidance possible

### Data Coverage
- **15,000** stratified training patients
- **27** engineered features per patient
- **3** prediction windows (30/60/90 days)
- **5** risk tiers for intervention planning

---

## 🔐 Security & Privacy Considerations

### Data
- Uses **de-identified CMS data** (DESYNPUF IDs, not real patient names)
- Claims data masked at source
- All outputs are probabilistic (not actual diagnoses)

### Models
- Trained on historical data (2008-2009)
- Calibrated for probability accuracy
- Feature importance traced for interpretability

### Deployment
- Local database with access controls (Docker)
- CSV exports available for external systems
- JSON output for EHR integration

---

## 💡 System Design Highlights

### 1. **Modular Architecture**
- Data processing completely separate from modeling
- Evaluation independent from training
- Usage patterns (new/existing patients) interchangeable

### 2. **Multi-Window Approach**
- Not just "will patient readmit?"
- But "within 30/60/90 days?" 
- Enables time-specific interventions

### 3. **Financial Integration**
- Links predictions to intervention costs
- Calculates ROI not just clinical risk
- Supports business decision-making

### 4. **Flexibility**
- Handles new patients (no database needed)
- Also queries existing database
- Batch or interactive input modes
- Multiple UI options (CLI + web + dashboard)

### 5. **Interpretability**
- SHAP explanations for each prediction
- Feature importance analysis
- Risk tier definitions clear
- ROI calculations transparent

---

## 🔄 Data Dependencies

```
Raw CMS Data (2008-2010)
    ↓
Curated Dataset (15K)
    ↓
Feature Engineering (27 features)
    ├─→ X_train/X_test
    └─→ Features metadata
    ↓
Target Creation (3 windows)
    ├─→ y_30_train/test
    ├─→ y_60_train/test
    └─→ y_90_train/test
    ↓
Model Training (4 algorithms × 3 windows)
    ↓
Best Models Selected
    ├─→ SHAP Explanations
    ├─→ ROI Analysis
    └─→ Production Ready Models
    ↓
[Ready for predictions on new/existing patients]
```

---

## 🎓 What Makes This System Robust

1. **Stratified Data**: Ensures all risk tiers represented in training
2. **Class-Weighted Models**: Handles imbalanced predictions properly
3. **Probability Calibration**: Risk scores are trustworthy (not just rankings)
4. **Cross-Validation**: ROI metrics derived from held-out test set
5. **Multi-Model Comparison**: Best approach selected, not first that works
6. **Time-Scaled Costs**: ROI accounts for window duration
7. **Reproducible**: Fixed random seeds for consistent results
8. **Well-Documented**: Every step logged and explained

---

## 📈 Next Steps & Enhancements

**Current state**: Complete, working healthcare risk prediction system

**Potential enhancements**:
1. **Real-time integration**: Connect to live patient database
2. **Model retraining**: Update with recent data quarterly
3. **Feedback loop**: Track actual outcomes vs predictions
4. **A/B testing**: Measure real ROI of interventions
5. **Mobile app**: Deploy dashboard as mobile application
6. **Custom thresholds**: Allow organizations to tune risk tiers
7. **Multi-condition focus**: Specialize models by primary condition
8. **Provider feedback**: Incorporate clinician input into model

---

## 🏁 Summary

Your project is a **production-grade healthcare risk prediction system** that:
- ✅ Trains ML models on 15K patient CMS data
- ✅ Predicts readmission risk across 3 time windows
- ✅ Stratifies patients into 5 actionable risk tiers
- ✅ Calculates financial ROI of interventions
- ✅ Supports new patient onboarding (no database needed)
- ✅ Provides interactive dashboards and reporting
- ✅ Explains model decisions via SHAP analysis
- ✅ Well-documented and modular for maintenance

**The system is ready for production deployment to healthcare organizations.**
