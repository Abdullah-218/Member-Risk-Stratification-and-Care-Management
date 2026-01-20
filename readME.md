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
│
├── requirements.txt
├── run_pipeline.py
└── README.md


# Create virtual environment
python -m venv hackathon_dept

# Activate (Mac/Linux)
source hackathon_dept/bin/activate

# Install dependencies
pip install -r requirements.txt

## 🚀 EXECUTION

### **Run Complete Pipeline**

# Option 1: Run all at once
python run_pipeline.py

# Option 2: Run step by step
python src/01_data_loading.py
python src/02_feature_engineering.py
python src/03_target_creation.py
python src/04_model_training.py
python src/05_shap_explainer.py
python src/06_model_evaluation.py
```



## ✅ WHAT YOU GET

After running, you'll have:
models/
├── xgb_risk_model.pkl          # Ready for Node.js backend
├── lr_baseline_model.pkl
├── scaler.pkl
├── feature_names.pkl
└── shap_explainer.pkl
data/output/
├── evaluation_report.md        # Show to judges
├── roc_curves.png
├── feature_importance.png
├── shap_summary.png
├── calibration_curve.png
├── precision_recall_curve.png
└── risk_distribution.png


