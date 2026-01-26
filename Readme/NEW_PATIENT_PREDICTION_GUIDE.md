# New Patient Risk Prediction & ROI Analysis Guide

## Overview

The **New Patient Risk Prediction Tool** enables healthcare providers to analyze risk and ROI for patients who are NEW to the platform (not in the existing database).

### Key Features

✅ **Risk Prediction Across 3 Windows**
- 30-day prediction (Month 1)
- 60-day prediction (Months 1-2)  
- 90-day prediction (Months 1-3)

✅ **Automated Tier Assignment**
- Tier 1: Normal (0-10% risk)
- Tier 2: Low (10-25% risk)
- Tier 3: Moderate (25-50% risk)
- Tier 4: High (50-75% risk)
- Tier 5: Critical (75-100% risk)

✅ **Financial Projections**
- Daily cost calculations
- Preventable cost estimation (60% preventable)
- Intervention cost by tier
- Expected savings by risk reduction rate

✅ **ROI Analysis**
- Net benefit calculation
- ROI percentage for each window
- Intervention recommendation

---

## How to Use

### Option 1: Interactive Terminal Input

Run the script and enter data manually:

```bash
cd /Users/abdullah/healthcare-risk-ml
source hackathon_dept/bin/activate
python mock_testing/new_patient_risk_prediction.py
```

When prompted, select option `1` for interactive input, then enter:
- **Demographics**: Age, Gender, Annual Cost
- **Chronic Conditions**: 10 conditions (Yes/No for each)
- **Utilization**: Visit counts (inpatient, ER, outpatient, etc.)

### Option 2: Batch CSV Upload

Prepare a CSV file with multiple patients and load it:

```bash
python mock_testing/new_patient_risk_prediction.py
```

When prompted, select option `2` and provide the CSV path.

### Sample CSV Format

See `mock_testing/sample_new_patients.csv` for the expected format:

```csv
age,gender_M,gender_F,total_annual_cost,condition_diabetes,condition_hypertension,condition_heart_disease,condition_copd,condition_asthma,condition_kidney_disease,condition_depression,condition_cancer,condition_stroke,condition_arthritis,util_inpatient_visits,util_er_visits,util_outpatient_visits,util_urgent_care_visits,util_pharmacy_claims,util_specialist_visits
68,1,0,12500,1,1,1,0,0,1,0,0,0,1,2,3,8,1,15,4
```

---

## Understanding the Output

### Example Report

```
PATIENT RISK ASSESSMENT REPORT
====================================================================

RISK ASSESSMENT - ALL WINDOWS
────────────────────────────────────────────────────────────────────

  📅 MONTH 1 (0-30 DAYS)
     Risk Score: 0.6842
     Risk Tier: 4/5 - High Risk
     Status: Patient has high risk. Intensive case management recommended.

  📅 MONTHS 1-2 (0-60 DAYS)
     Risk Score: 0.7156
     Risk Tier: 4/5 - High Risk
     Status: Patient has high risk. Intensive case management recommended.

  📅 MONTHS 1-3 (0-90 DAYS)
     Risk Score: 0.7421
     Risk Tier: 5/5 - Critical Risk
     Status: Patient has critical risk. Immediate intervention required.


DETAILED WINDOW PROJECTIONS & ROI ANALYSIS
====================================================================

📊 MONTH 1 (0-30 DAYS)
────────────────────────────────────────────────────────────────────
  Risk Tier: 4/5 - High Risk
  Risk Score: 0.6842

  💰 Financial Projection (30 days):
     Projected Cost: $1,027.40
     Preventable Cost (60%): $616.44

  🏥 Intervention Impact (Tier 4 Program):
     Intervention Cost: $1,200.00
     Expected Savings: $154.11
     Net Benefit: -$1,045.89
     ROI: -87.1%
     ⚠️  NEGATIVE ROI - Monitor before intervention

📊 MONTHS 1-2 (0-60 DAYS)
────────────────────────────────────────────────────────────────────
  Risk Tier: 4/5 - High Risk
  Risk Score: 0.7156

  💰 Financial Projection (60 days):
     Projected Cost: $2,054.79
     Preventable Cost (60%): $1,232.88

  🏥 Intervention Impact (Tier 4 Program):
     Intervention Cost: $1,200.00
     Expected Savings: $308.22
     Net Benefit: -$891.78
     ROI: -74.3%
     ⚠️  NEGATIVE ROI - Monitor before intervention

📊 MONTHS 1-3 (0-90 DAYS)
────────────────────────────────────────────────────────────────────
  Risk Tier: 5/5 - Critical Risk
  Risk Score: 0.7421

  💰 Financial Projection (90 days):
     Projected Cost: $3,082.19
     Preventable Cost (60%): $1,849.31

  🏥 Intervention Impact (Tier 5 Program):
     Intervention Cost: $2,500.00
     Expected Savings: $554.79
     Net Benefit: -$1,945.21
     ROI: -77.8%
     ⚠️  NEGATIVE ROI - Monitor before intervention
```

### Interpreting the Results

**Risk Score (0-1)**: 
- ML model's probability of readmission in the given window
- Higher = More at-risk

**Risk Tier (1-5)**:
- Color-coded severity level
- Determines intervention intensity and cost

**Projected Cost**:
- Estimated healthcare cost for the time window
- Based on annual cost divided by 365 days

**Preventable Cost**:
- 60% of projected cost that can be prevented through intervention
- Varies by condition and tier

**Intervention Cost**:
- One-time cost to implement intervention program
- Scales by tier (Tier 5 = $2,500, Tier 1 = $0)

**Expected Savings**:
- Cost reduction achieved through intervention
- Reduction rate varies by tier (Tier 5 = 30%, Tier 1 = 0%)

**Net Benefit**:
- Expected Savings - Intervention Cost
- Shows overall financial impact

**ROI %**:
- (Net Benefit / Intervention Cost) × 100
- Positive = Intervention pays for itself
- Negative = Monitor condition before intervening

---

## Tier-Specific Intervention Strategies

### Tier 1 - Normal (Cost: $0)
- ✅ Routine monitoring recommended
- Continue standard preventive care
- Annual health screening

### Tier 2 - Low Risk (Cost: $200)
- ✅ Basic preventive measures
- Medication adherence monitoring
- Simple lifestyle coaching

### Tier 3 - Moderate Risk (Cost: $600)
- ✅ Proactive care coordination
- Monthly check-ins
- Chronic disease education
- Medication therapy management

### Tier 4 - High Risk (Cost: $1,200)
- ⚠️ Intensive case management
- Weekly monitoring
- Care coordination with specialists
- Hospitalization prevention programs

### Tier 5 - Critical Risk (Cost: $2,500)
- 🚨 Immediate intervention required
- Daily monitoring or admission
- Urgent care coordination
- Multi-disciplinary team involvement

---

## Reduction Rates by Tier

These rates estimate how much the intervention prevents cost escalation:

| Tier | Label | Reduction Rate |
|------|-------|-----------------|
| 5 | Critical | 30% |
| 4 | High | 25% |
| 3 | Moderate | 20% |
| 2 | Low | 10% |
| 1 | Normal | 0% |

---

## Output Files

After analysis, results are saved to `data/output/new_patient_analysis/`:

**`patient_<ID>_report.txt`**
- Human-readable risk assessment report
- Recommendations for clinical action
- Detailed window projections

**`patient_<ID>_data.json`**
- Structured data for system integration
- Risk predictions and financial projections
- Machine-readable format

---

## Example CSV for Batch Processing

You can create a CSV with multiple new patients:

```csv
age,gender_M,gender_F,total_annual_cost,condition_diabetes,condition_hypertension,condition_heart_disease,condition_copd,condition_asthma,condition_kidney_disease,condition_depression,condition_cancer,condition_stroke,condition_arthritis,util_inpatient_visits,util_er_visits,util_outpatient_visits,util_urgent_care_visits,util_pharmacy_claims,util_specialist_visits
68,1,0,12500,1,1,1,0,0,1,0,0,0,1,2,3,8,1,15,4
75,0,1,18750,0,1,0,1,0,0,1,0,1,1,3,5,12,2,22,6
55,1,0,8000,1,0,0,0,1,0,0,0,0,0,1,2,6,0,10,2
```

Then run:
```bash
python mock_testing/new_patient_risk_prediction.py
# Select option 2
# Enter path to your CSV file
```

---

## Integration with Your Platform

### For System Integration:
The `patient_<ID>_data.json` file contains:
- Patient profile (age, conditions, costs)
- Risk predictions (30/60/90-day windows)
- Financial projections (costs, savings, ROI)
- Tier assignments

### Next Steps:
1. **Store** predictions in your patient database
2. **Schedule** interventions based on tier recommendations
3. **Track** actual outcomes vs predictions
4. **Improve** model by collecting outcome data
5. **Validate** ROI calculations monthly

---

## Troubleshooting

**Q: "Error loading models"**
- Models haven't been trained yet
- Run the full pipeline: `python run_pipeline.py`

**Q: Missing features error**
- CSV has incorrect column names
- Verify against sample_new_patients.csv

**Q: Very high/low risk scores**
- Patient data may be outliers
- Review for data entry errors
- Cross-validate with clinical assessment

---

## Contact & Support

For questions or issues, refer to:
- `Readme/readME.md` - Project overview
- `Readme/INTERACTIVE_ANALYSIS_GUIDE.md` - Interactive analysis guide
- Model documentation in `src/` files
