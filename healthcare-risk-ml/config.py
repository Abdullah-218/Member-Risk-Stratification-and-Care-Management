"""
Shared configuration for Healthcare Risk ML Pipeline
This module provides centralized path definitions for all scripts.
"""

from pathlib import Path

# Project Root
PROJECT_ROOT = Path(__file__).parent

# Directory Paths
SRC_DIR = PROJECT_ROOT / 'src'
EVALUATION_DIR = PROJECT_ROOT / 'evaluation'
DATA_DIR = PROJECT_ROOT / 'data'
MODELS_DIR = PROJECT_ROOT / 'models'
CATBOOST_INFO_DIR = PROJECT_ROOT / 'catboost_info'

# Data Subdirectories
RAW_DATA_DIR = DATA_DIR / 'raw'
PROCESSED_DATA_DIR = DATA_DIR / 'processed'
OUTPUT_DIR = DATA_DIR / 'output'

# Output Subdirectories
ACCURACY_DIR = OUTPUT_DIR / 'accuracy'
COMPARISON_DIR = OUTPUT_DIR / 'comparison'
INTERACTIVE_ANALYSIS_DIR = OUTPUT_DIR / 'interactive_analysis'
MOCK_TESTING_DIR = OUTPUT_DIR / 'mock_testing'
ORG_ANALYSIS_DIR = OUTPUT_DIR / 'org_analysis'
PATIENT_ANALYSIS_DIR = OUTPUT_DIR / 'patient_analysis'
ROI_DIR = OUTPUT_DIR / 'roi'
ROI_OPTIMIZED_DIR = OUTPUT_DIR / 'roi_optimized'
SHAP_DIR = OUTPUT_DIR / 'shap'
SIMPLE_TESTING_DIR = OUTPUT_DIR / 'simple_testing'

# Common Data Files
CURATED_DATASET_PATH = PROCESSED_DATA_DIR / 'curated_15k_patients.csv'
CURATED_PATIENT_IDS_PATH = PROCESSED_DATA_DIR / 'curated_patient_ids.csv'
FEATURES_PATH = PROCESSED_DATA_DIR / 'features_27.csv'

# Training Data
X_TRAIN_PATH = PROCESSED_DATA_DIR / 'X_train.csv'
X_TEST_PATH = PROCESSED_DATA_DIR / 'X_test.csv'

# Target Variables (30, 60, 90 day readmission)
Y_30_TRAIN_PATH = PROCESSED_DATA_DIR / 'y_30_train.csv'
Y_30_TEST_PATH = PROCESSED_DATA_DIR / 'y_30_test.csv'
Y_60_TRAIN_PATH = PROCESSED_DATA_DIR / 'y_60_train.csv'
Y_60_TEST_PATH = PROCESSED_DATA_DIR / 'y_60_test.csv'
Y_90_TRAIN_PATH = PROCESSED_DATA_DIR / 'y_90_train.csv'
Y_90_TEST_PATH = PROCESSED_DATA_DIR / 'y_90_test.csv'

# Models
BEST_MODELS_DIR = MODELS_DIR / 'best_models'
COMPARISON_MODELS_DIR = MODELS_DIR / 'comparison'

# Output Files
ACCURACY_REPORT_PATH = ACCURACY_DIR / 'accuracy_report.txt'
COMPARISON_RESULTS_PATH = COMPARISON_DIR / 'model_comparison_results.csv'
EXECUTIVE_SUMMARY_PATH = COMPARISON_DIR / 'executive_summary.txt'

# Create all directories
def create_directories():
    """Create all necessary directories if they don't exist."""
    directories = [
        DATA_DIR,
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        OUTPUT_DIR,
        ACCURACY_DIR,
        COMPARISON_DIR,
        INTERACTIVE_ANALYSIS_DIR,
        MOCK_TESTING_DIR,
        ORG_ANALYSIS_DIR,
        PATIENT_ANALYSIS_DIR,
        ROI_DIR,
        ROI_OPTIMIZED_DIR,
        SHAP_DIR,
        SIMPLE_TESTING_DIR,
        MODELS_DIR,
        BEST_MODELS_DIR,
        COMPARISON_MODELS_DIR,
        CATBOOST_INFO_DIR,
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


# Initialize directories on import
create_directories()
