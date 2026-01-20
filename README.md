# 🏥 Healthcare Risk Stratification using Machine Learning

A machine learning–based system to **predict health deterioration risk**, stratify members into actionable risk tiers, and support **proactive care management** for healthcare organizations and insurance payers.

---

## 📌 Overview

Healthcare systems often operate reactively, intervening only after a patient’s condition worsens. This leads to avoidable hospitalizations, increased costs, and poorer health outcomes.

This project builds an **end-to-end ML pipeline** that:
- Predicts risk of health deterioration
- Stratifies members into 5 risk tiers
- Explains *why* a member is high risk (Explainable AI)
- Provides population-level risk insights

The system is designed as a **decision-support tool** for healthcare organizations and care management teams.

---

## 🎯 Problem Statement

> Build a machine learning system that predicts health deterioration risk for healthcare members, stratifies them into actionable risk tiers, explains key risk drivers, and enables proactive care management to reduce avoidable high-cost medical events.

---

## 🧠 Solution Summary

- Supervised ML models trained on historical healthcare data
- Risk probability output (0–1)
- Conversion into 5 actionable risk tiers
- Explainability using SHAP
- Population risk analytics for prioritization

---

## 🏢 Target Users

- Healthcare organizations  
- Insurance companies (payers)  
- Population health & care management teams  

Patients benefit **indirectly** through early intervention.

---

## 📊 Datasets Used

- **CMS Synthetic Beneficiary Data (DE-SynPUF)**  
- **Heart Disease UCI Dataset**
- **Pima Indians Diabetes Dataset**

All datasets are structured and suitable for supervised learning.

---

## 🤖 Machine Learning Models

- **Logistic Regression** – baseline, interpretable model
- **XGBoost Classifier** – final high-performance model

### Why XGBoost?
- Excellent performance on tabular healthcare data
- Captures non-linear feature interactions
- Produces calibrated probability scores
- Works well with explainability (SHAP)

### Evaluation Metrics
- Accuracy
- Precision & Recall
- ROC-AUC
- Calibration analysis

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
├── data/
│   ├── raw/
│   │   └── cms/
│   │       ├── DE1_0_2008_Beneficiary_Summary_File_Sample_1.csv
│   │       └── DE1_0_2009_Beneficiary_Summary_File_Sample_1.csv
│   │
│   ├── processed/
│   │   ├── cms_2008_featured.csv
│   │   ├── cms_2009_featured.csv
│   │   ├── training_data.csv
│   │   ├── X_train.csv
│   │   ├── X_test.csv
│   │   ├── y_train.csv
│   │   └── y_test.csv
│   │
│   └── output/
│       ├── evaluation_report.md
│       ├── roc_curves.png
│       ├── feature_importance.png
│       ├── shap_summary.png
│       ├── shap_waterfall_patient0.png
│       ├── calibration_curve.png
│       ├── precision_recall_curve.png
│       └── risk_distribution.png
│
├── models/
│   ├── xgb_risk_model.pkl
│   ├── lr_baseline_model.pkl
│   ├── scaler.pkl
│   ├── feature_names.pkl
│   └── shap_explainer.pkl
│
├── src/
│   ├── 01_data_loading.py
│   ├── 02_feature_engineering.py
│   ├── 03_target_creation.py
│   ├── 04_model_training.py
│   ├── 05_shap_explainer.py
│   └── 06_model_evaluation.py
│
├── requirements.txt
├── run_pipeline.py
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Create Virtual Environment
```
python -m venv hackathon_dept
source hackathon_dept/bin/activate
pip install -r requirements.txt
```

##🚀 Execution

```
Option 1: Run Full Pipeline :
python run_pipeline.py

Option 2: Run Step-by-Step :
python src/01_data_loading.py
python src/02_feature_engineering.py
python src/03_target_creation.py
python src/04_model_training.py
python src/05_shap_explainer.py
python src/06_model_evaluation.py

```

### ✅ What You Get After Execution

```
Trained Models :

models/
├── xgb_risk_model.pkl
├── lr_baseline_model.pkl
├── scaler.pkl
├── feature_names.pkl
└── shap_explainer.pkl

Evaluation Outputs :

data/output/
├── evaluation_report.md
├── roc_curves.png
├── feature_importance.png
├── shap_summary.png
├── calibration_curve.png
├── precision_recall_curve.png
└── risk_distribution.png

```

⭐ Key Highlights

	•	End-to-end ML pipeline
	•	Explainable AI using SHAP
	•	Population health analytics
	•	Hackathon-ready & reproducible
	•	Industry-aligned healthcare use case


🔮 Future Enhancements

	•	Real-time API (FastAPI / Node.js)
	•	Temporal risk prediction (30/60/90 days)
	•	Cost impact & ROI modeling
	•	Patient engagement module
	•	FHIR-based EHR integration (conceptual)
