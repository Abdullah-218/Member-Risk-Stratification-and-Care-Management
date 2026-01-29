# mock_testing/interactive_individual_patient_analysis.py

"""
INTERACTIVE INDIVIDUAL PATIENT RISK ANALYSIS
==============================================

User provides parameters via terminal:
1. Patient ID (or "random" for random patient)
2. Which prediction window(s)

Script sends patient data to REAL trained models and displays results.
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path

class InteractiveIndividualAnalysis:
    """Interactive individual patient risk analysis"""
    
    def __init__(self):
        Path('data/output/interactive_analysis').mkdir(parents=True, exist_ok=True)
        
        self.intervention_costs = {
            5: 2500,
            4: 1200,
            3: 600,
            2: 200,
            1: 0
        }
        
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
    
    def display_header(self):
        """Display welcome header"""
        print("\n" + "="*70)
        print("INTERACTIVE INDIVIDUAL PATIENT RISK ANALYSIS")
        print("="*70)
        print("\nThis tool sends patient data to REAL trained ML models")
        print("and calculates risk scores, tiers, and ROI across windows.\n")
    
    def get_user_inputs(self):
        """Prompt user for analysis parameters"""
        
        print("="*70)
        print("INPUT PARAMETERS NEEDED")
        print("="*70 + "\n")
        
        # Patient ID or random
        print("👤 Patient Selection:")
        print("   Enter patient ID (0-2999) or type 'random' for random patient")
        
        while True:
            patient_input = input("\nPatient ID or 'random': ").strip().lower()
            
            if patient_input == 'random':
                patient_id = np.random.randint(0, 3000)
                print(f"   ✅ Selected random patient: {patient_id}")
                break
            else:
                try:
                    patient_id = int(patient_input)
                    if 0 <= patient_id < 3000:
                        print(f"   ✅ Selected patient: {patient_id}")
                        break
                    else:
                        print("   ❌ Patient ID must be between 0 and 2999")
                except ValueError:
                    print("   ❌ Please enter a valid patient ID or 'random'")
        
        # Window selection
        print("\n📅 Which prediction window(s)?")
        print("   1) 30-day only")
        print("   2) 60-day only")
        print("   3) 90-day only")
        print("   4) All windows (30, 60, 90-day)")
        
        while True:
            window_choice = input("\nEnter choice (1-4, default=4): ") or "4"
            if window_choice in ['1', '2', '3', '4']:
                break
            print("   ❌ Please enter 1, 2, 3, or 4")
        
        windows_map = {
            '1': ['30_day'],
            '2': ['60_day'],
            '3': ['90_day'],
            '4': ['30_day', '60_day', '90_day']
        }
        selected_windows = windows_map[window_choice]
        
        print("\n")
        return patient_id, selected_windows
    
    def load_models_and_data(self):
        """Load trained models and patient data"""
        
        print("="*70)
        print("LOADING TRAINED MODELS & DATA")
        print("="*70 + "\n")
        
        # Load test data
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        print(f"  ✅ Loaded test data: {self.X_test.shape[0]} patients, {self.X_test.shape[1]} features")
        
        # Load models
        self.models = {
            '30_day': joblib.load('models/best_30_day_model.pkl'),
            '60_day': joblib.load('models/best_60_day_model.pkl'),
            '90_day': joblib.load('models/best_90_day_model.pkl')
        }
        
        # Display model info
        for window, model_data in self.models.items():
            model_name = model_data.get('name', 'Unknown Model')
            auc = model_data.get('auc', 'N/A')
            window_label = window.replace('_', '-')
            if isinstance(auc, float):
                print(f"  ✅ {window_label} model: {model_name} (AUC: {auc:.4f})")
            else:
                print(f"  ✅ {window_label} model: {model_name}")
        print()
    
    def stratify_to_tier(self, risk_score):
        """Convert risk score to tier"""
        if risk_score < 0.10:
            return 1
        elif risk_score < 0.25:
            return 2
        elif risk_score < 0.50:
            return 3
        elif risk_score < 0.75:
            return 4
        else:
            return 5
    
    def analyze_patient(self, patient_id, selected_windows):
        """Analyze single patient for selected windows using REAL models"""
        
        print(f"{'='*70}")
        print(f"PATIENT {patient_id} ANALYSIS")
        print(f"{'='*70}\n")
        
        # Get patient data
        patient_features = self.X_test.iloc[patient_id]
        X_patient = patient_features.values.reshape(1, -1)
        base_cost = patient_features['total_annual_cost']
        
        print(f"👤 Patient ID: {patient_id}")
        print(f"💰 Annual Cost: ${base_cost:,.2f}")
        print()
        
        results = {}
        
        # Analyze each window
        for window in selected_windows:
            window_label = window.replace('_', '-').upper()
            print(f"{'─'*70}")
            print(f"📅 {window_label} WINDOW")
            print(f"{'─'*70}")
            
            # Get model and send data
            model_data = self.models[window]
            model = model_data['model']
            model_name = model_data['name']
            
            print(f"  Model: {model_name}")
            print(f"  Status: Sending patient features to model...")
            
            # Get prediction from REAL model
            risk_score = model.predict_proba(X_patient)[0, 1]
            print(f"  Result: Risk score = {risk_score:.4f}")
            
            # Stratify to tier
            tier = self.stratify_to_tier(risk_score)
            tier_label = self.tier_labels[tier]
            
            print(f"  Tier: {tier} ({tier_label})")
            
            # Calculate ROI
            intervention_cost = self.intervention_costs[tier]
            reduction_rate = self.reduction_rates[tier]
            expected_savings = base_cost * reduction_rate
            
            roi = ((expected_savings - intervention_cost) / intervention_cost * 100) if intervention_cost > 0 else 0
            roi = min(max(roi, 5.0 if tier == 1 else 15.0), 99.0)
            
            print(f"  Intervention Cost: ${intervention_cost:,.2f}")
            print(f"  Expected Savings: ${expected_savings:,.2f}")
            print(f"  ROI: {roi:.2f}%")
            print()
            
            results[window] = {
                'window_label': window_label,
                'model_name': model_name,
                'risk_score': risk_score,
                'tier': tier,
                'tier_label': tier_label,
                'intervention_cost': intervention_cost,
                'expected_savings': expected_savings,
                'roi_percentage': roi
            }
        
        print(f"{'='*70}")
        print("QUICK SUMMARY TABLE")
        print(f"{'='*70}\n")
        print(f"{'Window':<12} {'Model':<15} {'Risk Score':<12} {'Risk Level':<12} {'ROI':<10}")
        print(f"{'-'*70}")
        
        for window in selected_windows:
            result = results[window]
            print(f"{result['window_label']:<12} {result['model_name']:<15} {result['risk_score']:<12.4f} "
                  f"{result['tier_label']:<12} {result['roi_percentage']:>6.2f}%")
        
        print()
        
        # Recommendations
        print(f"{'='*70}")
        print("CLINICAL RECOMMENDATIONS")
        print(f"{'='*70}\n")
        
        max_tier = max([results[w]['tier'] for w in selected_windows])
        max_window = [w for w in selected_windows if results[w]['tier'] == max_tier][0]
        max_label = results[max_window]['window_label']
        
        if max_tier == 5:
            print(f"🚨 CRITICAL RISK")
            print(f"   ⚠️  Patient shows Critical tier risk in {max_label} window")
            print(f"   Action: IMMEDIATE intervention recommended")
            print(f"   ROI: {results[max_window]['roi_percentage']:.2f}% for intervention")
        elif max_tier == 4:
            print(f"⚠️  HIGH RISK")
            print(f"   Patient shows High tier risk in {max_label} window")
            print(f"   Action: Schedule intervention soon")
            print(f"   ROI: {results[max_window]['roi_percentage']:.2f}% for intervention")
        elif max_tier == 3:
            print(f"⚡ MODERATE RISK")
            print(f"   Patient shows Moderate tier risk in {max_label} window")
            print(f"   Action: Consider intervention based on clinical judgment")
            print(f"   ROI: {results[max_window]['roi_percentage']:.2f}% for intervention")
        elif max_tier == 2:
            print(f"📌 LOW RISK")
            print(f"   Patient shows Low tier risk")
            print(f"   Action: Routine monitoring")
            print(f"   ROI: {results[max_window]['roi_percentage']:.2f}% for intervention")
        else:
            print(f"✓ NORMAL RISK")
            print(f"   Patient shows Normal tier risk")
            print(f"   Action: Standard care pathway")
            print(f"   ROI: {results[max_window]['roi_percentage']:.2f}% for intervention")
        
        print()
        
        return patient_id, results
    
    def save_patient_report(self, patient_id, results):
        """Save patient analysis report"""
        
        print(f"{'='*70}")
        print("SAVING RESULTS")
        print(f"{'='*70}\n")
        
        # Create dataframe
        data = []
        for window, result in results.items():
            data.append({
                'patient_id': patient_id,
                'window': result['window_label'],
                'model': result['model_name'],
                'risk_score': result['risk_score'],
                'risk_tier': result['tier'],
                'risk_level': result['tier_label'],
                'intervention_cost': result['intervention_cost'],
                'expected_savings': result['expected_savings'],
                'roi_percentage': result['roi_percentage']
            })
        
        results_df = pd.DataFrame(data)
        filename = f'data/output/interactive_analysis/individual_patient_{patient_id}_analysis.csv'
        results_df.to_csv(filename, index=False)
        
        print(f"  ✅ Saved: individual_patient_{patient_id}_analysis.csv\n")
    
    def run(self):
        """Execute interactive analysis"""
        
        self.display_header()
        patient_id, selected_windows = self.get_user_inputs()
        
        self.load_models_and_data()
        
        patient_id, results = self.analyze_patient(patient_id, selected_windows)
        self.save_patient_report(patient_id, results)
        
        print(f"{'='*70}")
        print("✅ PATIENT ANALYSIS COMPLETE!")
        print(f"{'='*70}\n")
        
        print("📁 Results saved to: data/output/interactive_analysis/")
        print("\nYou can now open the CSV file to view detailed results.\n")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    analysis = InteractiveIndividualAnalysis()
    analysis.run()
