# Frontend-ML Model Input Alignment

**Date**: January 30, 2026  
**Status**: ✅ COMPLETED

## Summary

Updated the individual assessment frontend to collect **EXACTLY** the 19 raw input fields that the ML model expects. The Python script will perform feature engineering to transform these into 27 features.

---

## Changes Made

### **1. Reduced Steps: 5 → 4**

**Before**: 5 steps (Demographics, Conditions, Utilization, Health Metrics, Review)  
**After**: 4 steps (Demographics, Conditions, Utilization, Review)

**Reason**: Health Metrics were derived/calculated fields. ML model only needs raw inputs.

---

### **2. Updated State Structure**

**File**: `/frontend/src/common/hooks/useAssessmentState.js`

**Old Structure** (mismatched):
```javascript
demographics: {
  age, gender, annualHealthcareCost
}
conditions: {
  diabetes, heartDisease, copd, cancer, kidneyDisease, stroke, 
  depression, alzheimers, hypertension, arthritis, esrd, chf, 
  ckd, ischemicHeartDisease  // 14 conditions, wrong names
}
utilization: {
  hospitalAdmissions, totalHospitalDays, daysSinceLastAdmission,
  recentAdmissionPast30Days, outpatientVisits, highOutpatientUser,
  erEdVisits, specialistVisits  // 8 fields, extras
}
metrics: {
  totalInpatientCost, costPercentile, highCostPatientTop20,
  frailtyScore, complexityIndex  // 5 calculated fields
}
```

**New Structure** (ML model aligned):
```javascript
demographics: {
  age,                    // integer
  gender,                 // 'male' or 'female' (converted to 1/2)
  race,                   // '1', '2', '3', or '5'
  total_annual_cost       // float
}
conditions: {
  has_alzheimers,         // boolean (converted to 0/1)
  has_chf,                // boolean
  has_ckd,                // boolean
  has_cancer,             // boolean
  has_copd,               // boolean
  has_depression,         // boolean
  has_diabetes,           // boolean
  has_ischemic_heart,     // boolean
  has_ra_oa,              // boolean
  has_stroke,             // boolean
  has_esrd                // boolean (11 total)
}
utilization: {
  total_admissions,           // float
  total_hospital_days,        // float
  days_since_last_admission,  // float (999 if never)
  total_outpatient_visits     // float (4 total)
}
```

**Total**: 4 + 11 + 4 = **19 raw input fields** ✅

---

### **3. Step Components Updated**

#### **Step 1: Demographics** (4 fields)
- ✅ Age (years)
- ✅ Gender (Male/Female)
- ✅ **Race/Ethnicity** (NEW - 1=White, 2=Black, 3=Other, 5=Hispanic)
- ✅ Annual Healthcare Cost ($)

**File**: `Step1Demographics.jsx`

#### **Step 2: Chronic Conditions** (11 fields)
Changed from 14 generic conditions to 11 ML model conditions:

**Removed**:
- ❌ `diabetes` → Replaced with `has_diabetes`
- ❌ `heartDisease` → Replaced with `has_chf`, `has_ischemic_heart`
- ❌ `kidneyDisease` → Replaced with `has_ckd`, `has_esrd`
- ❌ `hypertension` → Not used by ML model
- ❌ `arthritis` → Replaced with `has_ra_oa`

**Added/Kept** (with exact naming):
- ✅ `has_alzheimers` - Alzheimer's Disease
- ✅ `has_chf` - Congestive Heart Failure
- ✅ `has_ckd` - Chronic Kidney Disease
- ✅ `has_cancer` - Cancer
- ✅ `has_copd` - COPD
- ✅ `has_depression` - Depression
- ✅ `has_diabetes` - Diabetes Mellitus
- ✅ `has_ischemic_heart` - Ischemic Heart Disease
- ✅ `has_ra_oa` - Rheumatoid Arthritis / Osteoarthritis
- ✅ `has_stroke` - Stroke / TIA
- ✅ `has_esrd` - End-Stage Renal Disease

**File**: `Step2ChronicConditions.jsx`

#### **Step 3: Healthcare Utilization** (4 fields)
Simplified from 8 fields to 4 raw inputs:

**Removed**:
- ❌ `recentAdmissionPast30Days` (calculated from days_since_last_admission)
- ❌ `highOutpatientUser` (calculated from total_outpatient_visits)
- ❌ `erEdVisits` (not used by ML model)
- ❌ `specialistVisits` (not used by ML model)

**Kept**:
- ✅ `total_admissions` - Hospital admissions (past 12 months)
- ✅ `total_hospital_days` - Total hospital days (past 12 months)
- ✅ `days_since_last_admission` - Days since last admission (999 if never)
- ✅ `total_outpatient_visits` - Outpatient visits (past 12 months)

**File**: `Step3HealthcareUtilization.jsx`

#### **Step 4: Review & Predict** (was Step 5)
Updated display to show new field structure:

**File**: `Step4ReviewPredict.jsx` (renamed from `Step5ReviewPredict.jsx`)

---

### **4. Removed Components**

- ❌ **Deleted**: `Step4HealthMetrics.jsx`
  - Reason: Metrics like `frailtyScore`, `complexityIndex`, `costPercentile` are calculated by ML model during feature engineering

---

### **5. Updated Validation**

**File**: `useAssessmentState.js`

Now validates Step 1 requires all 4 demographic fields:
```javascript
case 1:
  return (
    assessmentData.demographics.age !== '' &&
    assessmentData.demographics.gender !== '' &&
    assessmentData.demographics.race !== '' &&
    assessmentData.demographics.total_annual_cost !== ''
  );
```

---

## ML Model Feature Engineering

The 19 raw inputs will be transformed by Python into **27 engineered features**:

### **Input → Output Mapping**

| Raw Input (19) | Engineered Features (27) |
|----------------|--------------------------|
| `age` | `age`, `is_elderly` (age≥75) |
| `gender` | `is_female` (0/1) |
| `race` | `race_encoded` (0-4) |
| `total_annual_cost` | `total_annual_cost`, `cost_percentile`, `high_cost`, `total_inpatient_cost` |
| `has_esrd` | `has_esrd` |
| `has_alzheimers` | `has_alzheimers` |
| `has_chf` | `has_chf` |
| `has_ckd` | `has_ckd` |
| `has_cancer` | `has_cancer` |
| `has_copd` | `has_copd` |
| `has_depression` | `has_depression` |
| `has_diabetes` | `has_diabetes` |
| `has_ischemic_heart` | `has_ischemic_heart` |
| `has_ra_oa` | `has_ra_oa` |
| `has_stroke` | `has_stroke` |
| `total_admissions` | `total_admissions_2008` |
| `total_hospital_days` | `total_hospital_days_2008` |
| `days_since_last_admission` | `days_since_last_admission`, `recent_admission` (≤90 days) |
| `total_outpatient_visits` | `total_outpatient_visits_2008`, `high_outpatient_user` (>10 visits) |
| *Calculated* | `frailty_score`, `complexity_index` |

**Feature Engineering Location**: `/healthcare-risk-ml/new_patient_risk_prediction.py` → `engineer_features()`

---

## Data Transformation for Backend

When submitting to backend, frontend values need conversion:

```javascript
// Frontend → Python format
{
  age: parseInt(demographics.age),
  gender: demographics.gender === 'male' ? 1 : 2,
  race: parseInt(demographics.race),
  total_annual_cost: parseFloat(demographics.total_annual_cost),
  
  // Conditions: boolean → 0/1
  has_alzheimers: conditions.has_alzheimers ? 1 : 0,
  has_chf: conditions.has_chf ? 1 : 0,
  // ... (repeat for all 11 conditions)
  
  // Utilization: string → float
  total_admissions: parseFloat(utilization.total_admissions) || 0,
  total_hospital_days: parseFloat(utilization.total_hospital_days) || 0,
  days_since_last_admission: parseFloat(utilization.days_since_last_admission) || 999,
  total_outpatient_visits: parseFloat(utilization.total_outpatient_visits) || 0
}
```

---

## Next Steps

### **Phase 1: Backend Integration** (Next)
1. Create ML service wrapper in Node.js
2. Transform frontend data → Python format
3. Call Python script with JSON input
4. Return predictions + patient_id

### **Phase 2: Python Script Enhancement**
1. Add JSON input mode to `new_patient_risk_prediction.py`
2. Return structured JSON output
3. Handle all 19 raw input fields

### **Phase 3: Testing**
1. Test end-to-end flow
2. Verify patient appears in organization side
3. Validate predictions and ROI calculations

---

## Files Modified

✅ `/frontend/src/common/hooks/useAssessmentState.js`  
✅ `/frontend/src/common/components/individual/AssessmentSteps/Step1Demographics.jsx`  
✅ `/frontend/src/common/components/individual/AssessmentSteps/Step2ChronicConditions.jsx`  
✅ `/frontend/src/common/components/individual/AssessmentSteps/Step3HealthcareUtilization.jsx`  
✅ `/frontend/src/common/components/individual/AssessmentSteps/Step4ReviewPredict.jsx` (renamed)  
✅ `/frontend/src/common/components/individual/AssessmentSteps/MultiStepAssessment.jsx`  
✅ `/frontend/src/individual_assessment_ui/IndividualAssessmentPage/IndividualAssessmentPage.jsx`  
❌ `/frontend/src/common/components/individual/AssessmentSteps/Step4HealthMetrics.jsx` (removed)  
❌ `/frontend/src/common/components/individual/AssessmentSteps/Step5ReviewPredict.jsx` (renamed to Step4)  
⚠️  `/frontend/src/individual_assessment_ui/AssessmentReportPage.jsx` (needs update for backend integration)  

**Note**: AssessmentReportPage still references old field names but will be updated during backend integration phase when actual prediction data structure is finalized.

---

## Validation Checklist

- ✅ Frontend collects exactly 19 raw input fields
- ✅ Field names match Python's `engineer_features()` expectations
- ✅ No extra fields that ML model doesn't use
- ✅ No missing fields that ML model requires
- ✅ Race field added (was missing)
- ✅ Condition names use `has_` prefix
- ✅ Utilization field names match ML model
- ✅ Step count reduced from 5 to 4
- ✅ Validation ensures required fields are filled

---

**Status**: Frontend is now ready for backend integration with ML model! 🎯
