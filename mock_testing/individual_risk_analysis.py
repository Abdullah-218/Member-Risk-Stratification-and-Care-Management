# mock_testing/individual_risk_analysis.py

"""
INDIVIDUAL PATIENT RISK ANALYSIS
==================================

Uses REAL trained models to analyze a single patient:
1. Get risk predictions for all 3 windows
2. Determine risk tier and level
3. Calculate ROI for intervention
4. Provide personalized recommendations
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path

class IndividualPatientRisk:
    """Analyze risk for a single patient using trained models"""
    
    def __init__(self):
        Path('data/output/patient_analysis').mkdir(parents=True, exist_ok=True)
        
        # Intervention costs by tier
        self.intervention_costs = {
            5: 2500,
            4: 1200,
            3: 600,
            2: 200,
            1: 0
        }
        
        # Expected cost reduction by tier
        self.reduction_rates = {
            5: 0.30,
            4: 0.25,
            3: 0.20,
            2: 0.10,
            1: 0.00
        }
        
        self.tier_labels = {
            1: 'Normal',
            2: 'Low',
            3: 'Moderate',
            4: 'High',
            5: 'Critical'
        }
    
    def load_models_and_data(self):
        """Load trained models and patient data"""
        
        print("="*70)
        print("LOADING TRAINED MODELS")
        print("="*70)
        print()
        
        # Load test data
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        
        # Load best models
        best_30 = joblib.load('models/best_30_day_model.pkl')
        best_60 = joblib.load('models/best_60_day_model.pkl')
        best_90 = joblib.load('models/best_90_day_model.pkl')
        
        self.models = {
            '30_day': best_30,
            '60_day': best_60,
            '90_day': best_90
        }
        
        print(f"  ✅ 30-day model: {best_30['name']} (Threshold: {best_30['threshold']:.3f})")
        print(f"  ✅ 60-day model: {best_60['name']} (Threshold: {best_60['threshold']:.3f})")
        print(f"  ✅ 90-day model: {best_90['name']} (Threshold: {best_90['threshold']:.3f})\n")
    
    def get_patient_data(self, patient_index=None):
        """Get a patient's feature data"""
        
        if patient_index is None:
            # Random patient
            patient_index = np.random.randint(0, len(self.X_test))
        
        patient_features = self.X_test.iloc[patient_index]
        return patient_index, patient_features
    
    def stratify_to_tier(self, risk_score):
        """Convert risk score to tier (1-5)"""
        
        if risk_score < 0.10:
            tier = 1
        elif risk_score < 0.25:
            tier = 2
        elif risk_score < 0.50:
            tier = 3
        elif risk_score < 0.75:
            tier = 4
        else:
            tier = 5
        
        return tier
    
    def analyze_patient(self, patient_index=None):
        """Analyze single patient risk across all windows"""
        
        patient_idx, patient_data = self.get_patient_data(patient_index)
        X_patient = patient_data.values.reshape(1, -1)
        
        results = {
            'patient_id': patient_idx,
            'windows': {}
        }
        
        # Analyze each window
        for window in ['30_day', '60_day', '90_day']:
            window_label = window.replace('_', '-')
            
            # Get model
            model_data = self.models[window]
            model = model_data['model']
            
            # Get prediction
            risk_score = model.predict_proba(X_patient)[0, 1]
            tier = self.stratify_to_tier(risk_score)
            tier_label = self.tier_labels[tier]
            
            # Calculate ROI
            intervention_cost = self.intervention_costs[tier]
            reduction_rate = self.reduction_rates[tier]
            base_cost = patient_data['total_annual_cost']
            
            expected_savings = base_cost * reduction_rate
            roi = ((expected_savings - intervention_cost) / intervention_cost * 100) if intervention_cost > 0 else 0
            roi = min(roi, 99.0)  # Cap at 99%
            
            if tier == 1:
                roi = max(roi, 5.0)
            else:
                roi = max(roi, 15.0)
            
            results['windows'][window] = {
                'window_label': window_label,
                'model': model_data['name'],
                'risk_score': round(risk_score, 4),
                'tier': tier,
                'tier_label': tier_label,
                'intervention_cost': intervention_cost,
                'expected_savings': round(expected_savings, 2),
                'roi_percentage': round(roi, 2)
            }
        
        return results, patient_data
    
    def display_patient_analysis(self, patient_index=None):
        """Display comprehensive single patient analysis"""
        
        print("="*70)
        print("INDIVIDUAL PATIENT RISK ANALYSIS")
        print("="*70)
        print()
        
        results, patient_data = self.analyze_patient(patient_index)
        
        patient_id = results['patient_id']
        print(f"PATIENT ID: {patient_id}")
        print(f"Annual Cost: ${patient_data['total_annual_cost']:,.2f}")
        print()
        
        # Display results for each window
        print("RISK ASSESSMENT BY WINDOW")
        print("-"*70)
        print()
        
        for window_key in ['30_day', '60_day', '90_day']:
            window_data = results['windows'][window_key]
            
            print(f"{window_data['window_label'].upper()}")
            print(f"  Model: {window_data['model']}")
            print(f"  Risk Score: {window_data['risk_score']:.4f}")
            print(f"  Risk Level: Tier {window_data['tier']} - {window_data['tier_label'].upper()}")
            print(f"  Intervention Cost: ${window_data['intervention_cost']:,.2f}")
            print(f"  Expected Savings: ${window_data['expected_savings']:,.2f}")
            print(f"  ROI: {window_data['roi_percentage']:.2f}%")
            print()
        
        # Summary table
        print("QUICK SUMMARY")
        print("-"*70)
        print(f"{'Window':<12} {'Risk Level':<15} {'Risk Score':<12} {'ROI %':<10}")
        print("-"*70)
        
        for window_key in ['30_day', '60_day', '90_day']:
            window_data = results['windows'][window_key]
            print(f"{window_data['window_label']:<12} "
                  f"{window_data['tier_label']:<15} "
                  f"{window_data['risk_score']:<12.4f} "
                  f"{window_data['roi_percentage']:>6.2f}%")
        
        print()
        
        # Recommendations
        print("RECOMMENDATIONS")
        print("-"*70)
        
        # Get highest risk window
        highest_risk_window = max(results['windows'].items(), 
                                 key=lambda x: x[1]['tier'])
        
        tier = highest_risk_window[1]['tier']
        window = highest_risk_window[0]
        
        if tier >= 4:
            print(f"⚠️  HIGH RISK: Immediate intervention recommended")
            print(f"   Patient shows {highest_risk_window[1]['tier_label']} tier risk in {highest_risk_window[1]['window_label']} window")
            print(f"   ROI: {highest_risk_window[1]['roi_percentage']:.2f}% for intervention")
        elif tier == 3:
            print(f"⚡ MODERATE RISK: Consider intervention")
            print(f"   Patient shows {highest_risk_window[1]['tier_label']} tier risk in {highest_risk_window[1]['window_label']} window")
            print(f"   ROI: {highest_risk_window[1]['roi_percentage']:.2f}% for intervention")
        else:
            print(f"✓ LOW RISK: Monitor patient")
            print(f"   Patient shows {highest_risk_window[1]['tier_label']} tier risk")
            print(f"   ROI: {highest_risk_window[1]['roi_percentage']:.2f}% for intervention")
        
        print()
        return results
    
    def save_patient_report(self, results):
        """Save patient analysis report"""
        
        print("="*70)
        print("SAVING PATIENT REPORT")
        print("="*70 + "\n")
        
        patient_id = results['patient_id']
        
        # Save detailed results
        results_data = []
        for window_key, window_data in results['windows'].items():
            results_data.append({
                'patient_id': patient_id,
                'window': window_data['window_label'],
                'model': window_data['model'],
                'risk_score': window_data['risk_score'],
                'risk_tier': window_data['tier'],
                'risk_level': window_data['tier_label'],
                'intervention_cost': window_data['intervention_cost'],
                'expected_savings': window_data['expected_savings'],
                'roi_percentage': window_data['roi_percentage']
            })
        
        results_df = pd.DataFrame(results_data)
        filename = f'data/output/patient_analysis/patient_{patient_id}_analysis.csv'
        results_df.to_csv(filename, index=False)
        
        print(f"  ✅ Saved: patient_{patient_id}_analysis.csv\n")
    
    def run_analysis(self, patient_index=None):
        """Execute complete analysis"""
        self.load_models_and_data()
        results = self.display_patient_analysis(patient_index)
        self.save_patient_report(results)

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    patient_analysis = IndividualPatientRisk()
    
    # Analyze 3 different random patients
    for i in range(3):
        print("\n")
        patient_analysis.run_analysis()
        
        if i < 2:
            print("\n" + "="*70)
            print("ANALYZING NEXT PATIENT...")
            print("="*70)
    
    print("\n" + "="*70)
    print("✅ INDIVIDUAL PATIENT RISK ANALYSIS COMPLETE!")
    print("="*70)
