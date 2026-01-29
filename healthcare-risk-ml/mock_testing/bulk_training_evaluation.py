# bulk_training_evaluation.py

"""
BULK TRAINING DATASET EVALUATION
=================================

Uses the 12k training dataset to predict patients in bulk for evaluation purposes:
- Risk predictions for all 3 windows (30/60/90 days)
- ROI calculations with time-scaled intervention costs
- Risk tier distribution analysis
- Comprehensive financial impact assessment
- Organization-level insights

This evaluates model performance on the training data itself for demonstration purposes.
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import random
from datetime import datetime

class BulkTrainingEvaluator:
    """
    Evaluate the 12k training dataset with bulk predictions
    """
    
    def __init__(self):
        # Create output directory
        Path('data/output/bulk_training_eval').mkdir(parents=True, exist_ok=True)
        
        # TIME-SCALED intervention costs by window and tier
        self.intervention_costs = {
            '30_day': {
                1: 0,       # Tier 1: Monitor only
                2: 150,     # Tier 2: $100-200 range, using midpoint
                3: 400,     # Tier 3: $300-500 range, using midpoint
                4: 700,     # Tier 4: $600-800 range, using midpoint
                5: 900      # Tier 5: $800-1000 range, using midpoint
            },
            '60_day': {
                1: 0,       # Tier 1: Monitor only
                2: 250,     # Tier 2: $200-300 range, using midpoint
                3: 700,     # Tier 3: $600-800 range, using midpoint
                4: 1100,    # Tier 4: $1000-1200 range, using midpoint
                5: 1650     # Tier 5: $1500-1800 range, using midpoint
            },
            '90_day': {
                1: 0,       # Tier 1: Monitor only
                2: 350,     # Tier 2: $300-400 range, using midpoint
                3: 1050,    # Tier 3: $900-1200 range, using midpoint
                4: 1550,    # Tier 4: $1400-1700 range, using midpoint
                5: 1900     # Tier 5: $1800-2000 range, using midpoint
            }
        }
        
        # Window-specific success rate ranges
        self.success_rate_ranges = {
            '30_day': {
                1: (0.03, 0.08),    # Tier 1: 3% - 8%
                2: (0.10, 0.20),    # Tier 2: 10% - 20%
                3: (0.25, 0.40),    # Tier 3: 25% - 40%
                4: (0.30, 0.50),    # Tier 4: 30% - 50%
                5: (0.40, 0.60)     # Tier 5: 40% - 60%
            },
            '60_day': {
                1: (0.10, 0.25),    # Tier 1: 10% - 25%
                2: (0.25, 0.40),    # Tier 2: 25% - 40%
                3: (0.35, 0.55),    # Tier 3: 35% - 55%
                4: (0.45, 0.65),    # Tier 4: 45% - 65%
                5: (0.55, 0.75)     # Tier 5: 55% - 75%
            },
            '90_day': {
                1: (0.20, 0.35),    # Tier 1: 20% - 35%
                2: (0.35, 0.50),    # Tier 2: 35% - 50%
                3: (0.45, 0.60),    # Tier 3: 45% - 60%
                4: (0.60, 0.80),    # Tier 4: 60% - 80%
                5: (0.70, 0.90)     # Tier 5: 70% - 90%
            }
        }
        
        # Fixed random seed for reproducible results
        random.seed(42)
        np.random.seed(42)
        
        # Tier labels
        self.tier_labels = {
            1: 'Normal',
            2: 'Low Risk',
            3: 'Moderate Risk',
            4: 'High Risk',
            5: 'Critical Risk'
        }
        
        # Results storage
        self.results = {}
        self.models = {}
        
    def load_training_data_and_models(self):
        """Load the 12k training dataset and trained models"""
        print("="*70)
        print("LOADING 12K TRAINING DATASET & MODELS")
        print("="*70)
        
        # Load training data
        self.X_train = pd.read_csv('data/processed/X_train.csv')
        self.y_30_train = pd.read_csv('data/processed/y_30_train.csv').values.ravel()
        self.y_60_train = pd.read_csv('data/processed/y_60_train.csv').values.ravel()
        self.y_90_train = pd.read_csv('data/processed/y_90_train.csv').values.ravel()
        
        print(f"  ✅ Training dataset: {self.X_train.shape[0]:,} patients")
        print(f"  ✅ Features: {self.X_train.shape[1]}")
        print(f"  ✅ Average annual cost: ${self.X_train['total_annual_cost'].mean():,.2f}")
        
        # Load trained models for all windows
        for window in ['30_day', '60_day', '90_day']:
            model_path = f'models/best_{window}_model.pkl'
            model_data = joblib.load(model_path)
            self.models[window] = model_data['model']
            print(f"  ✅ Loaded {window.replace('_', '-').upper()} model: {model_data.get('name', 'Model')}")
        
        print()
        
    def predict_all_patients(self):
        """Generate predictions for all 12k patients across all windows"""
        print("="*70)
        print("GENERATING BULK PREDICTIONS FOR 12K PATIENTS")
        print("="*70)
        
        for window in ['30_day', '60_day', '90_day']:
            print(f"\n📊 Processing {window.replace('_', '-').upper()} predictions...")
            
            model = self.models[window]
            
            # Get risk predictions
            risk_proba = model.predict_proba(self.X_train)[:, 1]
            
            # Stratify to tiers
            tiers = []
            for risk_score in risk_proba:
                tier = self.stratify_to_tier(risk_score)
                tiers.append(tier)
            
            # Get actual deterioration rates for this window
            if window == '30_day':
                actual = self.y_30_train
            elif window == '60_day':
                actual = self.y_60_train
            else:
                actual = self.y_90_train
            
            # Create results dataframe
            results_df = pd.DataFrame({
                'patient_id': range(len(self.X_train)),
                'risk_score': risk_proba,
                'risk_tier': tiers,
                'actual_deterioration': actual,
                'total_annual_cost': self.X_train['total_annual_cost'].values
            })
            
            # Calculate ROI for this window
            results_df = self.calculate_window_roi(results_df, window)
            
            # Store results
            self.results[window] = results_df
            
            # Print summary
            self.print_window_summary(results_df, window)
        
        print(f"\n✅ Completed predictions for all {len(self.X_train):,} patients across all windows")
        
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
    
    def calculate_window_roi(self, results_df, window):
        """Calculate ROI for a specific time window"""
        
        # Get intervention costs for this window
        intervention_costs = self.intervention_costs[window]
        results_df['intervention_cost'] = results_df['risk_tier'].map(intervention_costs)
        
        # Calculate projected cost for the time window
        days = int(window.split('_')[0])
        results_df[f'projected_{window}_cost'] = results_df['total_annual_cost'] * (days/365)
        
        # Apply success rates
        def get_success_rate(row):
            tier = row['risk_tier']
            min_rate, max_rate = self.success_rate_ranges[window][tier]
            # Use patient ID for reproducible randomness
            patient_seed = 42 + int(row['patient_id']) + days
            random.seed(patient_seed)
            return random.uniform(min_rate, max_rate)
        
        results_df['success_rate'] = results_df.apply(get_success_rate, axis=1)
        
        # Calculate ROI
        projected_cost_col = f'projected_{window}_cost'
        results_df['expected_savings'] = results_df[projected_cost_col] * results_df['success_rate']
        results_df['net_benefit'] = results_df['expected_savings'] - results_df['intervention_cost']
        
        # Calculate ROI percent with 100% cap
        results_df['roi_percent'] = (
            results_df['net_benefit'] / results_df['intervention_cost'] * 100
        ).fillna(0)
        results_df['roi_percent'] = results_df['roi_percent'].clip(upper=100.0)
        
        return results_df
    
    def print_window_summary(self, results_df, window):
        """Print summary statistics for a window"""
        
        days = int(window.split('_')[0])
        window_label = f"{days}-Day"
        
        print(f"\n  {window_label} Summary:")
        
        # Tier distribution
        tier_counts = results_df['risk_tier'].value_counts().sort_index()
        total_patients = len(results_df)
        
        print(f"    Total Patients: {total_patients:,}")
        print(f"    Average Risk Score: {results_df['risk_score'].mean():.4f}")
        print(f"    Actual Deterioration Rate: {results_df['actual_deterioration'].mean()*100:.2f}%")
        
        print(f"\n    Risk Tier Distribution:")
        for tier in [1, 2, 3, 4, 5]:
            count = tier_counts.get(tier, 0)
            pct = (count / total_patients) * 100
            avg_risk = results_df[results_df['risk_tier'] == tier]['risk_score'].mean()
            actual_rate = results_df[results_df['risk_tier'] == tier]['actual_deterioration'].mean() * 100
            avg_roi = results_df[results_df['risk_tier'] == tier]['roi_percent'].mean()
            
            tier_label = self.tier_labels[tier]
            print(f"      Tier {tier} ({tier_label:<12}): {count:>5} pts ({pct:>5.1f}%) | "
                  f"Risk: {avg_risk:.3f} | Actual: {actual_rate:.1f}% | ROI: {avg_roi:.1f}%")
        
        # Overall financial impact
        total_intervention = results_df['intervention_cost'].sum()
        total_savings = results_df['expected_savings'].sum()
        total_net = results_df['net_benefit'].sum()
        overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
        
        print(f"\n    {window_label} Financial Impact:")
        print(f"      Total Intervention Cost: ${total_intervention:,.2f}")
        print(f"      Expected Savings: ${total_savings:,.2f}")
        print(f"      Net Benefit: ${total_net:,.2f}")
        print(f"      Overall ROI: {overall_roi:.1f}%")
    
    def generate_comprehensive_analysis(self):
        """Generate comprehensive analysis across all windows"""
        print("\n" + "="*70)
        print("COMPREHENSIVE CROSS-WINDOW ANALYSIS")
        print("="*70)
        
        # Create summary dataframe
        summary_data = []
        
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            days = int(window.split('_')[0])
            
            # Calculate metrics
            total_patients = len(results_df)
            total_intervention = results_df['intervention_cost'].sum()
            total_savings = results_df['expected_savings'].sum()
            total_net = results_df['net_benefit'].sum()
            overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
            
            # High-risk patients (tiers 4-5)
            high_risk_patients = results_df[results_df['risk_tier'].isin([4, 5])]
            high_risk_count = len(high_risk_patients)
            high_risk_pct = (high_risk_count / total_patients) * 100
            high_risk_roi = (high_risk_patients['net_benefit'].sum() / 
                           high_risk_patients['intervention_cost'].sum() * 100) if high_risk_patients['intervention_cost'].sum() > 0 else 0
            
            summary_data.append({
                'Window': f"{days}-Day",
                'Total_Patients': total_patients,
                'High_Risk_Patients': high_risk_count,
                'High_Risk_Percent': high_risk_pct,
                'Total_Intervention': total_intervention,
                'Expected_Savings': total_savings,
                'Net_Benefit': total_net,
                'Overall_ROI': overall_roi,
                'High_Risk_ROI': high_risk_roi
            })
        
        summary_df = pd.DataFrame(summary_data)
        
        print("\nCross-Window Comparison:")
        print(summary_df.round(2))
        
        # Save summary
        summary_df.to_csv('data/output/bulk_training_eval/cross_window_summary.csv', index=False)
        
        return summary_df
    
    def create_visualizations(self):
        """Create comprehensive visualizations"""
        print("\n" + "="*70)
        print("CREATING VISUALIZATIONS")
        print("="*70)
        
        # Set up the figure
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('12K Training Dataset - Comprehensive Risk & ROI Analysis', fontsize=16, fontweight='bold')
        
        colors = ['#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#34495e']
        
        for idx, window in enumerate(['30_day', '60_day', '90_day']):
            results_df = self.results[window]
            days = int(window.split('_')[0])
            
            # 1. Risk Tier Distribution (top row)
            ax1 = axes[0, idx]
            tier_counts = results_df['risk_tier'].value_counts().sort_index()
            bars = ax1.bar(range(1, 6), [tier_counts.get(i, 0) for i in range(1, 6)], color=colors)
            ax1.set_xlabel('Risk Tier')
            ax1.set_ylabel('Number of Patients')
            ax1.set_title(f'{days}-Day Risk Distribution')
            ax1.set_xticks(range(1, 6))
            ax1.grid(axis='y', alpha=0.3)
            
            # Add value labels on bars
            for i, bar in enumerate(bars):
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:,}', ha='center', va='bottom', fontsize=9)
            
            # 2. ROI by Tier (bottom row)
            ax2 = axes[1, idx]
            tier_roi = results_df.groupby('risk_tier')['roi_percent'].mean()
            roi_colors = ['#2ecc71' if x > 0 else '#e74c3c' for x in tier_roi.values]
            bars = ax2.bar(range(1, 6), tier_roi.values, color=roi_colors, alpha=0.8)
            ax2.set_xlabel('Risk Tier')
            ax2.set_ylabel('Average ROI (%)')
            ax2.set_title(f'{days}-Day ROI by Tier')
            ax2.set_xticks(range(1, 6))
            ax2.axhline(0, color='black', linewidth=0.8)
            ax2.grid(axis='y', alpha=0.3)
            
            # Add value labels on bars
            for i, bar in enumerate(bars):
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.1f}%', ha='center', va='bottom', fontsize=9)
        
        plt.tight_layout()
        plt.savefig('data/output/bulk_training_eval/comprehensive_analysis.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("  ✅ Saved: comprehensive_analysis.png")
        
        # Create financial impact comparison
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Financial metrics by window
        windows = ['30-Day', '60-Day', '90-Day']
        intervention_costs = []
        net_benefits = []
        
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            intervention_costs.append(results_df['intervention_cost'].sum())
            net_benefits.append(results_df['net_benefit'].sum())
        
        # Cost comparison
        x = np.arange(len(windows))
        width = 0.35
        
        ax1.bar(x - width/2, intervention_costs, width, label='Intervention Cost', color='#e67e22', alpha=0.8)
        ax1.bar(x + width/2, net_benefits, width, label='Net Benefit', color='#27ae60', alpha=0.8)
        ax1.set_xlabel('Time Window')
        ax1.set_ylabel('Amount ($)')
        ax1.set_title('Financial Impact by Time Window')
        ax1.set_xticks(x)
        ax1.set_xticklabels(windows)
        ax1.legend()
        ax1.grid(axis='y', alpha=0.3)
        
        # Format y-axis to show values in millions
        ax1.ticklabel_format(style='plain', axis='y')
        ax1.get_yaxis().set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
        
        # ROI comparison
        roi_values = []
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            total_intervention = results_df['intervention_cost'].sum()
            total_net = results_df['net_benefit'].sum()
            roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
            roi_values.append(roi)
        
        colors = ['#27ae60' if x > 0 else '#e74c3c' for x in roi_values]
        bars = ax2.bar(windows, roi_values, color=colors, alpha=0.8)
        ax2.set_xlabel('Time Window')
        ax2.set_ylabel('ROI (%)')
        ax2.set_title('Overall ROI by Time Window')
        ax2.axhline(0, color='black', linewidth=0.8)
        ax2.grid(axis='y', alpha=0.3)
        
        # Add value labels
        for bar, roi in zip(bars, roi_values):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{roi:.1f}%', ha='center', va='bottom', fontsize=10)
        
        plt.tight_layout()
        plt.savefig('data/output/bulk_training_eval/financial_comparison.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("  ✅ Saved: financial_comparison.png")
    
    def save_detailed_results(self):
        """Save detailed results for all windows"""
        print("\n" + "="*70)
        print("SAVING DETAILED RESULTS")
        print("="*70)
        
        # Save patient-level results for each window
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            days = int(window.split('_')[0])
            
            # Save patient-level data
            patient_file = f'data/output/bulk_training_eval/patient_level_{window}_results.csv'
            results_df.to_csv(patient_file, index=False)
            print(f"  ✅ Saved: patient_level_{window}_results.csv ({len(results_df):,} patients)")
            
            # Create and save tier summary
            tier_summary = results_df.groupby('risk_tier').agg({
                'patient_id': 'count',
                'risk_score': ['mean', 'std'],
                'actual_deterioration': 'mean',
                'intervention_cost': 'sum',
                'expected_savings': 'sum',
                'net_benefit': 'sum',
                'roi_percent': 'mean'
            }).round(2)
            
            # Flatten column names
            tier_summary.columns = ['Patients', 'Avg_Risk_Score', 'Std_Risk_Score', 
                                   'Actual_Deterioration_Rate', 'Total_Intervention_Cost',
                                   'Total_Expected_Savings', 'Total_Net_Benefit', 'Avg_ROI_Percent']
            
            # Calculate overall ROI for each tier
            tier_summary['Overall_ROI_Percent'] = (
                (tier_summary['Total_Expected_Savings'] - tier_summary['Total_Intervention_Cost']) / 
                tier_summary['Total_Intervention_Cost'] * 100
            ).round(1)
            
            tier_file = f'data/output/bulk_training_eval/tier_summary_{window}.csv'
            tier_summary.to_csv(tier_file)
            print(f"  ✅ Saved: tier_summary_{window}.csv")
        
        # Save comprehensive summary as JSON
        comprehensive_summary = {
            'evaluation_metadata': {
                'dataset': '12k_training_patients',
                'total_patients': len(self.X_train),
                'evaluation_date': datetime.now().isoformat(),
                'windows_analyzed': ['30_day', '60_day', '90_day']
            },
            'window_results': {}
        }
        
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            days = int(window.split('_')[0])
            
            comprehensive_summary['window_results'][window] = {
                'total_patients': len(results_df),
                'average_risk_score': float(results_df['risk_score'].mean()),
                'actual_deterioration_rate': float(results_df['actual_deterioration'].mean()),
                'total_intervention_cost': float(results_df['intervention_cost'].sum()),
                'total_expected_savings': float(results_df['expected_savings'].sum()),
                'total_net_benefit': float(results_df['net_benefit'].sum()),
                'overall_roi_percent': float(
                    (results_df['net_benefit'].sum() / results_df['intervention_cost'].sum() * 100) 
                    if results_df['intervention_cost'].sum() > 0 else 0
                ),
                'tier_distribution': results_df['risk_tier'].value_counts().to_dict(),
                'high_risk_patients': int(len(results_df[results_df['risk_tier'].isin([4, 5])])),
                'high_risk_percentage': float(
                    len(results_df[results_df['risk_tier'].isin([4, 5])]) / len(results_df) * 100
                )
            }
        
        summary_file = 'data/output/bulk_training_eval/comprehensive_summary.json'
        with open(summary_file, 'w') as f:
            json.dump(comprehensive_summary, f, indent=2)
        
        print(f"  ✅ Saved: comprehensive_summary.json")
    
    def generate_executive_report(self):
        """Generate executive summary report"""
        print("\n" + "="*70)
        print("GENERATING EXECUTIVE REPORT")
        print("="*70)
        
        report = []
        report.append("="*70)
        report.append("12K TRAINING DATASET - BULK EVALUATION REPORT")
        report.append("="*70)
        report.append(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}")
        report.append(f"Total Patients Evaluated: {len(self.X_train):,}")
        report.append("")
        
        report.append("EXECUTIVE SUMMARY")
        report.append("-"*70)
        report.append("This report presents comprehensive analysis of the 12,000 patient training dataset")
        report.append("using the trained ML models for risk prediction and ROI analysis across 30, 60,")
        report.append("and 90-day time windows with time-scaled intervention costs.")
        report.append("")
        
        report.append("KEY FINDINGS")
        report.append("-"*70)
        
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            days = int(window.split('_')[0])
            
            total_intervention = results_df['intervention_cost'].sum()
            total_savings = results_df['expected_savings'].sum()
            total_net = results_df['net_benefit'].sum()
            overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
            
            high_risk_count = len(results_df[results_df['risk_tier'].isin([4, 5])])
            high_risk_pct = (high_risk_count / len(results_df)) * 100
            
            report.append(f"{days}-Day Window:")
            report.append(f"  • Total Patients: {len(results_df):,}")
            report.append(f"  • High-Risk Patients (Tiers 4-5): {high_risk_count:,} ({high_risk_pct:.1f}%)")
            report.append(f"  • Total Intervention Cost: ${total_intervention:,.2f}")
            report.append(f"  • Expected Savings: ${total_savings:,.2f}")
            report.append(f"  • Net Benefit: ${total_net:,.2f}")
            report.append(f"  • Overall ROI: {overall_roi:.1f}%")
            report.append("")
        
        report.append("RISK TIER DISTRIBUTION ANALYSIS")
        report.append("-"*70)
        
        # Show distribution for 30-day window as example
        results_30 = self.results['30_day']
        tier_counts = results_30['risk_tier'].value_counts().sort_index()
        
        for tier in [1, 2, 3, 4, 5]:
            count = tier_counts.get(tier, 0)
            pct = (count / len(results_30)) * 100
            avg_risk = results_30[results_30['risk_tier'] == tier]['risk_score'].mean()
            actual_rate = results_30[results_30['risk_tier'] == tier]['actual_deterioration'].mean() * 100
            
            tier_label = self.tier_labels[tier]
            report.append(f"Tier {tier} ({tier_label}): {count:,} patients ({pct:.1f}%)")
            report.append(f"  Average Risk Score: {avg_risk:.3f}")
            report.append(f"  Actual Deterioration Rate: {actual_rate:.1f}%")
            report.append("")
        
        report.append("FINANCIAL IMPACT INSIGHTS")
        report.append("-"*70)
        
        # Compare financial impact across windows
        for window in ['30_day', '60_day', '90_day']:
            results_df = self.results[window]
            days = int(window.split('_')[0])
            
            # High-risk ROI
            high_risk = results_df[results_df['risk_tier'].isin([4, 5])]
            if high_risk['intervention_cost'].sum() > 0:
                high_risk_roi = (high_risk['net_benefit'].sum() / 
                               high_risk['intervention_cost'].sum() * 100)
            else:
                high_risk_roi = 0
            
            report.append(f"{days}-Day High-Risk (Tiers 4-5) ROI: {high_risk_roi:.1f}%")
        
        report.append("")
        report.append("RECOMMENDATIONS")
        report.append("-"*70)
        report.append("• Focus intervention programs on Tiers 4-5 for maximum ROI")
        report.append("• Consider 60-day window for balanced intervention timing")
        report.append("• Monitor Tier 3 patients for potential risk escalation")
        report.append("• Use time-scaled costs for accurate budget planning")
        report.append("")
        
        report.append("METHODOLOGY")
        report.append("-"*70)
        report.append("• Models trained on 12,000 patient dataset")
        report.append("• Risk stratification into 5 tiers based on predicted probability")
        report.append("• Time-scaled intervention costs (30/60/90 day proportional)")
        report.append("• ROI calculations capped at 100% maximum")
        report.append("• Success rates vary by tier and time window")
        report.append("")
        
        report.append("="*70)
        
        report_text = '\n'.join(report)
        
        # Save report
        with open('data/output/bulk_training_eval/executive_report.txt', 'w') as f:
            f.write(report_text)
        
        print("  ✅ Saved: executive_report.txt")
        print("\n" + report_text)
        
        return report_text
    
    def run_complete_evaluation(self):
        """Execute the complete bulk evaluation"""
        print("🏥 STARTING 12K TRAINING DATASET BULK EVALUATION")
        print("="*80)
        
        # Load data and models
        self.load_training_data_and_models()
        
        # Generate predictions for all patients
        self.predict_all_patients()
        
        # Generate comprehensive analysis
        summary = self.generate_comprehensive_analysis()
        
        # Create visualizations
        self.create_visualizations()
        
        # Save detailed results
        self.save_detailed_results()
        
        # Generate executive report
        self.generate_executive_report()
        
        print("\n" + "="*80)
        print("✅ BULK EVALUATION COMPLETE!")
        print("="*80)
        print("All results saved to: data/output/bulk_training_eval/")
        print("\nGenerated files:")
        print("  • patient_level_[window]_results.csv - Individual patient predictions")
        print("  • tier_summary_[window].csv - Tier-level analysis")
        print("  • comprehensive_analysis.png - Visual analysis")
        print("  • financial_comparison.png - Financial impact comparison")
        print("  • comprehensive_summary.json - Complete data summary")
        print("  • executive_report.txt - Executive summary")
        
        return summary


# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    evaluator = BulkTrainingEvaluator()
    evaluator.run_complete_evaluation()
