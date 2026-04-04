# 🔍 DETAILED SYSTEM FLOW ANALYSIS

## ❓ YOUR QUESTIONS ANSWERED

### **1. Do we use different models for different risk windows or the same model?**

**Answer: DIFFERENT MODELS for each risk window** ✅

You have **3 separate trained models**, one for each prediction window:

| Risk Window | Model File | Algorithm | ROC-AUC |
|------------|-----------|-----------|---------|
| **30-day** | `best_30_day_model.pkl` | **Random Forest** | 0.78 |
| **60-day** | `best_60_day_model.pkl` | **ExtraTrees** | 0.81 |
| **90-day** | `best_90_day_model.pkl` | **LightGBM** | 0.82 |

#### **Why different models?**

Each window has **different target definitions**:
- **30-day**: Critical events (death, severe cost spike >100%, top 5% costs)
- **60-day**: Critical + High risk (cost spike >75%, top 10% costs)
- **90-day**: 60-day + Broader deterioration signals

During training ([`04_model_train_test.py`](healthcare-risk-ml/src/04_model_train_test.py)), 5 algorithms were tested:
- XGBoost
- Random Forest
- LightGBM
- CatBoost
- ExtraTrees

**The BEST performing model was selected for each window** based on:
- ROC-AUC
- Precision@Top10%
- Recall@Top10%
- ROI-optimized threshold

---

### **2. What is `recalc_aggregations.py` for?**

**Purpose**: Updates database aggregate statistics after new patients are added

**Location**: [`healthcare-risk-ml/db_manager/recalc_aggregations.py`](healthcare-risk-ml/db_manager/recalc_aggregations.py)

#### **What it does:**

```python
# Clears old aggregations
DELETE FROM organization_predictions
DELETE FROM tier_statistics

# Recalculates organization-level stats
INSERT INTO organization_predictions (
  total_patients,
  tier_1_count, tier_2_count, tier_3_count, tier_4_count, tier_5_count,
  avg_risk_score,
  avg_roi_percent,
  total_net_benefit
)

# Recalculates tier-level stats
INSERT INTO tier_statistics (
  total_patients,
  avg_risk_score,
  avg_cost,
  avg_roi_percent,
  readmission_risk
)
```

#### **When to run:**
- After bulk patient uploads
- After department reassignments
- After database migrations
- To fix inconsistent aggregations

**Example use case:**
```bash
cd healthcare-risk-ml/db_manager
python recalc_aggregations.py
```

This ensures the **Organization Dashboard** shows correct metrics:
- Total patient count
- Distribution across tiers
- Average ROI by tier
- Expected savings

---

### **3. What's the logic behind ROI calculation?**

**File**: [`evaluation/02_roi_calculation.py`](healthcare-risk-ml/evaluation/02_roi_calculation.py)

#### **ROI Formula (Time-Scaled)**

```python
# Step 1: Calculate projected cost for the window
projected_cost = (annual_cost / 365) × days
# Example: $50,000/year → $4,110 for 30 days

# Step 2: Get time-scaled intervention cost (tier & window specific)
intervention_cost = COSTS[window][tier]
# Example: 30-day Tier 3 = $800

# Step 3: Get success rate (tier & window specific)
success_rate = random.uniform(min_rate, max_rate)  # Tier-based range
# Example: Tier 3 30-day = 25%-40% → 32.5%

# Step 4: Calculate expected savings
expected_savings = projected_cost × success_rate
# Example: $4,110 × 0.325 = $1,336

# Step 5: Calculate net benefit
net_benefit = expected_savings - intervention_cost
# Example: $1,336 - $800 = $536

# Step 6: Calculate ROI (capped at 100%)
roi_percent = (net_benefit / intervention_cost) × 100
roi_percent = min(max(roi_percent, 0.0), 100.0)
# Example: ($536 / $800) × 100 = 67%
```

#### **Intervention Costs (Time-Scaled by Window & Tier)**

```python
intervention_costs = {
    '30_day': {1: 0, 2: 400, 3: 800, 4: 1200, 5: 1500},
    '60_day': {1: 0, 2: 700, 3: 1400, 4: 2000, 5: 2800},
    '90_day': {1: 0, 2: 1000, 3: 2000, 4: 3000, 5: 4000}
}
```

#### **Success Rate Ranges (by Tier & Window)**

```python
success_rate_ranges = {
    '30_day': {
        1: (3%, 8%),    # Minimal monitoring
        2: (10%, 20%),  # Low intervention
        3: (25%, 40%),  # Moderate intervention
        4: (30%, 50%),  # Intensive intervention
        5: (40%, 60%)   # Critical intervention
    },
    '60_day': {
        1: (10%, 25%),  # Extended monitoring
        2: (25%, 40%),  # Early intervention
        3: (35%, 55%),  # Moderate intervention
        4: (45%, 65%),  # Intensive intervention
        5: (55%, 75%)   # Critical intervention
    },
    '90_day': {
        1: (20%, 35%),  # Long-term monitoring
        2: (35%, 50%),  # Early intervention
        3: (45%, 60%),  # Moderate intervention
        4: (60%, 80%),  # Intensive intervention
        5: (70%, 90%)   # Critical intervention
    }
}
```

#### **Why different costs/rates per window?**
- **30-day**: Short-term, urgent interventions (high intensity, lower success due to time)
- **60-day**: Medium-term interventions (more time to work, better success rates)
- **90-day**: Long-term interventions (most time, highest success rates)

---

### **4. For individual patient prediction, which file is run and how does it work?**

**Answer: `new_patient_risk_prediction.py`** 

**Location**: [`healthcare-risk-ml/new_patient_risk_prediction.py`](healthcare-risk-ml/new_patient_risk_prediction.py)

---

## 📊 COMPLETE INDIVIDUAL PATIENT PREDICTION FLOW

### **Step-by-Step Process**

```
┌──────────────────────────────────────────────────────────────┐
│ USER ACTION: Fills assessment form in React frontend         │
│ Location: http://localhost:5173/                            │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: Frontend collects data                               │
│ File: frontend/src/common/services/assessmentApi.js         │
└──────────────────────────────────────────────────────────────┘

const assessmentData = {
  demographics: {
    age: 72,
    gender: 'female',
    race: 1,
    total_annual_cost: 35000
  },
  conditions: {
    has_alzheimers: false,
    has_chf: true,
    has_ckd: true,
    has_diabetes: true,
    // ... 11 total conditions
  },
  utilization: {
    total_admissions: 2,
    total_hospital_days: 14,
    days_since_last_admission: 45,
    total_outpatient_visits: 8
  }
}

                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: POST to Backend API                                  │
│ Endpoint: POST http://localhost:3000/api/assessment/predict │
│ File: backend/src/routes/assessment.routes.js               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Backend transforms & calls Python                    │
│ File: backend/src/services/mlPredictionService.js           │
└──────────────────────────────────────────────────────────────┘

// Transform frontend format → Python format (19 raw fields)
const pythonInput = {
  age: 72,
  gender: 2,  // 1=Male, 2=Female
  race: 1,
  total_annual_cost: 35000,
  has_chf: 1,
  has_ckd: 1,
  has_diabetes: 1,
  total_admissions: 2,
  total_hospital_days: 14,
  // ... all fields
}

// Spawn Python process
spawn('python3', [
  'new_patient_risk_prediction.py',
  '--json-input', JSON.stringify(pythonInput),
  '--patient-id', 'WEB_1234567890',
  '--save-to-db', 'true'
])

                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Python ML Service Starts                             │
│ File: healthcare-risk-ml/new_patient_risk_prediction.py     │
│ Class: NewPatientRiskPredictor                               │
└──────────────────────────────────────────────────────────────┘
```

---

### **PYTHON PROCESSING (The Heart of Prediction)**

#### **4.1 Initialize & Load Models**

```python
def __init__(self):
    # Load 3 trained models
    self.models = {
        '30_day': joblib.load('models/best_30_day_model.pkl'),
        '60_day': joblib.load('models/best_60_day_model.pkl'),
        '90_day': joblib.load('models/best_90_day_model.pkl')
    }
    
    # Load feature names from training data
    X_train = pd.read_csv('data/processed/X_train.csv')
    self.feature_names = X_train.columns.tolist()  # 27 features
```

#### **4.2 Engineer Features (19 raw → 27 features)**

```python
def engineer_features(self, raw_patient_data):
    """
    Transform 19 raw inputs into 27 ML features
    """
    features = {}
    
    # ── DEMOGRAPHICS (5 features) ──
    features['age'] = raw_patient_data['age']
    features['is_female'] = 1 if raw_patient_data['gender'] == 2 else 0
    features['is_elderly'] = 1 if features['age'] >= 75 else 0
    features['race_encoded'] = {1: 0, 2: 1, 3: 2, 5: 3}.get(raw_data['race'], 4)
    features['has_esrd'] = raw_patient_data.get('has_esrd', 0)
    
    # ── CHRONIC CONDITIONS (10 features) ──
    features['has_alzheimers'] = raw_patient_data['has_alzheimers']
    features['has_chf'] = raw_patient_data['has_chf']
    features['has_ckd'] = raw_patient_data['has_ckd']
    # ... 7 more conditions
    
    chronic_count = sum([features[c] for c in condition_fields])
    
    # ── UTILIZATION (6 features) ──
    features['total_admissions_2008'] = raw_patient_data['total_admissions']
    features['total_hospital_days_2008'] = raw_patient_data['total_hospital_days']
    features['days_since_last_admission'] = raw_patient_data['days_since_last_admission']
    features['recent_admission'] = 1 if features['days_since_last_admission'] <= 90 else 0
    features['total_outpatient_visits_2008'] = raw_patient_data['total_outpatient_visits']
    features['high_outpatient_user'] = 1 if features['total_outpatient_visits_2008'] > 10 else 0
    
    # ── COSTS (4 features) ──
    features['total_annual_cost'] = raw_patient_data['total_annual_cost']
    features['cost_percentile'] = calculate_percentile(features['total_annual_cost'])
    features['high_cost'] = 1 if features['cost_percentile'] > 0.75 else 0
    features['total_inpatient_cost'] = features['total_annual_cost'] * 0.6
    
    # ── DERIVED (2 features) ──
    age_component = (features['age'] - 65) / 30
    features['frailty_score'] = (
        age_component * 0.4 +
        (chronic_count / 10) * 0.4 +
        features['high_cost'] * 0.2
    )
    features['complexity_index'] = chronic_count * features['cost_percentile']
    
    return features  # 27 features
```

#### **4.3 Prepare Feature Vector**

```python
def prepare_features(self, patient_features):
    """
    Convert feature dict to numpy array in EXACT training order
    """
    # Create feature dict matching training data
    features = {feature: 0.0 for feature in self.feature_names}
    
    # Fill with patient data
    for key, value in patient_features.items():
        if key in features:
            features[key] = float(value)
    
    # Convert to DataFrame for alignment
    feature_df = pd.DataFrame([features])
    feature_df = feature_df[self.feature_names]  # Ensure correct order
    
    return feature_df.values[0]  # Return numpy array
```

#### **4.4 Predict Risk for All 3 Windows**

```python
def predict_risk_windows(self, patient_features):
    """
    Run predictions through all 3 models
    """
    X_patient = patient_features.reshape(1, -1)
    results = {}
    
    for window in ['30_day', '60_day', '90_day']:
        model = self.models[window]  # Get window-specific model
        
        # Get probability prediction (class 1 = deterioration)
        risk_score = model.predict_proba(X_patient)[0, 1]
        
        # Stratify to tier (1-5)
        tier = stratify_to_tier(risk_score)
        
        results[window] = {
            'risk_score': risk_score,      # e.g., 0.42
            'tier': tier,                   # e.g., 3
            'tier_label': 'Moderate Risk',
            'description': 'Proactive care coordination recommended'
        }
    
    return results

def stratify_to_tier(risk_score):
    """Convert continuous risk score to 5-tier category"""
    if risk_score < 0.10:   return 1  # Normal
    elif risk_score < 0.25: return 2  # Low
    elif risk_score < 0.50: return 3  # Moderate
    elif risk_score < 0.75: return 4  # High
    else:                   return 5  # Critical
```

**Example Output:**
```python
{
  '30_day': {'risk_score': 0.42, 'tier': 3, 'tier_label': 'Moderate Risk'},
  '60_day': {'risk_score': 0.58, 'tier': 4, 'tier_label': 'High Risk'},
  '90_day': {'risk_score': 0.67, 'tier': 4, 'tier_label': 'High Risk'}
}
```

#### **4.5 Calculate ROI Projections**

```python
def calculate_3_window_projection(self, patient_data, predictions):
    """
    Calculate financial projections for all 3 windows
    """
    annual_cost = patient_data['total_annual_cost']
    projection = {}
    
    for window, days in [('30_day', 30), ('60_day', 60), ('90_day', 90)]:
        tier = predictions[window]['tier']
        risk_score = predictions[window]['risk_score']
        
        # Project cost for window (time-scaled)
        projected_cost = (annual_cost * days) / 365
        
        # Get intervention cost (tier & window specific)
        intervention_cost = self.intervention_costs[window][tier]
        
        # Get random success rate (tier & window specific)
        min_rate, max_rate = self.success_rate_ranges[window][tier]
        success_rate = random.uniform(min_rate, max_rate)
        
        # Calculate ROI
        expected_savings = projected_cost * success_rate
        net_benefit = expected_savings - intervention_cost
        roi_percent = (net_benefit / intervention_cost) * 100 if intervention_cost > 0 else 0
        roi_percent = min(max(roi_percent, 0.0), 100.0)  # Cap 0-100%
        
        projection[window] = {
            'projected_cost': projected_cost,
            'intervention_cost': intervention_cost,
            'success_rate': success_rate,
            'expected_savings': expected_savings,
            'net_benefit': net_benefit,
            'roi_percent': roi_percent,
            'tier': tier
        }
    
    return projection
```

**Example Output:**
```python
{
  '30_day': {
    'projected_cost': 2877,
    'intervention_cost': 800,
    'success_rate': 0.32,
    'expected_savings': 921,
    'net_benefit': 121,
    'roi_percent': 15.1,
    'tier': 3
  },
  '60_day': {...},
  '90_day': {...}
}
```

#### **4.6 Generate SHAP Explanations**

```python
def explain_prediction_with_shap(self, patient_features, predictions):
    """
    Calculate SHAP values to explain risk drivers
    """
    import shap
    
    X_patient = patient_features.reshape(1, -1)
    explanations = {}
    
    for window in ['30_day', '60_day', '90_day']:
        model = self.models[window]
        
        # Create SHAP explainer
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_patient)
        
        # Get top 5 risk drivers
        feature_importance = list(zip(
            self.feature_names,
            shap_values[1][0]  # Class 1 (deterioration)
        ))
        feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
        
        explanations[window] = {
            'top_5_drivers': [
                {
                    'feature': feat,
                    'impact': float(impact),
                    'direction': 'increases' if impact > 0 else 'decreases'
                }
                for feat, impact in feature_importance[:5]
            ]
        }
    
    return explanations
```

**Example Output:**
```python
{
  '30_day': {
    'top_5_drivers': [
      {'feature': 'total_annual_cost', 'impact': 0.15, 'direction': 'increases'},
      {'feature': 'has_chf', 'impact': 0.12, 'direction': 'increases'},
      {'feature': 'age', 'impact': 0.09, 'direction': 'increases'},
      {'feature': 'frailty_score', 'impact': 0.07, 'direction': 'increases'},
      {'feature': 'has_ckd', 'impact': 0.06, 'direction': 'increases'}
    ]
  }
}
```

#### **4.7 Save to Database**

```python
def store_to_database(self, patient_id, patient_data, predictions, projection):
    """
    Store patient + predictions + ROI to PostgreSQL
    """
    cursor = self.conn.cursor()
    
    # 1. Insert patient
    dept_id, dept_name = assign_department(patient_data)
    cursor.execute("""
        INSERT INTO patients 
        (organization_id, department_id, external_id, age, gender, annual_cost, data_source)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING patient_id
    """, (1, dept_id, patient_id, age, gender, annual_cost, 'NEW_PATIENT'))
    
    patient_id_db = cursor.fetchone()[0]
    
    # 2. Insert patient features (27 features)
    cursor.execute("""
        INSERT INTO patient_features (patient_id, age, is_female, has_chf, ...)
        VALUES (%s, %s, %s, %s, ...)
    """, (patient_id_db, ...))
    
    # 3. Insert predictions (3 windows)
    for window in ['30_day', '60_day', '90_day']:
        cursor.execute("""
            INSERT INTO predictions (patient_id, prediction_window, risk_score, risk_tier)
            VALUES (%s, %s, %s, %s)
            RETURNING prediction_id
        """, (patient_id_db, window, risk_score, tier))
        
        prediction_id = cursor.fetchone()[0]
        
        # 4. Insert financial projections
        cursor.execute("""
            INSERT INTO financial_projections 
            (patient_id, prediction_id, prediction_window, window_cost, 
             intervention_cost, success_rate, expected_savings, net_benefit, roi_percent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (patient_id_db, prediction_id, window, ...))
    
    self.conn.commit()
    
    # 5. Update aggregation tables (optional)
    _update_aggregation_tables(cursor, patient_id_db)
    
    return patient_id_db
```

#### **4.8 Return JSON to Backend**

```python
# Construct final JSON output
output = {
    'success': True,
    'patient_id_db': patient_id_db,
    'predictions': {
        '30_day': {
            'risk_probability': 0.42,
            'tier': 3,
            'tier_label': 'Moderate Risk',
            'roi_percent': 15.1,
            'intervention_cost': 800,
            'expected_savings': 921,
            'shap_top_5': [...]
        },
        '60_day': {...},
        '90_day': {...}
    }
}

# Print to stdout (captured by Node.js)
print(json.dumps(output))
```

---

```
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Backend receives JSON from Python                    │
│ File: backend/src/services/mlPredictionService.js           │
└──────────────────────────────────────────────────────────────┘

python.stdout.on('data', (data) => {
  dataString += data.toString();
});

python.on('close', (code) => {
  const result = JSON.parse(dataString);
  resolve(result);
});

                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: Backend transforms & returns to Frontend             │
│ File: backend/src/routes/assessment.routes.js               │
└──────────────────────────────────────────────────────────────┘

res.json({
  success: true,
  patient_id_db: 3003,
  predictions: { '30_day': {...}, '60_day': {...}, '90_day': {...} }
});

                           ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: Frontend displays results                            │
│ File: frontend/src/individual_assessment_ui/                │
│       AssessmentReportPage.jsx                               │
└──────────────────────────────────────────────────────────────┘

• Risk Gauges (30/60/90-day)
• Tier Badges (color-coded 1-5)
• SHAP Explanations (collapsible)
• ROI Projections
• AI Recommendations
• Email Report (mock)
```

---

## 🔑 KEY TAKEAWAYS

### **1. Different Models Per Window**
- ✅ 30-day uses **Random Forest**
- ✅ 60-day uses **ExtraTrees**
- ✅ 90-day uses **LightGBM**
- Each optimized for its specific target definition

### **2. ROI Calculation**
- **Time-scaled** costs (30/60/90-day proportional)
- **Tier-specific** intervention costs
- **Window-specific** success rates
- **Capped at 100%** for realism
- Formula: `ROI = (expected_savings - intervention_cost) / intervention_cost × 100`

### **3. Individual Prediction File**
- **Main File**: `new_patient_risk_prediction.py`
- **Entry Point**: Called via Node.js `spawn()` with `--json-input`
- **Process**: 19 raw inputs → 27 engineered features → 3 models → 3 predictions → ROI → SHAP → Database
- **Output**: JSON with risk scores, tiers, ROI, and explanations

### **4. Database Aggregations**
- **File**: `recalc_aggregations.py`
- **Purpose**: Update organization/tier statistics after patient additions
- **Tables**: `organization_predictions`, `tier_statistics`

---

## 📂 FILES SUMMARY

| Purpose | File | Key Functions |
|---------|------|---------------|
| **Training** | `04_model_train_test.py` | Train 3 separate models |
| **Individual Prediction** | `new_patient_risk_prediction.py` | Predict new patient risk |
| **ROI Analysis** | `02_roi_calculation.py` | Calculate ROI for existing patients |
| **DB Aggregations** | `recalc_aggregations.py` | Update statistics |
| **Backend Bridge** | `mlPredictionService.js` | Node.js ↔ Python interface |
| **API Endpoint** | `assessment.routes.js` | `/api/assessment/predict` |

---

**Last Updated**: February 20, 2026
