"""
Department Assignment Logic - Option C: Hybrid (Clinical + Risk Tier)
Assigns patients to one of 10 clinical departments based on primary condition.
Uses IF-THEN hierarchy to ensure all patients get assigned.
"""

import pandas as pd
import numpy as np
from typing import Tuple

# ============================================================================
# CLINICAL DEPARTMENTS (Option C)
# ============================================================================

DEPARTMENTS = {
    'CARDIOLOGY': {
        'code': 'CARD',
        'name': 'Cardiology',
        'specialty': 'CARDIAC',
        'description': 'Heart & cardiovascular disease management'
    },
    'NEPHROLOGY': {
        'code': 'NEPH',
        'name': 'Nephrology',
        'specialty': 'RENAL',
        'description': 'Kidney & renal disease management'
    },
    'ENDOCRINOLOGY': {
        'code': 'ENDO',
        'name': 'Endocrinology',
        'specialty': 'ENDOCRINE',
        'description': 'Diabetes & metabolic disease management'
    },
    'PULMONOLOGY': {
        'code': 'PULM',
        'name': 'Pulmonology',
        'specialty': 'PULMONARY',
        'description': 'Lung & respiratory disease management'
    },
    'NEUROLOGY': {
        'code': 'NEUR',
        'name': 'Neurology',
        'specialty': 'NEUROLOGICAL',
        'description': 'Neurological & cognitive disease management'
    },
    'ONCOLOGY': {
        'code': 'ONCO',
        'name': 'Oncology',
        'specialty': 'CANCER',
        'description': 'Cancer & malignancy management'
    },
    'PSYCHIATRY': {
        'code': 'PSYCH',
        'name': 'Psychiatry',
        'specialty': 'MENTAL_HEALTH',
        'description': 'Mental health & behavioral disease management'
    },
    'RHEUMATOLOGY': {
        'code': 'RHEUM',
        'name': 'Rheumatology',
        'specialty': 'AUTOIMMUNE',
        'description': 'Autoimmune & joint disease management'
    },
    'GERIATRICS': {
        'code': 'GERI',
        'name': 'Geriatrics',
        'specialty': 'ELDERLY_CARE',
        'description': 'Specialized care for elderly patients'
    },
    'GENERAL_MEDICINE': {
        'code': 'GEN_MED',
        'name': 'General Medicine',
        'specialty': 'PRIMARY_CARE',
        'description': 'General medical care & coordination'
    }
}


def assign_department_option_c(patient_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """
    Option C: Hybrid approach - assigns patient to clinical department based on primary condition,
    then tracks risk tier separately for stratification within department.
    
    IF-THEN hierarchy ensures all patients get assigned:
    1. If CHF OR Ischemic Heart Disease → CARDIOLOGY
    2. Else if CKD OR ESRD → NEPHROLOGY  
    3. Else if Diabetes → ENDOCRINOLOGY
    4. Else if COPD → PULMONOLOGY
    5. Else if Stroke OR Alzheimer's → NEUROLOGY
    6. Else if Cancer → ONCOLOGY
    7. Else if Depression → PSYCHIATRY
    8. Else if RA/OA → RHEUMATOLOGY
    9. Else if Age >= 75 OR Frailty Score > 0.7 → GERIATRICS
    10. Else → GENERAL_MEDICINE (catch-all)
    
    Args:
        patient_features: DataFrame with 27 features for each patient
        
    Returns:
        Tuple of (department_codes, department_ids) arrays
    """
    
    n_patients = len(patient_features)
    department_codes = np.empty(n_patients, dtype=object)
    department_ids = np.zeros(n_patients, dtype=int)
    
    # Process each patient with IF-THEN hierarchy
    for idx in range(n_patients):
        # 1. Cardiac: CHF OR Ischemic Heart Disease
        if (patient_features.iloc[idx].get('has_chf', 0) or 
            patient_features.iloc[idx].get('has_ischemic_heart', 0)):
            dept_code = 'CARD'
            dept_id = 1
        
        # 2. Renal: CKD OR ESRD
        elif (patient_features.iloc[idx].get('has_ckd', 0) or 
              patient_features.iloc[idx].get('has_esrd', 0)):
            dept_code = 'NEPH'
            dept_id = 2
        
        # 3. Endocrine: Diabetes
        elif patient_features.iloc[idx].get('has_diabetes', 0):
            dept_code = 'ENDO'
            dept_id = 3
        
        # 4. Pulmonary: COPD
        elif patient_features.iloc[idx].get('has_copd', 0):
            dept_code = 'PULM'
            dept_id = 4
        
        # 5. Neurology: Stroke OR Alzheimer's
        elif (patient_features.iloc[idx].get('has_stroke', 0) or 
              patient_features.iloc[idx].get('has_alzheimers', 0)):
            dept_code = 'NEUR'
            dept_id = 5
        
        # 6. Oncology: Cancer
        elif patient_features.iloc[idx].get('has_cancer', 0):
            dept_code = 'ONCO'
            dept_id = 6
        
        # 7. Psychiatry: Depression
        elif patient_features.iloc[idx].get('has_depression', 0):
            dept_code = 'PSYCH'
            dept_id = 7
        
        # 8. Rheumatology: RA/OA
        elif patient_features.iloc[idx].get('has_ra_oa', 0):
            dept_code = 'RHEUM'
            dept_id = 8
        
        # 9. Geriatrics: Age >= 75 OR High Frailty
        elif (patient_features.iloc[idx].get('age', 0) >= 75 or 
              patient_features.iloc[idx].get('frailty_score', 0) > 0.7):
            dept_code = 'GERI'
            dept_id = 9
        
        # 10. Default: General Medicine
        else:
            dept_code = 'GEN_MED'
            dept_id = 10
        
        department_codes[idx] = dept_code
        department_ids[idx] = dept_id
    
    return department_codes, department_ids


def get_department_distribution(department_codes: np.ndarray) -> dict:
    """
    Analyze distribution of patients across departments.
    
    Returns:
        Dict with department code as key, patient count as value
    """
    unique, counts = np.unique(department_codes, return_counts=True)
    return dict(zip(unique, counts))


def print_department_summary(department_codes: np.ndarray, department_ids: np.ndarray):
    """Print summary statistics of department assignment."""
    
    distribution = get_department_distribution(department_codes)
    total_patients = len(department_codes)
    
    print("\n" + "="*70)
    print("DEPARTMENT ASSIGNMENT SUMMARY (Option C: Hybrid)")
    print("="*70)
    print(f"\nTotal Patients: {total_patients:,}")
    print(f"Departments: {len(distribution)}")
    print(f"\nDistribution:")
    
    dept_names = {v['code']: v['name'] for v in DEPARTMENTS.values()}
    
    for dept_code in sorted(distribution.keys()):
        count = distribution[dept_code]
        percentage = (count / total_patients) * 100
        dept_name = dept_names.get(dept_code, 'Unknown')
        print(f"  {dept_code:8} ({dept_name:20}): {count:4,} patients ({percentage:5.1f}%)")
    
    print("\n" + "="*70)


if __name__ == '__main__':
    # Example usage
    print("Department Assignment Module (Option C: Hybrid)")
    print("This module handles clinical department assignment based on patient conditions.")
    print("\nFeatures:")
    print("  - 10 clinical departments (CARDIOLOGY, NEPHROLOGY, etc.)")
    print("  - IF-THEN hierarchy for deterministic assignment")
    print("  - Risk tiers (1-5) tracked separately for stratification")
    print("  - Guarantees 100% patient assignment (no nulls)")
