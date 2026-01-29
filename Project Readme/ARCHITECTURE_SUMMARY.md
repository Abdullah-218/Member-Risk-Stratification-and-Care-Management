# Quick Architecture Decision Guide

## Your Question Summarized

```
❓ "X_test has 27 processed features, but new patients will have 
    10-15 raw fields. How do I predict both without retraining the model?"
```

## The Answer

```
┌─────────────────────────────────────────────────────────────┐
│              BOTH PATHS LEAD TO SAME PLACE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Path A: X_test (3,001 baseline patients)                   │
│  ─────────────────────────────────────────                 │
│  27 features (processed)                                    │
│         ↓ (no transformation needed)                        │
│     Models                                                  │
│                                                              │
│  Path B: New Patient (1 at a time, real-time)              │
│  ────────────────────────────────────────────              │
│  ~15 raw fields                                             │
│         ↓ (TRANSFORM using Feature Engineering)             │
│  27 features (processed, matching X_test)                   │
│         ↓                                                    │
│     Models                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Concept

```
X_test is the TEMPLATE for what processed data looks like.
New patient raw data must be TRANSFORMED to match this template.
```

## What to Build

1. **Feature Engineering Module** (Python class)
   - Input: raw patient data (10-15 fields)
   - Output: 27 engineered features (matching X_test columns)
   - Logic: Replicates transformations used in `src/02_feature_engineering.py`

2. **Two Database Tables**
   ```
   new_patient_input (stores raw: age, gender, conditions, costs)
           ↓
   new_patient_engineered_features (stores 27 processed features)
           ↓
   predictions (runs model)
   ```

3. **No Model Changes Needed**
   - Models expect 27 features ✓
   - Both paths provide 27 features ✓
   - Just different transformations to get there

## Real Example

### X_test Patient (from CSV)
```csv
age,is_female,is_elderly,race_encoded,...,frailty_score,complexity_index
75,1,1,0,...,0.96,8.174
```
→ Load directly into DB → Predict

### New Patient (from frontend form)
```json
{
  "age": 75,
  "gender": "F",
  "race": "White",
  "has_diabetes": 1,
  "has_heart_disease": 0,
  "inpatient_visits": 2,
  "outpatient_visits": 8,
  "annual_cost": 15000
}
```
→ **Transform** via FeatureEngineer → 
```python
{
  "age": 75,
  "is_female": 1,
  "is_elderly": 1,
  "race_encoded": 0,
  ...
  "frailty_score": 0.96,
  "complexity_index": 8.174
}
```
→ Predict (same as X_test path)

## Why This Works

✅ Models don't care where features come from  
✅ Only care that features match X_test format  
✅ Feature engineering standardizes the input  
✅ No retraining needed  
✅ Can handle 3,000 + unlimited new patients  

## Files Created for You

1. **DUAL_INPUT_ARCHITECTURE.md** - Full detailed guide with Python code
2. **DATABASE_DESIGN.md** - SQL schema for storing both types

Read DUAL_INPUT_ARCHITECTURE.md for the complete Feature Engineering code.
