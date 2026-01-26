# 🏥 NEW PATIENT RISK PREDICTION SYSTEM

## 📌 START HERE

Welcome! You've just received a **complete new patient risk prediction system** with the following capabilities:

✅ **Predict risk** for patients new to the platform (not in database)  
✅ **3-window analysis** - predict 30, 60, and 90-day readmission risk  
✅ **ROI calculations** - financial impact of interventions per window  
✅ **Automated reporting** - human-readable + machine-readable outputs  

---

## 🚀 Quick Start (2 Minutes)

```bash
# 1. Activate environment
source /Users/abdullah/healthcare-risk-ml/hackathon_dept/bin/activate

# 2. Run the tool
python predict_new_patient.py

# 3. Select option 1 or 2 and follow prompts
# Option 1: Interactive mode (type in patient data)
# Option 2: Batch CSV mode (load multiple patients)
```

**Output**: Text report + JSON data saved to `data/output/new_patient_analysis/`

---

## 📚 Documentation Guide

### For Quick Overview (5 min)
👉 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Essential info only

### For Implementation (15 min)
👉 **[USAGE_EXAMPLES_NEW_PATIENT.md](Readme/USAGE_EXAMPLES_NEW_PATIENT.md)** - Step-by-step examples

### For Complete Details (30 min)
👉 **[NEW_PATIENT_PREDICTION_GUIDE.md](Readme/NEW_PATIENT_PREDICTION_GUIDE.md)** - Full specification

### For System Architecture (20 min)
👉 **[SYSTEM_GUIDE.md](Readme/SYSTEM_GUIDE.md)** - Overall design

### For Implementation Details (20 min)
👉 **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built

### For File Inventory (10 min)
👉 **[FILES_AND_FEATURES.md](FILES_AND_FEATURES.md)** - Complete list of new components

---

## 📂 What You Got

### Core Scripts
| File | Purpose |
|------|---------|
| `predict_new_patient.py` | 🚀 Main launcher (start here!) |
| `mock_testing/new_patient_risk_prediction.py` | 💾 Core prediction engine |
| `mock_testing/sample_new_patients.csv` | 📊 Example patient data |

### Documentation (6 files)
| File | Content |
|------|---------|
| `QUICK_REFERENCE.md` | Quick start cheat sheet |
| `IMPLEMENTATION_SUMMARY.md` | What was built & why |
| `FILES_AND_FEATURES.md` | File inventory & specs |
| `Readme/NEW_PATIENT_PREDICTION_GUIDE.md` | Complete feature guide |
| `Readme/USAGE_EXAMPLES_NEW_PATIENT.md` | Practical examples |
| `Readme/SYSTEM_GUIDE.md` | System architecture |

---

## 💡 What It Does

### Input
Patient profile (19+ fields):
- Demographics (age, gender)
- Chronic conditions (10 conditions)
- Healthcare utilization (6 visit types)
- Annual cost

### Processing
Uses pre-trained ML models to predict:
- **30-day risk** → Tier assignment → ROI calculation
- **60-day risk** → Tier assignment → ROI calculation
- **90-day risk** → Tier assignment → ROI calculation

### Output
For each window:
- Risk score (0-1 probability)
- Risk tier (1-5 category)
- Projected cost
- Intervention cost
- Expected savings
- Net benefit
- ROI percentage
- Clinical recommendation

---

## 🎯 Usage Examples

### Example 1: Single Patient (Interactive)
```bash
python predict_new_patient.py
# Select: 1 (Interactive)
# Enter: Patient data (age, cost, conditions, visits)
# Get: Risk assessment + ROI for 3 windows
# Save: Text report + JSON data
```

### Example 2: Multiple Patients (CSV)
```bash
python predict_new_patient.py
# Select: 2 (CSV Batch)
# Enter: /path/to/patients.csv
# Get: Reports for all patients in CSV
# Save: Individual text + JSON files
```

### Example 3: View Sample Format
```bash
python predict_new_patient.py
# Select: 3 (View Sample)
# See: CSV column requirements
# Then: Create your own CSV with that format
```

---

## 📊 Understanding Risk Tiers

```
Tier 1 (0-10%)     → Normal        → Routine care ($0)
Tier 2 (10-25%)    → Low Risk      → Basic monitoring ($200)
Tier 3 (25-50%)    → Moderate      → Care coordination ($600)
Tier 4 (50-75%)    → High Risk     → Intensive management ($1,200)
Tier 5 (75-100%)   → Critical      → Urgent intervention ($2,500)
```

Each tier has:
- Different intervention cost
- Different expected savings rate (0-30%)
- Different recommended actions

---

## 💰 Financial Model

**Example Calculation:**
```
Patient: 72-year-old with diabetes, heart disease, kidney disease
Annual Cost: $18,500

30-DAY WINDOW (Month 1):
  Projected Cost: $18,500 × (30/365) = $1,521
  Risk Prediction: 72.4% → Tier 4 (High)
  Preventable Cost: $1,521 × 60% = $913
  Intervention Cost: $1,200 (Tier 4)
  Expected Savings: $913 × 25% = $228
  Net Benefit: $228 - $1,200 = -$972
  ROI: (-$972 / $1,200) × 100 = -81%

INTERPRETATION: Negative ROI for 30-day, but Tier 4 still 
  warrants intervention due to high risk. Look at 90-day ROI.
```

---

## ✨ Key Features

✅ **Instant Predictions** - No database lookup needed  
✅ **Multi-Window Analysis** - 3 time periods simultaneously  
✅ **Financial ROI** - Cost-benefit analysis included  
✅ **Flexible Input** - Interactive or batch CSV  
✅ **Comprehensive Reports** - Text + JSON formats  
✅ **EHR Ready** - JSON for system integration  
✅ **Validated** - Uses trained ML models  
✅ **Documented** - 6 documentation files  

---

## 🔍 When To Use This Tool

### ✅ Use When:
- Patient is **new to the platform** (no history in database)
- Need **quick risk assessment** (30, 60, 90 days)
- Want **financial justification** for interventions
- Need to **batch process** new patient cohorts
- Integrating with **EHR systems** (via JSON)

### ❌ Don't Use When:
- Looking up **existing patients** → Use: `interactive_individual_patient_analysis.py`
- Need **organization-wide analysis** → Use: `organization_risk_analysis.py`
- Analyzing **historical outcomes** → Use: `evaluation/02_roi_calculation.py`

---

## 🎓 Reading Guide

**I have 5 minutes:**  
→ Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**I have 15 minutes:**  
→ Read [USAGE_EXAMPLES_NEW_PATIENT.md](Readme/USAGE_EXAMPLES_NEW_PATIENT.md)

**I have 30 minutes:**  
→ Read [NEW_PATIENT_PREDICTION_GUIDE.md](Readme/NEW_PATIENT_PREDICTION_GUIDE.md)

**I need the complete picture:**  
→ Read [SYSTEM_GUIDE.md](Readme/SYSTEM_GUIDE.md)

**I want technical details:**  
→ Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 🚀 Getting Started Checklist

- [ ] Read this file (5 min)
- [ ] Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (5 min)
- [ ] Activate environment: `source hackathon_dept/bin/activate`
- [ ] Run: `python predict_new_patient.py`
- [ ] Try option 1 (interactive) with sample data
- [ ] Check output in: `data/output/new_patient_analysis/`
- [ ] Read generated report
- [ ] Try option 2 (CSV) with `sample_new_patients.csv`
- [ ] Read [USAGE_EXAMPLES_NEW_PATIENT.md](Readme/USAGE_EXAMPLES_NEW_PATIENT.md)
- [ ] Create your own CSV with patient data
- [ ] Run analysis on your patients

---

## 🎯 Three Window Strategy

### 30-Day Window
**Best For**: Immediate triage decisions
- Early warning system
- Urgent referrals needed?
- Quick intervention ROI

### 60-Day Window  
**Best For**: Short-term care planning
- Care coordination planning
- Program enrollment decisions
- Cost management strategy

### 90-Day Window
**Best For**: Quarterly planning
- Resource allocation
- Team capacity planning
- Population health initiatives

**Recommendation**: Always use all 3 windows for complete picture.

---

## 💻 System Requirements

- Python 3.7+ (already configured)
- Pre-trained models (auto-loaded)
- No database required
- No internet required
- Works offline

---

## 📊 Sample Output

**Text Report:**
```
PATIENT RISK ASSESSMENT REPORT
====================================================================
Patient ID: NEW_001
Generated: January 25, 2026 at 14:32:15

PATIENT SUMMARY
Age: 72 years
Annual Healthcare Cost: $18,500.00

RISK ASSESSMENT - ALL WINDOWS
📅 MONTH 1 (0-30 DAYS)
   Risk Score: 0.7245
   Risk Tier: 4/5 - High Risk
   Status: Patient has high risk. Intensive case management recommended.

📊 MONTH 1 (0-30 DAYS)
   Risk Tier: 4/5 - High Risk
   Risk Score: 0.7245
   Projected Cost: $1,520.55
   Preventable Cost (60%): $912.33
   Intervention Cost: $1,200.00
   Expected Savings: $228.08
   Net Benefit: -$971.92
   ROI: -81.0%
```

**JSON Output:**
```json
{
  "patient_id": "NEW_001",
  "timestamp": "2026-01-25T14:32:15.123456",
  "risk_predictions": {
    "30_day": {
      "risk_score": 0.7245,
      "tier": 4,
      "tier_label": "High Risk"
    },
    "60_day": {...},
    "90_day": {...}
  },
  "financial_projection": {
    "30_day": {
      "projected_cost": 1520.55,
      "intervention_cost": 1200.00,
      "expected_savings": 228.08,
      "net_benefit": -971.92,
      "roi_pct": -81.0
    },
    ...
  }
}
```

---

## 🔧 Troubleshooting

**Q: "Models not found" error**
```bash
# Solution: Train models first
python run_pipeline.py
```

**Q: "CSV column error"**
```bash
# Solution: Check sample format
cat mock_testing/sample_new_patients.csv
```

**Q: "Feature mismatch"**
```bash
# Solution: Ensure all 19+ columns in your CSV
# See: Readme/NEW_PATIENT_PREDICTION_GUIDE.md
```

**Q: Can I modify intervention costs?**
```bash
# Yes! Edit in: mock_testing/new_patient_risk_prediction.py
# Search for: self.intervention_costs = {
```

---

## 📞 Need Help?

1. **Quick answers** → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. **Examples** → [USAGE_EXAMPLES_NEW_PATIENT.md](Readme/USAGE_EXAMPLES_NEW_PATIENT.md)  
3. **Full details** → [NEW_PATIENT_PREDICTION_GUIDE.md](Readme/NEW_PATIENT_PREDICTION_GUIDE.md)
4. **Architecture** → [SYSTEM_GUIDE.md](Readme/SYSTEM_GUIDE.md)
5. **Code** → `mock_testing/new_patient_risk_prediction.py`

---

## 🎓 Learn More

```
For existing patients:     Readme/INTERACTIVE_ANALYSIS_GUIDE.md
For organization analysis: mock_testing/organization_risk_analysis.py
For system overview:       Readme/readME.md
```

---

## 🚀 Ready?

```bash
cd /Users/abdullah/healthcare-risk-ml
source hackathon_dept/bin/activate
python predict_new_patient.py
```

**That's it! Start analyzing new patients. 🏥**

---

**Created**: January 25, 2026  
**Status**: Complete & Ready for Production  
**Documentation**: Comprehensive (6 detailed guides)  
**Support**: Full codebase with comments  
