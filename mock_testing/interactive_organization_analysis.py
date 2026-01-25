# mock_testing/interactive_organization_analysis.py

"""
INTERACTIVE ORGANIZATION RISK ANALYSIS
========================================

User provides parameters via terminal:
1. Number of patients to analyze
2. Which prediction window(s)
3. Number of top patients to display

Script sends data to REAL trained models and displays results.
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path

class InteractiveOrgAnalysis:
    """Interactive organization-level risk analysis"""
    
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
        print("INTERACTIVE ORGANIZATION RISK ANALYSIS")
        print("="*70)
        print("\nThis tool sends patient data to REAL trained ML models")
        print("and calculates risk tiers and ROI for interventions.\n")
    
    def get_user_inputs(self):
        """Prompt user for analysis parameters"""
        
        print("="*70)
        print("INPUT PARAMETERS NEEDED")
        print("="*70 + "\n")
        
        # Number of patients
        while True:
            try:
                num_patients = int(input("📊 How many patients to analyze? (1-3000, default=100): ") or "100")
                if 1 <= num_patients <= 3000:
                    break
                else:
                    print("   ❌ Please enter a number between 1 and 3000")
            except ValueError:
                print("   ❌ Please enter a valid number")
        
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
        
        # Top patients to display
        while True:
            try:
                display_count = int(input(f"\n🔝 Show top how many patients? (1-{num_patients}, default=20): ") or "20")
                if 1 <= display_count <= num_patients:
                    break
                else:
                    print(f"   ❌ Please enter a number between 1 and {num_patients}")
            except ValueError:
                print("   ❌ Please enter a valid number")
        
        print("\n")
        return num_patients, selected_windows, display_count
    
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
    
    def analyze_window(self, window, num_patients, display_count):
        """Analyze patients for specific window using REAL model"""
        
        print(f"\n{'='*70}")
        print(f"ANALYZING {window.replace('_', '-').upper()}")
        print(f"{'='*70}\n")
        
        # Sample patients
        sample_indices = np.random.choice(len(self.X_test), min(num_patients, len(self.X_test)), replace=False)
        X_sample = self.X_test.iloc[sample_indices].reset_index(drop=True)
        
        # Get predictions from REAL model
        print(f"📤 Sending {num_patients} patients to {self.models[window]['name']} model...")
        model = self.models[window]['model']
        risk_scores = model.predict_proba(X_sample)[:, 1]
        print(f"📥 Model returned {len(risk_scores)} risk predictions\n")
        
        # Stratify and calculate ROI
        results = []
        for idx, risk_score in enumerate(risk_scores):
            patient_id = self.X_test.index[sample_indices[idx]]
            base_cost = X_sample.iloc[idx]['total_annual_cost']
            tier = self.stratify_to_tier(risk_score)
            
            intervention_cost = self.intervention_costs[tier]
            reduction_rate = self.reduction_rates[tier]
            expected_savings = base_cost * reduction_rate
            
            roi = ((expected_savings - intervention_cost) / intervention_cost * 100) if intervention_cost > 0 else 0
            roi = min(max(roi, 5.0 if tier == 1 else 15.0), 99.0)
            
            results.append({
                'patient_id': patient_id,
                'risk_score': risk_score,
                'tier': tier,
                'tier_label': self.tier_labels[tier],
                'base_cost': base_cost,
                'intervention_cost': intervention_cost,
                'expected_savings': expected_savings,
                'roi_percentage': roi
            })
        
        results_df = pd.DataFrame(results)
        
        # Display top patients
        print(f"TOP {display_count} PATIENTS (HIGHEST RISK):")
        print("-"*70)
        print(f"{'Patient ID':<12} {'Risk Score':<12} {'Tier':<4} {'Risk Level':<12} {'Cost':<12} {'ROI':<10}")
        print("-"*70)
        
        top_patients = results_df.nlargest(display_count, 'risk_score')
        for _, row in top_patients.iterrows():
            print(f"{int(row['patient_id']):<12} {row['risk_score']:<12.4f} {row['tier']:<4} "
                  f"{row['tier_label']:<12} ${row['base_cost']:>10,.0f} {row['roi_percentage']:>7.2f}%")
        
        # Statistics
        print(f"\nSTATISTICS (All {num_patients} patients):")
        print("-"*70)
        
        for tier in [1, 2, 3, 4, 5]:
            tier_data = results_df[results_df['tier'] == tier]
            if len(tier_data) > 0:
                avg_risk = tier_data['risk_score'].mean()
                avg_roi = tier_data['roi_percentage'].mean()
                print(f"  {self.tier_labels[tier]:<12}: {len(tier_data):>3} patients | "
                      f"Avg Risk: {avg_risk:.4f} | Avg ROI: {avg_roi:>6.2f}%")
        
        # Program metrics
        print(f"\nPROGRAM-LEVEL METRICS:")
        print("-"*70)
        total_cost = results_df['intervention_cost'].sum()
        total_savings = results_df['expected_savings'].sum()
        net_benefit = total_savings - total_cost
        avg_roi = (total_savings / total_cost * 100 - 100) if total_cost > 0 else 0
        
        print(f"  Average ROI: {avg_roi:.2f}%")
        print(f"  Total Intervention Cost: ${total_cost:,.2f}")
        print(f"  Total Expected Savings: ${total_savings:,.2f}")
        print(f"  Net Benefit: ${net_benefit:,.2f}")
        
        return results_df
    
    def run(self):
        """Execute interactive analysis"""
        
        self.display_header()
        num_patients, selected_windows, display_count = self.get_user_inputs()
        
        self.load_models_and_data()
        
        print(f"🔄 Analyzing {num_patients} patients for {len(selected_windows)} window(s)...\n")
        
        all_results = {}
        for window in selected_windows:
            results_df = self.analyze_window(window, num_patients, display_count)
            all_results[window] = results_df
        
        # Save results
        print(f"\n{'='*70}")
        print("SAVING RESULTS")
        print(f"{'='*70}\n")
        
        for window, results_df in all_results.items():
            filename = f'data/output/interactive_analysis/{num_patients}_patients_{window}.csv'
            results_df.to_csv(filename, index=False)
            print(f"  ✅ Saved: {num_patients}_patients_{window}.csv")
        
        print(f"\n{'='*70}")
        print("✅ ANALYSIS COMPLETE!")
        print(f"{'='*70}\n")
        
        print("📁 Results saved to: data/output/interactive_analysis/")
        print("\nYou can now open the CSV files to view detailed results.\n")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    analysis = InteractiveOrgAnalysis()
    analysis.run()
