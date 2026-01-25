# 🏥 Healthcare Risk Stratification using Machine Learning

A comprehensive machine learning system to **predict health deterioration risk**, stratify patients into actionable risk tiers, explain AI predictions with SHAP, calculate ROI impact, and optimize models for healthcare organizations.

---

## 📌 Overview

Healthcare systems need to identify high-risk patients early to enable proactive interventions, reduce avoidable hospitalizations, and optimize care spending.

This project builds an **end-to-end ML pipeline** that:
- ✅ Curates 15,000 stratified patients from raw CMS data
- ✅ Engineers 27 clinically-relevant features
- ✅ Creates 3 prediction models (30/60/90-day horizons)
- ✅ Trains XGBoost models with strong predictive performance
- ✅ Explains predictions with SHAP explainability
- ✅ Calculates ROI and cost-benefit analysis
- ✅ Optimizes models based on business constraints

---

## 🎯 Problem Statement

> Build an end-to-end ML system that predicts health deterioration risk across multiple time horizons, stratifies patients into actionable tiers, explains predictions with interpretable AI, calculates financial ROI, and optimizes models to balance prediction quality with business constraints.

---

## 🧠 Solution Approach

- **Data Processing**: Curate 15K patients from CMS beneficiary and claims data
- **Feature Engineering**: Extract 27 features from demographics, diagnoses, utilization, and costs
- **Target Creation**: Create hierarchical 30/60/90-day deterioration targets
- **Model Training**: Train XGBoost models for each time horizon
- **Explainability**: Use SHAP for global and patient-level interpretability
- **ROI Analysis**: Calculate cost impact and financial ROI
- **Model Optimization**: Fine-tune hyperparameters and select best performers

---

## 🏢 Target Users

- **Healthcare Organizations** – population health management
- **Insurance/Payers** – risk stratification and care targeting
- **Care Management Teams** – intervention prioritization
- **Clinical Leaders** – evidence-based resource allocation

---

## 📊 Data Sources

- **CMS DE-SynPUF Data** – Synthetic Medicare beneficiary & claims data
  - Beneficiary Summary Files (2008-2009)
  - Inpatient Claims
  - Outpatient Claims
- **Patient Population**: 15,000 stratified Medicare beneficiaries

---

## 🤖 Machine Learning Approach

### Model Selection: XGBoost Classifier
- **Why?** Excellent for tabular healthcare data
- Captures non-linear feature interactions
- Produces well-calibrated probability scores
- Compatible with SHAP explanations
- Handles mixed feature types and missing values

### Multi-Horizon Prediction
- **30-day**: Critical acute events
- **60-day**: Critical + high-risk events  
- **90-day**: All deterioration signals

### Evaluation Metrics
- **Classification**: Precision, Recall, F1-Score
- **Ranking**: ROC-AUC, Average Precision
- **Calibration**: Calibration curves, Hosmer-Lemeshow test

---

## 📤 Outputs

### Member-Level
- Risk probability score
- Risk tier (Very Low → Very High)
- Key contributing health factors (SHAP)

### Population-Level
- Risk tier distribution
- High-risk member segmentation

### Evaluation Artifacts
- ROC curves
- Precision–Recall curves
- Calibration plots
- Feature importance
- SHAP visualizations
- Markdown evaluation report

---

## 🗂️ Project Structure

```
healthcare-risk-ml/
│
├── 📁 data/
│   ├── raw/
│   │   └── cms/
│   │       ├── beneficiary/           # Beneficiary summary files
│   │       ├── inpatient/             # Inpatient claims
│   │       └── outpatient/            # Outpatient claims
│   │
│   ├── processed/
│   │   ├── curated_15k_patients.csv   # Final curated dataset (15,000 patients)
│   │   ├── curated_patient_ids.csv    # Patient ID mapping
│   │   ├── features_27.csv            # 27 engineered features
│   │   ├── X_train.csv                # Training features (12,000 samples)
│   │   ├── X_test.csv                 # Test features (3,000 samples)
│   │   ├── y_30_train.csv             # 30-day target (train)
│   │   ├── y_30_test.csv              # 30-day target (test)
│   │   ├── y_60_train.csv             # 60-day target (train)
│   │   ├── y_60_test.csv              # 60-day target (test)
│   │   ├── y_90_train.csv             # 90-day target (train)
│   │   └── y_90_test.csv              # 90-day target (test)
│   │
│   └── output/
│       ├── comparison/
│       │   ├── executive_summary.txt              # Model comparison summary
│       │   └── model_comparison_results.csv       # Detailed comparison metrics
│       │
│       ├── roi/
│       │   ├── executive_summary.txt              # ROI analysis summary
│       │   ├── patient_level_roi.csv              # Per-patient ROI metrics
│       │   └── tier_roi_summary.csv               # Tier-level ROI summary
│       │
│       ├── roi_optimized/
│       │   ├── executive_summary.txt              # Optimized model ROI
│       │   ├── patient_level_roi.csv              # Optimized ROI metrics
│       │   └── tier_summary.csv                   # Optimized tier summary
│       │
│       ├── shap/
│       │   ├── explainability_report.txt          # SHAP analysis report
│       │   ├── tier_analysis.csv                  # Risk tier patterns
│       │   ├── global_feature_importance.png      # Global importance plot
│       │   ├── summary_30_day.png                 # 30-day SHAP summary
│       │   ├── summary_60_day.png                 # 60-day SHAP summary
│       │   ├── summary_90_day.png                 # 90-day SHAP summary
│       │   ├── dependence_plots.png               # Feature dependence plots
│       │   ├── patient_explanation_1.png          # Patient 1 explanation
│       │   ├── patient_explanation_2.png          # Patient 2 explanation
│       │   └── ...                                # Additional patient explanations
│       │
│       ├── roc_curves_multiwindow.png             # ROC curves (30/60/90 days)
│       └── feature_importance.png                 # XGBoost feature importance
│
├── 📁 models/
│   ├── xgb_model_30_day.pkl            # 30-day XGBoost model
│   ├── xgb_model_60_day.pkl            # 60-day XGBoost model
│   ├── xgb_model_90_day.pkl            # 90-day XGBoost model
│   ├── feature_names.pkl               # Feature name mapping
│   ├── model_performance.pkl           # Performance metrics
│   ├── shap_explainer_30_day.pkl       # SHAP explainer (30-day)
│   ├── shap_explainer_60_day.pkl       # SHAP explainer (60-day)
│   └── shap_explainer_90_day.pkl       # SHAP explainer (90-day)
│
├── 📁 src/
│   ├── 01_create_curated_dataset.py     # Data loading & curation (15K patients)
│   ├── 02_feature_engineering.py        # Feature extraction (27 features)
│   ├── 03_create_targets.py             # Target variable creation (30/60/90-day)
│   ├── 04_train_models.py               # Model training (3 XGBoost models)
│   ├── 05_shap_explainer.py             # SHAP explanations & visualizations
│   ├── 06_roi_calculator.py             # ROI & financial impact analysis
│   ├── 07_model_comparison_and_optimization.py  # Compare & optimize models
│   ├── 08_roi_with_best_models.py       # ROI with optimized models
│   ├── 09_final_hyperparameter_tuning.py # Hyperparameter optimization
│   
│
├── 📁 hackathon_dept/                   # Python virtual environment
│   ├── bin/                             # Executables (python, pip, etc.)
│   ├── lib/                             # Site packages
│   ├── include/                         # Headers
│   └── pyvenv.cfg                       # Environment config
│
│
├── 📄 run_pipeline.py                   # Main pipeline orchestrator
├── 📄 requirements.txt                  # Python dependencies
└── 📄 README.md                         # This file
```

---

## 🔧 Setup Instructions

### Prerequisites
- Python 3.8+
- macOS/Linux/Windows
- ~2GB disk space for data & models

### Step 1: Create Virtual Environment

```bash
python3 -m venv hackathon_dept
source hackathon_dept/bin/activate  # On Windows: hackathon_dept\Scripts\activate
```

### Step 2: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Verify Installation

```bash
python -c "import xgboost, shap, pandas; print('✅ All packages installed')"
```

---

## 🚀 Execution

### Option 1: Run Full Pipeline (Recommended)

```bash
# From project root directory
python run_pipeline.py
```

This executes all 9 steps sequentially:
1. ✅ Creates 15K curated dataset
2. ✅ Engineers 27 features
3. ✅ Creates 30/60/90-day targets
4. ✅ Trains 3 XGBoost models
5. ✅ Generates SHAP explanations
6. ✅ Calculates ROI metrics
7. ✅ Compares & optimizes models
8. ✅ Calculates optimized ROI
9. ✅ Final hyperparameter tuning

**Output**: `pipeline.log` + all artifacts in `data/output/`

---

### Option 2: Run Step-by-Step

Execute scripts individually in sequence:

```bash
# Step 1: Create curated dataset (15,000 patients)
python src/01_create_curated_dataset.py
# Output: data/processed/curated_15k_patients.csv

# Step 2: Feature engineering (27 features)
python src/02_feature_engineering.py
# Output: data/processed/features_27.csv

# Step 3: Create targets (30/60/90-day)
python src/03_create_targets.py
# Output: data/processed/y_*_train.csv, y_*_test.csv

# Step 4: Train models (XGBoost)
python src/04_train_models.py
# Output: models/xgb_model_*.pkl

# Step 5: SHAP explanations
python src/05_shap_explainer.py
# Output: data/output/shap/*.png, *.csv

# Step 6: ROI analysis
python src/06_roi_calculator.py
# Output: data/output/roi/executive_summary.txt

# Step 7: Model comparison & optimization
python src/07_model_comparison_and_optimization.py
# Output: data/output/comparison/model_comparison_results.csv

# Step 8: ROI with optimized models
python src/08_roi_with_best_models.py
# Output: data/output/roi_optimized/executive_summary.txt

# Step 9: Hyperparameter tuning
python src/09_final_hyperparameter_tuning.py
# Output: Final optimized models
```

---

## 📊 Expected Results

### Data Pipeline
```
✅ 15,000 stratified patients
   - Tier 1: 5,250 patients (Low risk)
   - Tier 2: 4,500 patients
   - Tier 3: 3,000 patients
   - Tier 4: 1,500 patients
   - Tier 5: 750 patients (High risk)

✅ 27 engineered features
   - Demographics: 5 features
   - Chronic conditions: 10 features
   - Utilization: 6 features
   - Costs: 4 features
   - Derived metrics: 2 features
```

### Model Performance
```
30-Day Model:
  ROC-AUC: 0.69 | Avg Precision: 0.23 | Positive Rate: 6.3%

60-Day Model:
  ROC-AUC: 0.70 | Avg Precision: 0.33 | Positive Rate: 14.8%

90-Day Model:
  ROC-AUC: 0.76 | Avg Precision: 0.55 | Positive Rate: 27.3%
```

### Key Risk Drivers
```
Top 10 Features by Importance:
  1. Total annual cost (highest impact)
  2. Cost percentile
  3. Ischemic heart disease
  4. Total inpatient costs
  5. Diabetes diagnosis
  6. High-cost user indicator
  7. Frailty score
  8. Recent admission
  9. Complexity index
  10. ESRD diagnosis
```

### Outputs Generated
```
📊 Visualizations:
   ✅ ROC curves (30/60/90-day comparison)
   ✅ Feature importance plots
   ✅ SHAP summary plots (3 models)
   ✅ Patient-level SHAP explanations (5 examples)
   ✅ Dependence plots
   ✅ Risk tier analysis

📄 Reports:
   ✅ Model comparison summary
   ✅ SHAP explainability report
   ✅ ROI analysis (original & optimized)
   ✅ Executive summaries

📋 Data Files:
   ✅ Patient-level predictions & ROI
   ✅ Tier-level aggregations
   ✅ Risk tier patterns
```

---

## 🔍 Model Details

### XGBoost Configuration
```python
max_depth: 6-8
learning_rate: 0.1
n_estimators: 100-200
subsample: 0.8
colsample_bytree: 0.8
scale_pos_weight: Dynamic (based on class imbalance)
```

### Class Imbalance Handling
- Dynamic `scale_pos_weight` based on target distribution
- Stratified train-test splits
- Evaluation via ROC-AUC & Average Precision

### Explainability: SHAP
- **Global**: Feature importance across population
- **Patient-level**: Individual prediction breakdowns
- **Group-level**: Risk tier pattern analysis

---

## 💰 ROI Calculation

### Metrics
- **Sensitivity @ Specificity**: Identify true positives at fixed specificity
- **Cost Avoidance**: Assumed intervention cost vs. prevented event cost
- **Net ROI**: Cost savings minus intervention costs
- **Tier-Level Aggregation**: Total organizational impact

### Assumptions
- Intervention cost: $2,000 per patient
- Prevented event cost: $25,000 per patient
- Risk threshold: Model-specific based on optimization

---

## ⭐ Key Features

- ✅ **End-to-End Pipeline** – Data ingestion to predictions
- ✅ **Multi-Horizon Prediction** – 30/60/90-day risk forecasting
- ✅ **Explainable AI** – SHAP for interpretability
- ✅ **ROI Analysis** – Financial impact quantification
- ✅ **Model Optimization** – Hyperparameter tuning & comparison
- ✅ **Population Analytics** – Tier-level insights
- ✅ **Production-Ready** – Modular, logged, error-handled
- ✅ **Reproducible** – Fixed seeds & documented steps

---

## 🔮 Future Enhancements

### Short-term
- [ ] REST API (FastAPI) for real-time predictions
- [ ] Patient-facing dashboard
- [ ] Retraining pipeline for data drift detection
- [ ] A/B testing framework

### Medium-term
- [ ] Temporal models (LSTM/Transformers)
- [ ] Real-time streaming predictions
- [ ] Integration with EHR systems (FHIR)
- [ ] Cost optimization via reinforcement learning

### Long-term
- [ ] Federated learning across organizations
- [ ] Causal inference for intervention design
- [ ] Patient engagement module
- [ ] Outcome tracking & feedback loops

---

## 📚 References

### Data
- CMS DE-SynPUF: https://www.cms.gov/Research-Statistics-Data-and-Systems/Downloadable-Public-Use-Files/SynPUF/Overview

### Methods
- XGBoost: https://arxiv.org/abs/1603.02754
- SHAP: https://arxiv.org/abs/1705.07874
- Healthcare ML: https://arxiv.org/abs/1901.08387

---

## 📞 Support

For issues or questions:
1. Check `pipeline.log` for error details
2. Verify all input data files exist in `data/raw/`
3. Ensure Python 3.8+ and all dependencies installed
4. Review individual script docstrings for implementation details

---

## 📝 License

This project is provided as-is for educational and research purposes.

---

**Last Updated**: January 2026  
**Status**: ✅ Production Ready