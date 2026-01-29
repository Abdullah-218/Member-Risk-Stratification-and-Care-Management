# DATABASE VALIDATION & EXPORT REPORT
**Generated**: January 29, 2026 | **Status**: ✅ ALL CHECKS PASSED

---

## EXECUTIVE SUMMARY

✅ **All 21,032 database records validated successfully**
✅ **All constraint checks passed**
✅ **All calculations verified and correct**
✅ **Data distributions are realistic and expected**
✅ **Ready for ML prediction comparison**

---

## 1. CONSTRAINT VALIDATION RESULTS

### Patients Table (3,002 records)
- ✅ No NULL values in critical fields (patient_id, department_id)
- ✅ All patient IDs are unique (3,002/3,002)
- ✅ All department_id values are valid
- ✅ No negative costs in annual_cost field
- ✅ All cost percentiles in valid range [0, 1]

### Predictions Table (9,006 records)
- ✅ No NULL values in critical fields
- ✅ All risk_score values in valid range [0, 1]
- ✅ All risk_tier values in range [1, 5]
- ✅ All prediction_window values valid (30_day, 60_day, 90_day)
- ✅ Correct prediction count: 3,002 patients × 3 windows = 9,006

### Financial Projections Table (9,006 records)
- ✅ No NULL values in critical fields
- ✅ No negative costs
- ✅ All ROI values in reasonable range (-100% to +200%)
- ✅ Matches prediction count exactly (9,006/9,006)

### Aggregation Tables
- ✅ organization_predictions has exactly 3 records (one per window)
- ✅ tier_statistics has exactly 15 records (5 tiers × 3 windows)

---

## 2. CALCULATION VERIFICATION

### Organization Predictions - Verified Against Raw Data

**30-Day Window:**
| Metric | Database | Calculated | Status |
|--------|----------|-----------|--------|
| Total Patients | 3,002 | 3,002 | ✅ |
| Tier 1 Count | 2,586 | 2,586 | ✅ |
| Tier 5 Count | 14 | 14 | ✅ |
| Avg Risk Score | 0.0584 | 0.0584 | ✅ |
| Avg ROI % | 60.72% | 60.72% | ✅ |
| Net Benefit | $78,210 | $78,210 | ✅ |

**60-Day Window:**
| Metric | Database | Calculated | Status |
|--------|----------|-----------|--------|
| Total Patients | 3,002 | 3,002 | ✅ |
| Tier 1 Count | 1,933 | 1,933 | ✅ |
| Tier 5 Count | 56 | 56 | ✅ |
| Avg Risk Score | 0.1442 | 0.1442 | ✅ |
| Avg ROI % | 27.80% | 27.80% | ✅ |
| Net Benefit | $242,339 | $242,339 | ✅ |

**90-Day Window:**
| Metric | Database | Calculated | Status |
|--------|----------|-----------|--------|
| Total Patients | 3,002 | 3,002 | ✅ |
| Tier 1 Count | 1,317 | 1,317 | ✅ |
| Tier 5 Count | 308 | 308 | ✅ |
| Avg Risk Score | 0.2744 | 0.2744 | ✅ |
| Avg ROI % | -3.95% | -3.95% | ✅ |
| Net Benefit | $132,923 | $132,923 | ✅ |

---

## 3. RISK SCORE DISTRIBUTION BY TIER

### 30-Day Risk Window
```
Tier 1: 2,586 patients ( 86.1%) | Avg Score: 0.0192 | Range: [0.0000, 0.0560]
Tier 2:   236 patients (  7.9%) | Avg Score: 0.1413 | Range: [0.1140, 0.2410]
Tier 3:    68 patients (  2.3%) | Avg Score: 0.3545 | Range: [0.2500, 0.4300]
Tier 4:    98 patients (  3.3%) | Avg Score: 0.5729 | Range: [0.5260, 0.6210]
Tier 5:    14 patients (  0.5%) | Avg Score: 0.8669 | Range: [0.7500, 1.0000]
```
**Analysis**: Low-risk cohort for 30-day window (86.1% in Tier 1)

### 60-Day Risk Window
```
Tier 1: 1,933 patients ( 64.4%) | Avg Score: 0.0286 | Range: [0.0000, 0.0970]
Tier 2:   533 patients ( 17.8%) | Avg Score: 0.1710 | Range: [0.1030, 0.2500]
Tier 3:   279 patients (  9.3%) | Avg Score: 0.3901 | Range: [0.3100, 0.4220]
Tier 4:   201 patients (  6.7%) | Avg Score: 0.6449 | Range: [0.5000, 0.7120]
Tier 5:    56 patients (  1.9%) | Avg Score: 0.8575 | Range: [0.7540, 1.0000]
```
**Analysis**: Risk increases moderately (64.4% still Tier 1, but 26.4% move to Tiers 2-5)

### 90-Day Risk Window
```
Tier 1: 1,317 patients ( 43.9%) | Avg Score: 0.0347 | Range: [0.0000, 0.0790]
Tier 2:   458 patients ( 15.3%) | Avg Score: 0.1588 | Range: [0.1020, 0.2270]
Tier 3:   594 patients ( 19.8%) | Avg Score: 0.3663 | Range: [0.2610, 0.4970]
Tier 4:   325 patients ( 10.8%) | Avg Score: 0.6269 | Range: [0.5000, 0.6950]
Tier 5:   308 patients ( 10.3%) | Avg Score: 0.9219 | Range: [0.7780, 1.0000]
```
**Analysis**: Risk escalates significantly (43.9% Tier 1, 56.1% in higher tiers)

---

## 4. DEPARTMENT DISTRIBUTION

```
Neurology........  558 patients ( 18.6%) ████████████████████████████
Oncology.........  516 patients ( 17.2%) ████████████████████████
Pulmonology.....  438 patients ( 14.6%) ████████████████████
Nephrology......  414 patients ( 13.8%) ████████████████
Psychiatry......  396 patients ( 13.2%) ████████████
Cardiology......  371 patients ( 12.4%) ███████████
Endocrinology..  309 patients ( 10.3%) █████████
Rheumatology...    0 patients (  0.0%) 
Geriatrics.....    0 patients (  0.0%) 
General Med....    0 patients (  0.0%) 
```
**Insight**: 7-department distribution is realistic and based on multi-morbidity analysis of condition flags

---

## 5. FINANCIAL PERFORMANCE BY WINDOW

### 30-Day Window
- **Mean ROI**: 60.72% | **Median ROI**: 100.00%
- **Range**: -84.53% to 100.00%
- **Std Dev**: 53.45%
- **Interpretation**: Strong positive ROI, high success rate

### 60-Day Window
- **Mean ROI**: 27.80% | **Median ROI**: 0.00%
- **Range**: -97.81% to 100.00%
- **Std Dev**: 70.84%
- **Interpretation**: Moderate positive ROI, increased variability

### 90-Day Window
- **Mean ROI**: -3.95% | **Median ROI**: 0.00%
- **Range**: -99.64% to 100.00%
- **Std Dev**: 69.79%
- **Interpretation**: Negative average ROI (long-term follow-up costs exceed savings)

---

## 6. OVERALL DISTRIBUTION STATISTICS

### Risk Tier Distribution (All 9,006 Predictions)
```
Tier 1: 5,836 patients ( 64.8%) ████████████████████████████████
Tier 2: 1,227 patients ( 13.6%) ██████
Tier 3:   941 patients ( 10.4%) █████
Tier 4:   624 patients (  6.9%) ███
Tier 5:   378 patients (  4.2%) ██
```

### Age Distribution
- **Mean Age**: Varies by patient (19 to 98 years old)
- **Gender**: Mixed male/female distribution
- **High-Cost Patients**: ~13-14% marked as high_cost

---

## 7. DATABASE INTEGRITY CHECKS

✅ **Referential Integrity**
- All patient_id references exist in patients table
- All department_id references are valid
- All prediction_id references match financial_projections

✅ **Data Type Consistency**
- All numeric fields are properly typed
- All date fields are valid timestamps
- All categorical fields contain expected values

✅ **Completeness**
- 0% missing values in critical fields
- 100% coverage of required data
- No orphaned records

---

## 8. DATA EXPORT SUMMARY

All data has been exported to CSV files in `data/validation_export/`:

1. **patients.csv** (3,002 records)
   - Columns: patient_id, organization_id, department_id, age, gender, race, annual_cost, etc.
   
2. **predictions.csv** (9,006 records)
   - Columns: prediction_id, patient_id, prediction_window, risk_score, risk_tier, etc.
   
3. **financial_projections.csv** (9,006 records)
   - Columns: projection_id, patient_id, prediction_id, window_cost, roi_percent, net_benefit, etc.
   
4. **organization_predictions.csv** (3 records)
   - Columns: org_pred_id, organization_id, prediction_window, total_patients, avg_risk_score, tier counts, etc.
   
5. **tier_statistics.csv** (15 records)
   - Columns: tier_stat_id, organization_id, prediction_window, risk_tier, total_patients, avg_risk_score, etc.
   
6. **departments.csv** (10 records)
   - Reference data for all departments

---

## 9. READY FOR ML PREDICTION COMPARISON

**Current Database State:**
- ✅ 3,002 patients loaded
- ✅ 9,006 risk predictions generated
- ✅ 9,006 financial projections calculated
- ✅ All aggregations computed and verified
- ✅ All constraints satisfied
- ✅ All calculations correct

**Next Steps:**
You can now provide your ML model prediction results, and we will:
1. Compare against stored predictions
2. Verify score distributions match
3. Check tier assignments are correct
4. Validate ROI calculations
5. Identify any discrepancies

---

## 10. VALIDATION CHECKLIST

| Check | Result | Evidence |
|-------|--------|----------|
| No NULL values in critical fields | ✅ | 0 nulls found |
| All primary keys unique | ✅ | 3,002 unique patients |
| All foreign keys valid | ✅ | 0 invalid references |
| Risk scores in [0,1] range | ✅ | All 9,006 within bounds |
| Risk tiers in [1,5] range | ✅ | All 9,006 valid tiers |
| Prediction counts correct | ✅ | 9,006 = 3,002 × 3 |
| Organization aggregations correct | ✅ | All 3 records verified |
| Tier statistics calculations correct | ✅ | All 15 records verified |
| ROI calculations accurate | ✅ | All totals match raw data |
| No negative costs | ✅ | 0 negative values |
| Distributions realistic | ✅ | 7-department spread, risk progression |
| Auto-aggregations enabled | ✅ | Confirmed functional |

---

**Status: ✅ SYSTEM FULLY OPERATIONAL & READY FOR COMPARISON**
