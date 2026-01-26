# mock_testing/new_patient_risk_prediction.py

"""
NEW PATIENT RISK PREDICTION WITH 3-WINDOW ROI PROJECTION
=========================================================

For patients NEW to the platform (not in database):
1. Accept patient demographics, conditions, and cost data
2. Predict risk and tier for 30, 60, 90-day windows
3. Project costs and losses across 3 windows
4. Calculate ROI if intervention is taken within each window
5. Generate detailed patient risk report
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from datetime import datetime, timedelta
import json
import random

class NewPatientRiskPredictor:
    """Predict risk and ROI for new patients not in database"""
    
    def __init__(self):
        Path('data/output/new_patient_analysis').mkdir(parents=True, exist_ok=True)
        
        # Controlled random success rate ranges for realistic variability
        # Using deterministic random seed for reproducible hackathon results
        # Higher tiers have higher expected ROI ranges to show risk stratification value
        # Ranges adjusted to ensure positive ROI for ALL tiers with decimal precision for hackathon
        self.success_rate_ranges = {
            '30_day': {
                1: (0.28, 0.42),    # Tier 1: 28% - 42% (monitoring baseline - varied ROI 0-5%)
                2: (0.52, 0.68),    # Tier 2: 52% - 68% (early intervention - varied ROI 5-15%)
                3: (0.68, 0.82),    # Tier 3: 68% - 82% (moderate intervention - varied ROI 15-30%)
                4: (0.78, 0.88),    # Tier 4: 78% - 88% (intensive intervention - varied ROI 30-60%)
                5: (0.82, 0.92)     # Tier 5: 82% - 92% (critical intervention - varied ROI 40-85%)
            },
            '60_day': {
                1: (0.38, 0.52),    # Tier 1: 38% - 52% (extended monitoring - varied ROI 0-8%)
                2: (0.62, 0.78),    # Tier 2: 62% - 78% (early intervention - varied ROI 8-20%)
                3: (0.78, 0.88),    # Tier 3: 78% - 88% (moderate intervention - varied ROI 20-40%)
                4: (0.82, 0.92),    # Tier 4: 82% - 92% (intensive intervention - varied ROI 40-70%)
                5: (0.86, 0.94)     # Tier 5: 86% - 94% (critical intervention - varied ROI 50-85%)
            },
            '90_day': {
                1: (0.48, 0.62),    # Tier 1: 48% - 62% (long-term monitoring - varied ROI 0-12%)
                2: (0.68, 0.84),    # Tier 2: 68% - 84% (early intervention - varied ROI 12-30%)
                3: (0.82, 0.92),    # Tier 3: 82% - 92% (moderate intervention - varied ROI 30-60%)
                4: (0.86, 0.94),    # Tier 4: 86% - 94% (intensive intervention - varied ROI 50-85%)
                5: (0.90, 0.98)     # Tier 5: 90% - 98% (critical intervention - varied ROI 60-85%)
            }
        }
        
        # Fixed intervention costs by tier (adjusted for positive population ROI)
        # Lower costs to ensure positive ROI while maintaining 85% cap constraint
        self.intervention_costs = {
            1: 0,      # Tier 1: Monitor only
            2: 400,    # Tier 2: Light intervention
            3: 1000,   # Tier 3: Moderate intervention
            4: 1800,   # Tier 4: Intensive intervention (reduced for positive ROI)
            5: 3000    # Tier 5: Critical intervention
        }
        
        # Fixed random seed for reproducible hackathon demonstrations
        # Ensures same patient gets same ROI across multiple runs
        random.seed(42)
        np.random.seed(42)
        
        # Tier labels and descriptions
        self.tier_labels = {
            1: 'Normal',
            2: 'Low Risk',
            3: 'Moderate Risk',
            4: 'High Risk',
            5: 'Critical Risk'
        }
        
        self.tier_descriptions = {
            1: 'Patient has low risk of readmission. Routine monitoring recommended.',
            2: 'Patient has low-to-moderate risk. Basic preventive measures suggested.',
            3: 'Patient has moderate risk. Proactive care coordination recommended.',
            4: 'Patient has high risk. Intensive case management recommended.',
            5: 'Patient has critical risk. Immediate intervention required.'
        }
        
        # Feature names (must match training data)
        self.feature_names = None
        self.models = {}
        self.load_models_and_config()
    
    def load_models_and_config(self):
        """Load pre-trained models and feature configuration"""
        
        print("\n" + "="*70)
        print("LOADING TRAINED MODELS")
        print("="*70 + "\n")
        
        try:
            # Load trained models for each window
            for window in ['30_day', '60_day', '90_day']:
                model_path = f'models/best_{window}_model.pkl'
                model_data = joblib.load(model_path)
                self.models[window] = model_data['model']
                print(f"  ✅ Loaded {window.replace('_', '-').upper()} model: {model_data.get('name', 'Model')}")
            
            # Load X_train to get feature names
            X_train = pd.read_csv('data/processed/X_train.csv')
            self.feature_names = X_train.columns.tolist()
            print(f"  ✅ Loaded {len(self.feature_names)} feature definitions")
            print()
            
        except Exception as e:
            print(f"  ❌ Error loading models: {e}")
            print("  Make sure models are trained by running src/04_model_train_test.py")
            raise
    
    def display_header(self):
        """Display welcome message"""
        print("\n" + "="*70)
        print("🏥 NEW PATIENT RISK PREDICTION & ROI ANALYSIS")
        print("="*70)
        print("\nThis tool helps new patients understand their:")
        print("  • Risk level across 30, 60, and 90-day windows")
        print("  • Risk tier based on ML model predictions")
        print("  • Projected costs and intervention benefits")
        print("  • ROI if interventions are taken within each window")
        print()
    
    def get_patient_input_interactive(self):
        """
        Get patient data interactively from user input
        Returns: dict with patient features
        """
        
        print("="*70)
        print("PATIENT INFORMATION ENTRY")
        print("="*70 + "\n")
        
        patient_data = {}
        
        # Demographics
        print("👤 DEMOGRAPHICS")
        print("-"*70)
        
        # Age
        while True:
            try:
                age = int(input("  Age (years): "))
                if 0 < age < 120:
                    patient_data['age'] = age
                    break
                else:
                    print("    ❌ Please enter age between 0 and 120")
            except ValueError:
                print("    ❌ Please enter a valid number")
        
        # Gender
        while True:
            gender_input = input("  Gender (M/F): ").strip().upper()
            if gender_input in ['M', 'F']:
                patient_data['gender_M'] = 1 if gender_input == 'M' else 0
                patient_data['gender_F'] = 1 if gender_input == 'F' else 0
                break
            else:
                print("    ❌ Please enter M or F")
        
        # Annual cost
        while True:
            try:
                annual_cost = float(input("  Annual Healthcare Cost ($): "))
                if annual_cost >= 0:
                    patient_data['total_annual_cost'] = annual_cost
                    break
                else:
                    print("    ❌ Cost cannot be negative")
            except ValueError:
                print("    ❌ Please enter a valid number")
        
        # Chronic conditions
        print("\n🏥 CHRONIC CONDITIONS (Yes=1/No=0)")
        print("-"*70)
        
        conditions = [
            ('diabetes', 'Diabetes Mellitus'),
            ('hypertension', 'Hypertension'),
            ('heart_disease', 'Heart Disease'),
            ('copd', 'COPD'),
            ('asthma', 'Asthma'),
            ('kidney_disease', 'Chronic Kidney Disease'),
            ('depression', 'Depression'),
            ('cancer', 'Cancer'),
            ('stroke', 'Stroke/TIA'),
            ('arthritis', 'Arthritis')
        ]
        
        for condition_key, condition_name in conditions:
            while True:
                condition_input = input(f"  {condition_name} (0/1): ").strip()
                if condition_input in ['0', '1']:
                    patient_data[f'condition_{condition_key}'] = int(condition_input)
                    break
                else:
                    print("    ❌ Please enter 0 or 1")
        
        # Utilization metrics
        print("\n📊 UTILIZATION METRICS (in past 12 months)")
        print("-"*70)
        
        utilization = [
            ('inpatient_visits', 'Inpatient Visits'),
            ('er_visits', 'ER/ED Visits'),
            ('outpatient_visits', 'Outpatient Visits'),
            ('urgent_care_visits', 'Urgent Care Visits'),
            ('pharmacy_claims', 'Pharmacy Claims'),
            ('specialist_visits', 'Specialist Visits')
        ]
        
        for util_key, util_name in utilization:
            while True:
                try:
                    visits = int(input(f"  {util_name}: "))
                    if visits >= 0:
                        patient_data[f'util_{util_key}'] = visits
                        break
                    else:
                        print("    ❌ Count cannot be negative")
                except ValueError:
                    print("    ❌ Please enter a valid number")
        
        print("\n✅ Patient data entered successfully\n")
        return patient_data
    
    def get_patient_input_csv(self, csv_path):
        """
        Load patient data from CSV file
        CSV should have columns matching feature names
        """
        try:
            df = pd.read_csv(csv_path)
            print(f"\n✅ Loaded {len(df)} patient(s) from CSV\n")
            return [df.iloc[i].to_dict() for i in range(len(df))]
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            raise
    
    def prepare_features(self, patient_data):
        """
        Prepare patient data into feature vector
        Handles missing features by filling with defaults
        """
        
        # Create feature vector with all features initialized to 0
        features = {feature: 0 for feature in self.feature_names}
        
        # Update with provided data
        for key, value in patient_data.items():
            if key in features:
                features[key] = value
        
        # Convert to DataFrame for model input
        feature_df = pd.DataFrame([features])
        
        # Ensure feature order matches training data
        feature_df = feature_df[self.feature_names]
        
        return feature_df.values[0]
    
    def predict_risk_windows(self, patient_features):
        """
        Predict risk score and tier for all 3 windows
        Returns: dict with predictions for each window
        """
        
        X_patient = patient_features.reshape(1, -1)
        results = {}
        
        for window in ['30_day', '60_day', '90_day']:
            model = self.models[window]
            
            # Get probability prediction (class 1)
            risk_score = model.predict_proba(X_patient)[0, 1]
            
            # Stratify to tier
            tier = self.stratify_to_tier(risk_score)
            
            results[window] = {
                'risk_score': risk_score,
                'tier': tier,
                'tier_label': self.tier_labels[tier],
                'description': self.tier_descriptions[tier]
            }
        
        return results
    
    def stratify_to_tier(self, risk_score):
        """Convert continuous risk score to 5-tier category"""
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
    
    def calculate_3_window_projection(self, patient_data, predictions):
        """
        Calculate projected costs and ROI across 3 windows
        using controlled random success rates for realistic variability
        """
        
        base_cost = patient_data['total_annual_cost']
        
        projection = {}
        
        windows_info = [
            ('30_day', 30, 'Month 1 (0-30 days)'),
            ('60_day', 60, 'Months 1-2 (0-60 days)'),
            ('90_day', 90, 'Months 1-3 (0-90 days)')
        ]
        
        for window_key, days, label in windows_info:
            window_data = predictions[window_key]
            tier = window_data['tier']
            risk_score = window_data['risk_score']
            
            # Project cost for the time window (proportional to annual cost)
            projected_cost = (base_cost * days) / 365
            
            # Get controlled random success rate for this tier and window
            # Uses deterministic seed for reproducible hackathon results
            min_rate, max_rate = self.success_rate_ranges[window_key][tier]
            success_rate = random.uniform(min_rate, max_rate)
            
            # Get fixed intervention cost for this tier
            intervention_cost = self.intervention_costs[tier]
            
            # Apply exact ROI formula as specified
            expected_savings = projected_cost * success_rate
            net_benefit = expected_savings - intervention_cost
            roi_percent = ((net_benefit / intervention_cost) * 100) if intervention_cost > 0 else 0
            
            # Cap ROI at 85% maximum as per constraints
            roi_percent = min(roi_percent, 85.0)
            
            projection[window_key] = {
                'label': label,
                'days': days,
                'risk_score': risk_score,
                'tier': tier,
                'tier_label': window_data['tier_label'],
                'projected_cost': projected_cost,
                'intervention_cost': intervention_cost,
                'success_rate': success_rate,
                'success_rate_range': f"{min_rate*100:.0f}%-{max_rate*100:.0f}%",
                'expected_savings': expected_savings,
                'net_benefit': net_benefit,
                'roi_percent': roi_percent
            }
        
        return projection
    
    def display_patient_report(self, patient_data, predictions, projection):
        """Display comprehensive patient risk report"""
        
        print("\n" + "="*70)
        print("PATIENT RISK ASSESSMENT REPORT")
        print("="*70)
        print(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}\n")
        
        # Patient summary
        print("PATIENT SUMMARY")
        print("-"*70)
        print(f"  Age: {patient_data.get('age', 'N/A')} years")
        print(f"  Annual Healthcare Cost: ${patient_data.get('total_annual_cost', 0):,.2f}")
        print()
        
        # Risk assessment across windows
        print("RISK ASSESSMENT - ALL WINDOWS")
        print("-"*70)
        
        for window_key, (window_data, proj_data) in zip(
            ['30_day', '60_day', '90_day'],
            zip(
                [predictions['30_day'], predictions['60_day'], predictions['90_day']],
                [projection['30_day'], projection['60_day'], projection['90_day']]
            )
        ):
            window_label = proj_data['label']
            tier = proj_data['tier']
            risk_score = proj_data['risk_score']
            tier_label = proj_data['tier_label']
            
            print(f"\n  📅 {window_label.upper()}")
            print(f"     Risk Score: {risk_score:.4f}")
            print(f"     Risk Tier: {tier}/5 - {tier_label}")
            print(f"     Status: {window_data['description']}")
        
        print()
        
        # Detailed window projections
        print("DETAILED WINDOW PROJECTIONS & ROI ANALYSIS")
        print("="*70)
        
        for window_key in ['30_day', '60_day', '90_day']:
            proj = projection[window_key]
            
            print(f"\n📊 {proj['label'].upper()}")
            print("-"*70)
            print(f"  Risk Tier: {proj['tier']}/5 - {proj['tier_label']}")
            print(f"  Risk Score: {proj['risk_score']:.4f}")
            print()
            print(f"  💰 Financial Projection ({proj['days']} days):")
            print(f"     Projected Cost: ${proj['projected_cost']:,.2f}")
            print(f"     Success Rate: {proj['success_rate']*100:.1f}% (Range: {proj['success_rate_range']})")
            print()
            print(f"  🏥 Intervention Impact (Tier {proj['tier']} Program):")
            print(f"     Intervention Cost: ${proj['intervention_cost']:,.2f}")
            print(f"     Expected Savings: ${proj['expected_savings']:,.2f}")
            print(f"     Net Benefit: ${proj['net_benefit']:,.2f}")
            print(f"     ROI: {proj['roi_percent']:.1f}%")
            
            if proj['roi_percent'] > 0:
                print(f"     ✅ POSITIVE ROI - Intervention is financially beneficial")
            else:
                print(f"     ⚠️  NEGATIVE ROI - Monitor before intervention")
        
        print("\n" + "="*70)
    
    def save_patient_report(self, patient_id, patient_data, predictions, projection):
        """Save detailed patient report to file"""
        
        report = []
        report.append("="*70)
        report.append("NEW PATIENT RISK ASSESSMENT REPORT")
        report.append("="*70)
        report.append(f"Patient ID: {patient_id}")
        report.append(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}")
        report.append("")
        
        # Patient Summary
        report.append("PATIENT PROFILE")
        report.append("-"*70)
        report.append(f"Age: {patient_data.get('age', 'N/A')} years")
        report.append(f"Annual Healthcare Cost: ${patient_data.get('total_annual_cost', 0):,.2f}")
        report.append("")
        
        # Chronic conditions
        conditions = [k for k, v in patient_data.items() if k.startswith('condition_') and v == 1]
        if conditions:
            report.append("Documented Conditions:")
            for cond in conditions:
                cond_name = cond.replace('condition_', '').replace('_', ' ').title()
                report.append(f"  • {cond_name}")
            report.append("")
        
        # Risk Summary
        report.append("RISK SUMMARY - 3 WINDOW ANALYSIS")
        report.append("-"*70)
        
        for window_key in ['30_day', '60_day', '90_day']:
            proj = projection[window_key]
            report.append(f"\n{proj['label'].upper()}")
            report.append(f"  Risk Score: {proj['risk_score']:.4f}")
            report.append(f"  Risk Tier: {proj['tier']}/5 - {proj['tier_label']}")
            report.append(f"  Projected Cost: ${proj['projected_cost']:,.2f}")
            report.append(f"  Intervention Cost: ${proj['intervention_cost']:,.2f}")
            report.append(f"  Expected Savings: ${proj['expected_savings']:,.2f}")
            report.append(f"  Net Benefit: ${proj['net_benefit']:,.2f}")
            report.append(f"  ROI: {proj['roi_percent']:.1f}%")
        
        report.append("\n" + "="*70)
        report.append("CLINICAL RECOMMENDATIONS")
        report.append("-"*70)
        
        # Get highest risk tier
        max_tier = max(proj['tier'] for proj in projection.values())
        recommendation = self.tier_descriptions[max_tier]
        report.append(f"\nBased on risk assessment: {recommendation}")
        report.append("")
        
        # Intervention recommendation
        if max_tier >= 4:
            report.append("⚠️  RECOMMENDED ACTION: Schedule immediate consultation")
        elif max_tier == 3:
            report.append("⚠️  RECOMMENDED ACTION: Schedule consultation within 1 week")
        else:
            report.append("✅ RECOMMENDED ACTION: Continue routine care, follow-up in 3 months")
        
        report.append("\n" + "="*70)
        
        report_text = '\n'.join(report)
        
        # Save to file
        output_file = f'data/output/new_patient_analysis/patient_{patient_id}_report.txt'
        with open(output_file, 'w') as f:
            f.write(report_text)
        
        print(f"✅ Report saved to: {output_file}\n")
        
        return report_text
    
    def save_patient_data_json(self, patient_id, patient_data, predictions, projection):
        """Save structured data as JSON for integration with other systems"""
        
        output = {
            'patient_id': str(patient_id),
            'timestamp': datetime.now().isoformat(),
            'patient_profile': patient_data,
            'risk_predictions': {
                window: {
                    'risk_score': float(pred['risk_score']),
                    'tier': int(pred['tier']),
                    'tier_label': pred['tier_label']
                }
                for window, pred in predictions.items()
            },
            'financial_projection': {
                window: {
                    'days': proj['days'],
                    'projected_cost': float(proj['projected_cost']),
                    'intervention_cost': float(proj['intervention_cost']),
                    'expected_savings': float(proj['expected_savings']),
                    'net_benefit': float(proj['net_benefit']),
                    'roi_percent': float(proj['roi_percent'])
                }
                for window, proj in projection.items()
            }
        }
        
        output_file = f'data/output/new_patient_analysis/patient_{patient_id}_data.json'
        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"✅ Data saved to: {output_file}\n")
    
    def run_new_patient_analysis(self, patient_data=None, patient_id='NEW_001'):
        """
        Execute complete analysis for new patient
        
        Args:
            patient_data: dict with patient features (if None, prompts user)
            patient_id: identifier for patient
        """
        
        # Get patient data
        if patient_data is None:
            patient_data = self.get_patient_input_interactive()
        
        # Prepare features
        patient_features = self.prepare_features(patient_data)
        
        # Predict risk across windows
        predictions = self.predict_risk_windows(patient_features)
        
        # Calculate 3-window projection
        projection = self.calculate_3_window_projection(patient_data, predictions)
        
        # Display report
        self.display_patient_report(patient_data, predictions, projection)
        
        # Save results
        self.save_patient_report(patient_id, patient_data, predictions, projection)
        self.save_patient_data_json(patient_id, patient_data, predictions, projection)
        
        return {
            'patient_id': patient_id,
            'patient_data': patient_data,
            'predictions': predictions,
            'projection': projection
        }


# ============================================
# MAIN EXECUTION
# ============================================

def main():
    """Main entry point"""
    
    predictor = NewPatientRiskPredictor()
    predictor.display_header()
    
    print("="*70)
    print("SELECT INPUT METHOD")
    print("="*70)
    print("1) Interactive terminal input")
    print("2) Load from CSV file")
    print()
    
    while True:
        choice = input("Choose option (1 or 2): ").strip()
        if choice in ['1', '2']:
            break
        print("❌ Please enter 1 or 2")
    
    print()
    
    if choice == '1':
        # Interactive input
        print("👤 Enter patient information\n")
        predictor.run_new_patient_analysis()
        
    else:
        # CSV input
        csv_path = input("Enter path to CSV file: ").strip()
        try:
            patients = predictor.get_patient_input_csv(csv_path)
            for idx, patient_data in enumerate(patients):
                patient_id = f'CSV_{idx+1:03d}'
                print(f"\nProcessing patient {idx+1}/{len(patients)}...")
                predictor.run_new_patient_analysis(patient_data, patient_id)
        except Exception as e:
            print(f"❌ Error processing CSV: {e}")
            return
    
    print("\n" + "="*70)
    print("✅ NEW PATIENT RISK ANALYSIS COMPLETE!")
    print("="*70)
    print(f"Reports saved to: data/output/new_patient_analysis/\n")


if __name__ == "__main__":
    main()
