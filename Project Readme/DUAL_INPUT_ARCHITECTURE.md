# 🏥 Data Architecture: X_test vs New Patient Data - The Critical Decision

**Date**: January 29, 2026  
**Status**: Architecture Planning

---

## ❌ The Problem You've Identified

### Current Situation:
```
X_test.csv (3,001 rows)
  ├─ ALREADY feature-engineered
  ├─ Contains 27 PROCESSED features (frailty_score, complexity_index, etc.)
  ├─ NOT raw patient data
  └─ Cannot recreate raw input from these features (information lost)

New Patient Data (Real-time from frontend)
  ├─ WILL BE raw (age, conditions, costs only)
  ├─ NOT feature-engineered yet
  ├─ Needs transformation pipeline
  └─ Cannot directly feed to models
```

### The Core Issue:
```
Your ML model expects: 27 processed features
                      ↓
X_test provides:      27 processed features ✅
New patient provides: ~10-15 raw fields ❌

Can't mix these! Need to transform raw → processed
```

---

## 🎯 Solution: Create a Dual-Input Architecture

You need **TWO data paths**, not one:

```
┌─────────────────────────────────────────────────────────────┐
│                   PREDICTION SYSTEM FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT PATH 1: X_TEST (Pre-engineered)                       │
│  ────────────────────────────────────────────────────────   │
│  X_test.csv (27 features) → Load directly → Model → Predict │
│                                                              │
│  INPUT PATH 2: NEW PATIENT (Raw data)                        │
│  ────────────────────────────────────────────────────────   │
│  Raw input (10-15 fields) → Feature Engineering → Model      │
│                            ↑                                 │
│                      (Transform using same                   │
│                       engineering pipeline as                │
│                       training data)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 What Data Do You Have vs Need?

### X_test.csv Features (27 total - PROCESSED)

```
Demographics (3):
  1. age
  2. is_female
  3. is_elderly
  
Chronic Conditions (10):
  4. has_esrd
  5. has_alzheimers
  6. has_chf
  7. has_ckd
  8. has_cancer
  9. has_copd
  10. has_depression
  11. has_diabetes
  12. has_ischemic_heart
  13. has_ra_oa
  14. has_stroke
  
Utilization Metrics (5):
  15. total_admissions_2008
  16. total_hospital_days_2008
  17. days_since_last_admission
  18. recent_admission
  19. total_outpatient_visits_2008
  
Cost Data (3):
  20. total_annual_cost
  21. cost_percentile          ← DERIVED (need to calculate)
  22. high_cost                ← DERIVED (need to calculate)
  
Financial (2):
  23. total_inpatient_cost
  24. high_outpatient_user     ← DERIVED (need to calculate)
  
Risk Metrics (2):
  25. frailty_score            ← DERIVED (need to calculate)
  26. complexity_index         ← DERIVED (need to calculate)
  27. race_encoded
```

### New Patient Raw Input (What frontend will send - ~15 fields)

```
Demographics (3):
  • age (raw number)
  • gender (raw: M/F)
  • race (raw: White/Black/Hispanic/etc.)

Chronic Conditions (10):
  • diabetes (0/1)
  • hypertension (0/1)
  • heart_disease (0/1)
  • copd (0/1)
  • asthma (0/1)
  • kidney_disease (0/1)
  • depression (0/1)
  • cancer (0/1)
  • stroke (0/1)
  • arthritis (0/1)

Utilization (6):
  • inpatient_visits (count)
  • er_visits (count)
  • outpatient_visits (count)
  • urgent_care_visits (count)
  • pharmacy_claims (count)
  • specialist_visits (count)

Financial (1):
  • annual_cost (raw dollar amount)

TOTAL: ~15 fields (NOT feature-engineered)
```

---

## ✅ The Solution: Feature Engineering Pipeline for New Patients

### Option A: Keep ML Model Unchanged (RECOMMENDED)

**Step 1: Store Raw Data As-Is**

In your database:
```sql
CREATE TABLE patient_raw_input (
    patient_id BIGINT PRIMARY KEY,
    age INT,
    gender VARCHAR(10),
    race VARCHAR(50),
    has_diabetes INT,
    has_hypertension INT,
    has_heart_disease INT,
    has_copd INT,
    has_asthma INT,
    has_kidney_disease INT,
    has_depression INT,
    has_cancer INT,
    has_stroke INT,
    has_arthritis INT,
    inpatient_visits INT,
    er_visits INT,
    outpatient_visits INT,
    urgent_care_visits INT,
    pharmacy_claims INT,
    specialist_visits INT,
    annual_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Step 2: Create Feature Engineering Function**

This function transforms raw → processed (matches X_test format):

```python
# feature_engineering_for_new_patients.py

import pandas as pd
import numpy as np
import joblib
from pathlib import Path

class NewPatientFeatureEngineer:
    """
    Transform raw patient input into 27 processed features
    to match X_test format (required by trained models)
    """
    
    def __init__(self):
        # Load reference statistics from X_test for normalization
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        self.reference_stats = self._calculate_reference_stats()
    
    def _calculate_reference_stats(self):
        """
        Calculate percentiles from X_test for normalization
        So new patients are scored against baseline population
        """
        return {
            'age': {
                'mean': self.X_test['age'].mean(),
                'std': self.X_test['age'].std()
            },
            'total_annual_cost': {
                'min': self.X_test['total_annual_cost'].min(),
                'max': self.X_test['total_annual_cost'].max(),
                'percentile_values': self.X_test['total_annual_cost'].quantile(
                    np.linspace(0, 1, 101)
                )
            },
            'total_outpatient_visits': {
                'mean': self.X_test['total_outpatient_visits_2008'].mean(),
                'high_threshold': self.X_test['total_outpatient_visits_2008'].quantile(0.75)
            }
        }
    
    def transform_raw_to_features(self, raw_patient_data):
        """
        Transform raw patient data (from frontend/form) 
        into 27 processed features (ready for model)
        
        Input: Dictionary with raw fields
        Output: Dictionary with 27 engineered features (matches X_test)
        """
        
        features = {}
        
        # ==========================================
        # 1. DEMOGRAPHICS (3 features)
        # ==========================================
        
        features['age'] = raw_patient_data['age']
        
        # Convert gender to is_female
        features['is_female'] = 1 if raw_patient_data['gender'].lower() == 'f' else 0
        
        # is_elderly: flag if age >= 65
        features['is_elderly'] = 1 if raw_patient_data['age'] >= 65 else 0
        
        # Encode race
        race_mapping = {
            'white': 0,
            'black': 1,
            'hispanic': 2,
            'asian': 3,
            'native': 4,
            'other': 5
        }
        features['race_encoded'] = race_mapping.get(
            raw_patient_data['race'].lower(), 5
        )
        
        # ==========================================
        # 2. CHRONIC CONDITIONS (10 features)
        # Mapping: raw 0/1 → X_test uses 1 (has) / 2 (doesn't have)
        # ==========================================
        
        # Your X_test uses encoding: 2 = no condition, 1 = has condition
        # So: if raw == 1, set to 1; if raw == 0, set to 2
        condition_fields = {
            'has_diabetes': 'has_diabetes',
            'has_hypertension': 'has_esrd',  # Note: May need mapping
            'has_heart_disease': 'has_ischemic_heart',
            'has_copd': 'has_copd',
            'has_asthma': 'has_chf',  # Note: May need mapping
            'has_kidney_disease': 'has_ckd',
            'has_depression': 'has_depression',
            'has_cancer': 'has_cancer',
            'has_stroke': 'has_stroke',
            'has_arthritis': 'has_ra_oa'
        }
        
        for raw_field, feature_field in condition_fields.items():
            # Convert: 1 → 1 (has), 0 → 2 (doesn't have)
            features[feature_field] = 1 if raw_patient_data.get(raw_field, 0) == 1 else 2
        
        # ==========================================
        # 3. UTILIZATION METRICS (5 features)
        # ==========================================
        
        # Total inpatient visits (sum of different types)
        inpatient = raw_patient_data.get('inpatient_visits', 0)
        outpatient = raw_patient_data.get('outpatient_visits', 0)
        er_visits = raw_patient_data.get('er_visits', 0)
        urgent_visits = raw_patient_data.get('urgent_care_visits', 0)
        specialist_visits = raw_patient_data.get('specialist_visits', 0)
        
        features['total_admissions_2008'] = float(inpatient)
        
        # Estimate hospital days (assume ~3 days per admission)
        features['total_hospital_days_2008'] = float(inpatient * 3.0)
        
        # Days since last admission (assume recent if inpatient_visits > 0)
        if inpatient > 0:
            features['recent_admission'] = 1
            features['days_since_last_admission'] = 30.0  # Assume ~30 days ago
        else:
            features['recent_admission'] = 0
            features['days_since_last_admission'] = 999.0  # No admission
        
        # Total outpatient visits
        features['total_outpatient_visits_2008'] = float(outpatient + specialist_visits)
        
        # High outpatient user flag
        high_threshold = self.reference_stats['total_outpatient_visits']['high_threshold']
        features['high_outpatient_user'] = 1 if features['total_outpatient_visits_2008'] > high_threshold else 0
        
        # ==========================================
        # 4. COST DATA (3 features)
        # ==========================================
        
        annual_cost = float(raw_patient_data.get('annual_cost', 0))
        features['total_annual_cost'] = annual_cost
        
        # Calculate cost percentile relative to X_test population
        percentiles = self.reference_stats['total_annual_cost']['percentile_values']
        cost_percentile = np.searchsorted(percentiles, annual_cost) / 100.0
        features['cost_percentile'] = cost_percentile
        
        # High cost flag: if in top 20% (80th percentile)
        high_cost_threshold = self.reference_stats['total_annual_cost']['percentile_values'][80]
        features['high_cost'] = 1 if annual_cost > high_cost_threshold else 0
        
        # ==========================================
        # 5. INPATIENT COST (1 feature)
        # ==========================================
        
        # Estimate inpatient cost (~60% of total for hospitalized patients)
        if inpatient > 0:
            features['total_inpatient_cost'] = annual_cost * 0.60
        else:
            features['total_inpatient_cost'] = 0.0
        
        # ==========================================
        # 6. DERIVED RISK METRICS (2 features)
        # ==========================================
        
        # Frailty Score: composite of age + conditions + utilization
        frailty = self._calculate_frailty_score(raw_patient_data, features)
        features['frailty_score'] = frailty
        
        # Complexity Index: conditions count + cost + utilization
        complexity = self._calculate_complexity_index(raw_patient_data, features)
        features['complexity_index'] = complexity
        
        return features
    
    def _calculate_frailty_score(self, raw_data, features):
        """
        Frailty score (0-5 scale):
        - Higher age → higher frailty
        - More chronic conditions → higher frailty
        - More utilization → higher frailty
        """
        
        frailty = 0.0
        
        # Age component (0-2)
        age = raw_data['age']
        if age >= 80:
            frailty += 2.0
        elif age >= 70:
            frailty += 1.5
        elif age >= 65:
            frailty += 1.0
        
        # Condition count component (0-2)
        condition_count = sum([
            raw_data.get('has_diabetes', 0),
            raw_data.get('has_heart_disease', 0),
            raw_data.get('has_copd', 0),
            raw_data.get('has_kidney_disease', 0),
            raw_data.get('has_depression', 0),
            raw_data.get('has_cancer', 0),
            raw_data.get('has_stroke', 0)
        ])
        frailty += min(condition_count * 0.25, 2.0)
        
        # Utilization component (0-1)
        total_visits = (
            raw_data.get('inpatient_visits', 0) * 2 +  # Weight inpatient higher
            raw_data.get('er_visits', 0) +
            raw_data.get('outpatient_visits', 0) * 0.25
        )
        frailty += min(total_visits * 0.1, 1.0)
        
        return min(frailty, 5.0)  # Cap at 5.0
    
    def _calculate_complexity_index(self, raw_data, features):
        """
        Complexity Index (0-20+ scale):
        - Count of chronic conditions
        - Cost level
        - Healthcare utilization
        """
        
        complexity = 0.0
        
        # Condition count (0-10)
        condition_count = sum([
            raw_data.get('has_diabetes', 0),
            raw_data.get('has_hypertension', 0),
            raw_data.get('has_heart_disease', 0),
            raw_data.get('has_copd', 0),
            raw_data.get('has_asthma', 0),
            raw_data.get('has_kidney_disease', 0),
            raw_data.get('has_depression', 0),
            raw_data.get('has_cancer', 0),
            raw_data.get('has_stroke', 0),
            raw_data.get('has_arthritis', 0)
        ])
        complexity += condition_count * 1.0
        
        # Cost component (0-5)
        cost_percentile = features['cost_percentile']
        complexity += cost_percentile * 5.0
        
        # Utilization component (0-5)
        total_visits = (
            raw_data.get('inpatient_visits', 0) * 3 +
            raw_data.get('er_visits', 0) * 1.5 +
            raw_data.get('outpatient_visits', 0) * 0.5
        )
        complexity += min(total_visits, 5.0)
        
        return complexity
    
    def get_feature_vector(self, raw_patient_data):
        """
        Transform raw patient data and return as numpy array
        ready to pass to ML models
        """
        
        features_dict = self.transform_raw_to_features(raw_patient_data)
        
        # Ensure feature order matches X_test columns
        x_test_columns = [
            'age', 'is_female', 'is_elderly', 'race_encoded',
            'has_esrd', 'has_alzheimers', 'has_chf', 'has_ckd',
            'has_cancer', 'has_copd', 'has_depression', 'has_diabetes',
            'has_ischemic_heart', 'has_ra_oa', 'has_stroke',
            'total_admissions_2008', 'total_hospital_days_2008',
            'days_since_last_admission', 'recent_admission',
            'total_outpatient_visits_2008', 'high_outpatient_user',
            'total_annual_cost', 'cost_percentile', 'high_cost',
            'total_inpatient_cost', 'frailty_score', 'complexity_index'
        ]
        
        # Create feature vector in correct order
        feature_vector = np.array([features_dict[col] for col in x_test_columns])
        
        return feature_vector, features_dict
```

---

## 🗄️ Database Architecture (Revised for Dual Input)

```sql
-- =====================================================
-- 1. X_TEST PATIENTS (Pre-engineered, pre-processed)
-- =====================================================
CREATE TABLE organization_patients (
    patient_id BIGSERIAL PRIMARY KEY,
    patient_uuid UUID UNIQUE NOT NULL,
    data_source VARCHAR(20) NOT NULL,  -- 'X_TEST'
    department_id INT NOT NULL,
    
    -- Demographics
    age INT,
    is_female BOOLEAN,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store complete 27 features from X_test
CREATE TABLE organization_patient_features (
    feature_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT UNIQUE REFERENCES organization_patients(patient_id),
    
    -- All 27 features as-is from X_test.csv
    age INT,
    is_female INT,
    is_elderly INT,
    race_encoded INT,
    has_esrd INT,
    has_alzheimers INT,
    has_chf INT,
    has_ckd INT,
    has_cancer INT,
    has_copd INT,
    has_depression INT,
    has_diabetes INT,
    has_ischemic_heart INT,
    has_ra_oa INT,
    has_stroke INT,
    total_admissions_2008 DECIMAL(8,2),
    total_hospital_days_2008 DECIMAL(8,2),
    days_since_last_admission DECIMAL(8,2),
    recent_admission INT,
    total_outpatient_visits_2008 DECIMAL(8,2),
    high_outpatient_user INT,
    total_annual_cost DECIMAL(10,2),
    cost_percentile DECIMAL(5,3),
    high_cost INT,
    total_inpatient_cost DECIMAL(10,2),
    frailty_score DECIMAL(8,4),
    complexity_index DECIMAL(8,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. NEW PATIENTS (Raw input, will be transformed)
-- =====================================================
CREATE TABLE new_patient_input (
    patient_id BIGSERIAL PRIMARY KEY,
    patient_uuid UUID UNIQUE NOT NULL,
    
    -- Raw data as provided by frontend
    age INT NOT NULL,
    gender VARCHAR(10),
    race VARCHAR(50),
    
    -- Chronic conditions (raw 0/1)
    has_diabetes INT,
    has_hypertension INT,
    has_heart_disease INT,
    has_copd INT,
    has_asthma INT,
    has_kidney_disease INT,
    has_depression INT,
    has_cancer INT,
    has_stroke INT,
    has_arthritis INT,
    
    -- Utilization (raw counts)
    inpatient_visits INT,
    er_visits INT,
    outpatient_visits INT,
    urgent_care_visits INT,
    pharmacy_claims INT,
    specialist_visits INT,
    
    -- Financial
    annual_cost DECIMAL(10,2),
    
    -- Audit
    data_source VARCHAR(20) DEFAULT 'NEW_PATIENT',
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store transformed features (after feature engineering)
CREATE TABLE new_patient_engineered_features (
    feature_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT UNIQUE REFERENCES new_patient_input(patient_id),
    
    -- All 27 engineered features (same as organization_patient_features)
    age INT,
    is_female INT,
    is_elderly INT,
    race_encoded INT,
    has_esrd INT,
    has_alzheimers INT,
    has_chf INT,
    has_ckd INT,
    has_cancer INT,
    has_copd INT,
    has_depression INT,
    has_diabetes INT,
    has_ischemic_heart INT,
    has_ra_oa INT,
    has_stroke INT,
    total_admissions_2008 DECIMAL(8,2),
    total_hospital_days_2008 DECIMAL(8,2),
    days_since_last_admission DECIMAL(8,2),
    recent_admission INT,
    total_outpatient_visits_2008 DECIMAL(8,2),
    high_outpatient_user INT,
    total_annual_cost DECIMAL(10,2),
    cost_percentile DECIMAL(5,3),
    high_cost INT,
    total_inpatient_cost DECIMAL(10,2),
    frailty_score DECIMAL(8,4),
    complexity_index DECIMAL(8,4),
    
    engineered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 The Complete Data Flow

### For X_test Patients (Initial Load):

```
1. X_test.csv (3,001 rows)
   ↓
2. INSERT into organization_patients + organization_patient_features
   (27 features already processed, just load directly)
   ↓
3. Load features from database
   ↓
4. Pass to models → Get predictions
   ↓
5. Store in predictions + financial_projections tables
```

### For New Patients (Real-time):

```
1. Frontend sends raw data
   {age: 75, gender: 'F', has_diabetes: 1, ... }
   ↓
2. INSERT into new_patient_input (RAW TABLE)
   ↓
3. Run FeatureEngineer.transform_raw_to_features()
   (Convert raw → 27 engineered features)
   ↓
4. INSERT into new_patient_engineered_features (PROCESSED TABLE)
   ↓
5. Load features from database
   ↓
6. Pass to models → Get predictions
   ↓
7. Store in predictions + financial_projections tables
```

---

## 📝 Summary of the Right Approach

| Aspect | X_test Patients | New Patients |
|--------|---|---|
| **Input Format** | 27 pre-engineered features | ~15 raw fields |
| **Storage** | `organization_patient_features` | `new_patient_input` + `new_patient_engineered_features` |
| **Transformation** | None - load directly | Run FeatureEngineer pipeline |
| **Before Prediction** | Use features as-is | Ensure engineered features exist |
| **Model Input** | Same 27 features | Same 27 features (after engineering) |
| **Database Path** | Direct → Prediction | Raw → Engineering → Prediction |

---

## ✅ What You DON'T Change

- ❌ Don't modify ML models
- ❌ Don't change feature names or order
- ❌ Don't retrain on new data (yet)
- ❌ Don't use raw data directly for prediction

## ✅ What You DO Create

- ✅ Feature engineering pipeline for raw → processed
- ✅ Dual table structure (raw input + engineered features)
- ✅ Transformation logic in Python before DB insert
- ✅ Validation to ensure all 27 features present before prediction

---

## 💡 Key Insight

**X_test is your "processed baseline"** - you're not storing it in the database, you're loading it during initial setup. New patients are "raw inputs" that you transform to match X_test format before feeding to models.

The feature engineering function I provided above recreates the exact same transformations that were applied to create X_test from the raw curated_15k dataset.
