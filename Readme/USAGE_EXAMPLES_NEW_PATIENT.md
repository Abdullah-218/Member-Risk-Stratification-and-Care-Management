# Usage Examples: New Patient Risk Prediction

## Quick Start

### Method 1: Interactive Mode (Single Patient)

```bash
cd /Users/abdullah/healthcare-risk-ml
source hackathon_dept/bin/activate
python predict_new_patient.py
```

Then select option **1** and enter patient data when prompted.

---

### Method 2: Batch CSV Import (Multiple Patients)

```bash
python predict_new_patient.py
```

Select option **2** and provide your CSV file path:
```
/path/to/your/patients.csv
```

---

### Method 3: Direct Script Execution

```bash
python mock_testing/new_patient_risk_prediction.py
```

---

## Example Workflow: Step-by-Step

### Scenario: New Patient Registration

A 72-year-old male patient with multiple chronic conditions arrives at your clinic. You want to assess their risk and potential intervention ROI.

#### Input Data:

```
Age: 72
Gender: Male
Annual Healthcare Cost: $18,500

Chronic Conditions:
  - Diabetes: Yes
  - Hypertension: Yes
  - Heart Disease: Yes
  - COPD: No
  - Asthma: No
  - Kidney Disease: Yes
  - Depression: No
  - Cancer: No
  - Stroke: Yes
  - Arthritis: Yes

Utilization (past 12 months):
  - Inpatient Visits: 3
  - ER Visits: 5
  - Outpatient Visits: 12
  - Urgent Care Visits: 2
  - Pharmacy Claims: 24
  - Specialist Visits: 7
```

#### Expected Output Report:

```
PATIENT RISK ASSESSMENT REPORT
========================================================================
Generated: January 25, 2026 at 14:32:15

PATIENT SUMMARY
────────────────────────────────────────────────────────────────────────
  Age: 72 years
  Annual Healthcare Cost: $18,500.00

RISK ASSESSMENT - ALL WINDOWS
────────────────────────────────────────────────────────────────────────

  📅 MONTH 1 (0-30 DAYS)
     Risk Score: 0.7245
     Risk Tier: 4/5 - High Risk
     Status: Patient has high risk. Intensive case management recommended.

  📅 MONTHS 1-2 (0-60 DAYS)
     Risk Score: 0.7512
     Risk Tier: 4/5 - High Risk
     Status: Patient has high risk. Intensive case management recommended.

  📅 MONTHS 1-3 (0-90 DAYS)
     Risk Score: 0.7889
     Risk Tier: 5/5 - Critical Risk
     Status: Patient has critical risk. Immediate intervention required.

DETAILED WINDOW PROJECTIONS & ROI ANALYSIS
========================================================================

📊 MONTH 1 (0-30 DAYS)
────────────────────────────────────────────────────────────────────────
  Risk Tier: 4/5 - High Risk
  Risk Score: 0.7245

  💰 Financial Projection (30 days):
     Projected Cost: $1,520.55
     Preventable Cost (60%): $912.33

  🏥 Intervention Impact (Tier 4 Program):
     Intervention Cost: $1,200.00
     Expected Savings: $228.08
     Net Benefit: -$971.92
     ROI: -81.0%
     ⚠️  NEGATIVE ROI - Monitor before intervention

📊 MONTHS 1-2 (0-60 DAYS)
────────────────────────────────────────────────────────────────────────
  Risk Tier: 4/5 - High Risk
  Risk Score: 0.7512

  💰 Financial Projection (60 days):
     Projected Cost: $3,041.10
     Preventable Cost (60%): $1,824.66

  🏥 Intervention Impact (Tier 4 Program):
     Intervention Cost: $1,200.00
     Expected Savings: $456.17
     Net Benefit: -$743.83
     ROI: -62.0%
     ⚠️  NEGATIVE ROI - Monitor before intervention

📊 MONTHS 1-3 (0-90 DAYS)
────────────────────────────────────────────────────────────────────────
  Risk Tier: 5/5 - Critical Risk
  Risk Score: 0.7889

  💰 Financial Projection (90 days):
     Projected Cost: $4,561.64
     Preventable Cost (60%): $2,736.99

  🏥 Intervention Impact (Tier 5 Program):
     Intervention Cost: $2,500.00
     Expected Savings: $821.10
     Net Benefit: -$1,678.90
     ROI: -67.2%
     ⚠️  NEGATIVE ROI - Monitor before intervention
```

---

## CSV Example: Multiple Patients

Create a file `new_patients.csv`:

```csv
age,gender_M,gender_F,total_annual_cost,condition_diabetes,condition_hypertension,condition_heart_disease,condition_copd,condition_asthma,condition_kidney_disease,condition_depression,condition_cancer,condition_stroke,condition_arthritis,util_inpatient_visits,util_er_visits,util_outpatient_visits,util_urgent_care_visits,util_pharmacy_claims,util_specialist_visits
72,1,0,18500,1,1,1,0,0,1,0,0,1,1,3,5,12,2,24,7
65,0,1,14200,1,1,0,1,0,0,1,0,0,1,2,3,10,1,18,4
58,1,0,9800,0,1,1,0,1,0,0,0,0,0,1,2,7,0,12,3
78,0,1,22300,1,1,1,1,0,1,1,1,1,1,4,6,14,2,28,8
63,1,0,11500,1,0,0,0,0,1,0,0,0,1,2,2,8,1,14,3
```

Run:
```bash
python predict_new_patient.py
# Select option 2
# Enter: new_patients.csv
```

---

## Output Files

After running, check `data/output/new_patient_analysis/`:

```
new_patient_analysis/
├── patient_NEW_001_report.txt       # Report for interactive patient
├── patient_NEW_001_data.json        # Structured data (JSON)
├── patient_CSV_001_report.txt       # Report for 1st CSV patient
├── patient_CSV_001_data.json        # Data for 1st CSV patient
├── patient_CSV_002_report.txt       # Report for 2nd CSV patient
├── patient_CSV_002_data.json        # Data for 2nd CSV patient
...
```

---

## Integration with EHR Systems

The JSON output can be integrated with your EHR:

```json
{
  "patient_id": "CSV_001",
  "timestamp": "2026-01-25T14:32:15.123456",
  "patient_profile": {
    "age": 72,
    "gender_M": 1,
    "gender_F": 0,
    "total_annual_cost": 18500,
    "condition_diabetes": 1,
    "condition_hypertension": 1,
    "condition_heart_disease": 1,
    "condition_copd": 0,
    "condition_asthma": 0,
    "condition_kidney_disease": 1,
    "condition_depression": 0,
    "condition_cancer": 0,
    "condition_stroke": 1,
    "condition_arthritis": 1,
    "util_inpatient_visits": 3,
    "util_er_visits": 5,
    "util_outpatient_visits": 12,
    "util_urgent_care_visits": 2,
    "util_pharmacy_claims": 24,
    "util_specialist_visits": 7
  },
  "risk_predictions": {
    "30_day": {
      "risk_score": 0.7245,
      "tier": 4,
      "tier_label": "High Risk"
    },
    "60_day": {
      "risk_score": 0.7512,
      "tier": 4,
      "tier_label": "High Risk"
    },
    "90_day": {
      "risk_score": 0.7889,
      "tier": 5,
      "tier_label": "Critical Risk"
    }
  },
  "financial_projection": {
    "30_day": {
      "days": 30,
      "projected_cost": 1520.55,
      "intervention_cost": 1200.0,
      "expected_savings": 228.08,
      "net_benefit": -971.92,
      "roi_pct": -81.0
    },
    "60_day": {
      "days": 60,
      "projected_cost": 3041.1,
      "intervention_cost": 1200.0,
      "expected_savings": 456.17,
      "net_benefit": -743.83,
      "roi_pct": -62.0
    },
    "90_day": {
      "days": 90,
      "projected_cost": 4561.64,
      "intervention_cost": 2500.0,
      "expected_savings": 821.1,
      "net_benefit": -1678.9,
      "roi_pct": -67.2
    }
  }
}
```

---

## Clinical Workflow Integration

### Typical Clinic Workflow:

1. **Patient Registration** → Collect demographics, conditions, utilization data
2. **Run Prediction** → `python predict_new_patient.py`
3. **Review Risk Tier** → Check 30/60/90-day tier assignments
4. **Plan Intervention** → Based on ROI analysis and clinical judgment
5. **Schedule Follow-up** → Per tier recommendations
6. **Track Outcomes** → Collect readmission data for model improvement

### Decision Rules by Tier:

| Tier | Risk Score | Action | Timeline |
|------|-----------|--------|----------|
| 1 | < 10% | Routine care | 12 months |
| 2 | 10-25% | Basic monitoring | 6 months |
| 3 | 25-50% | Active care coordination | 3 months |
| 4 | 50-75% | Intensive management | Weekly |
| 5 | > 75% | Emergency intervention | Daily/Admit |

---

## Troubleshooting

### Issue: "Patient ID must be between 0 and 2999" in interactive mode

This validation is for database-loaded patients. For new patients, just enter any ID.

### Issue: CSV has missing columns

Add missing columns with default values (0 for conditions, 0 for visits).

### Issue: Risk scores seem unrealistic

- Verify condition flags (1 = yes, 0 = no)
- Check annual cost is in dollars
- Review utilization counts are realistic
- High-risk patients: multiple comorbidities + high utilization

---

## Next Steps

1. **Train models**: Ensure `python run_pipeline.py` has completed
2. **Prepare patient data**: Use interactive or CSV method
3. **Run analysis**: `python predict_new_patient.py`
4. **Review results**: Check text reports and JSON data
5. **Implement interventions**: Based on tier recommendations
6. **Collect outcomes**: Feed back into model training (future version)

---

## Questions?

Refer to:
- [New Patient Prediction Guide](NEW_PATIENT_PREDICTION_GUIDE.md)
- [Interactive Analysis Guide](INTERACTIVE_ANALYSIS_GUIDE.md)
- Source code: [new_patient_risk_prediction.py](../mock_testing/new_patient_risk_prediction.py)
