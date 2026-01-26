#!/usr/bin/env python3
"""
Quick launcher for New Patient Risk Prediction
Run this to immediately start analyzing new patients
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import the new patient predictor
from mock_testing.new_patient_risk_prediction import NewPatientRiskPredictor

def main():
    """Launch the new patient risk prediction tool"""
    
    # Check if models exist
    model_path = Path('models/best_30_day_model.pkl')
    if not model_path.exists():
        print("\n❌ Models not found!")
        print("Please run the full pipeline first:")
        print("   python run_pipeline.py")
        print("\nThen try again.\n")
        sys.exit(1)
    
    # Initialize predictor
    predictor = NewPatientRiskPredictor()
    predictor.display_header()
    
    print("="*70)
    print("SELECT INPUT METHOD")
    print("="*70)
    print("1) Interactive terminal input (one patient at a time)")
    print("2) Batch load from CSV (multiple patients)")
    print("3) View sample CSV format")
    print("4) Exit")
    print()
    
    while True:
        choice = input("Choose option (1-4): ").strip()
        if choice in ['1', '2', '3', '4']:
            break
        print("❌ Please enter 1, 2, 3, or 4")
    
    print()
    
    if choice == '1':
        # Interactive input
        predictor.run_new_patient_analysis()
        
    elif choice == '2':
        # CSV input
        csv_path = input("Enter path to CSV file: ").strip()
        try:
            patients = predictor.get_patient_input_csv(csv_path)
            for idx, patient_data in enumerate(patients):
                patient_id = f'CSV_{idx+1:03d}'
                print(f"\nProcessing patient {idx+1}/{len(patients)}...")
                predictor.run_new_patient_analysis(patient_data, patient_id)
        except Exception as e:
            print(f"❌ Error: {e}")
            return
    
    elif choice == '3':
        # Show sample format
        print("="*70)
        print("SAMPLE CSV FORMAT")
        print("="*70)
        print("\nCSV should have these columns:\n")
        
        sample_columns = [
            "age",
            "gender_M, gender_F (1 for yes, 0 for no)",
            "total_annual_cost",
            "condition_diabetes",
            "condition_hypertension", 
            "condition_heart_disease",
            "condition_copd",
            "condition_asthma",
            "condition_kidney_disease",
            "condition_depression",
            "condition_cancer",
            "condition_stroke",
            "condition_arthritis",
            "util_inpatient_visits",
            "util_er_visits",
            "util_outpatient_visits",
            "util_urgent_care_visits",
            "util_pharmacy_claims",
            "util_specialist_visits"
        ]
        
        for i, col in enumerate(sample_columns, 1):
            print(f"  {i:2d}. {col}")
        
        print("\nExample row:")
        print("  68,1,0,12500,1,1,1,0,0,1,0,0,0,1,2,3,8,1,15,4")
        print("\nSee: mock_testing/sample_new_patients.csv")
        print()
        return
    
    elif choice == '4':
        print("Exiting...\n")
        return
    
    print("\n" + "="*70)
    print("✅ ANALYSIS COMPLETE!")
    print("="*70)
    print(f"Results saved to: data/output/new_patient_analysis/\n")

if __name__ == "__main__":
    main()
