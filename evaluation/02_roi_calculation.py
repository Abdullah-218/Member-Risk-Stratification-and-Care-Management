# evaluation/02_roi_calculation.py

"""
ROI ANALYSIS WITH OPTIMIZED BEST MODELS
========================================

Uses the best-performing models from comparison analysis
with optimized thresholds for maximum business impact
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

class OptimizedROICalculator:
    """
    Calculate ROI using best models and optimized thresholds
    """
    
    def __init__(self):
        # Intervention costs (same as before)
        self.intervention_costs = {
            5: 2500,
            4: 1200,
            3: 600,
            2: 200,
            1: 0
        }
        
        # Expected reduction rates (same as before)
        self.reduction_rates = {
            5: 0.30,
            4: 0.25,
            3: 0.20,
            2: 0.10,
            1: 0.00
        }
        
        Path('data/output/roi_optimized').mkdir(parents=True, exist_ok=True)
    
    def load_data_and_models(self):
        """Load test data and best models"""
        print("="*70)
        print("LOADING DATA AND BEST MODELS")
        print("="*70)
        
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        self.y_30_test = pd.read_csv('data/processed/y_30_test.csv').values.ravel()
        
        # Load best 30-day model
        best_model_data = joblib.load('models/best_30_day_model.pkl')
        self.model = best_model_data['model']
        self.model_name = best_model_data['name']
        self.optimal_threshold = best_model_data['threshold']
        
        print(f"  ✅ Test set: {self.X_test.shape}")
        print(f"  ✅ Best model: {self.model_name}")
        print(f"  ✅ Optimal threshold: {self.optimal_threshold:.3f}\n")
    
    def stratify_patients(self):
        """Stratify using best model and optimal threshold"""
        print("="*70)
        print("STRATIFYING PATIENTS (OPTIMIZED)")
        print("="*70)
        
        # Get calibrated risk predictions
        risk_proba = self.model.predict_proba(self.X_test)[:, 1]
        
        self.results = pd.DataFrame({
            'patient_id': range(len(self.X_test)),
            'risk_score': risk_proba,
            'actual_deterioration': self.y_30_test,
            'total_annual_cost': self.X_test['total_annual_cost'].values
        })
        
        # Stratify into 5 tiers
        self.results['risk_tier'] = pd.cut(
            self.results['risk_score'],
            bins=[-0.001, 0.10, 0.25, 0.50, 0.75, 1.001],
            labels=[1, 2, 3, 4, 5],
            right=False
        ).astype(int)
        
        # Print distribution
        print("\n  Risk Tier Distribution:")
        tier_counts = self.results['risk_tier'].value_counts().sort_index()
        
        for tier in [1, 2, 3, 4, 5]:
            count = tier_counts.get(tier, 0)
            pct = (count / len(self.results)) * 100
            avg_risk = self.results[self.results['risk_tier'] == tier]['risk_score'].mean()
            
            # Calculate actual deterioration rate
            tier_data = self.results[self.results['risk_tier'] == tier]
            actual_rate = tier_data['actual_deterioration'].mean() * 100
            
            tier_label = {1: 'Normal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
            
            print(f"  Tier {tier} ({tier_label:<8}): {count:>4} pts ({pct:>5.1f}%) | "
                  f"Avg Risk: {avg_risk:.3f} | Actual: {actual_rate:.1f}%")
    
    def calculate_roi_comparison(self):
        """Calculate ROI and compare with baseline"""
        print("\n" + "="*70)
        print("ROI CALCULATION (OPTIMIZED VS BASELINE)")
        print("="*70)
        
        # Add intervention costs
        self.results['intervention_cost'] = self.results['risk_tier'].map(self.intervention_costs)
        
        # Calculate savings (60% preventable)
        preventable_portion = 0.60
        self.results['preventable_cost'] = self.results['total_annual_cost'] * preventable_portion
        self.results['reduction_rate'] = self.results['risk_tier'].map(self.reduction_rates)
        self.results['expected_savings'] = self.results['preventable_cost'] * self.results['reduction_rate']
        self.results['net_benefit'] = self.results['expected_savings'] - self.results['intervention_cost']
        
        # Aggregate
        tier_roi = self.results.groupby('risk_tier').agg({
            'patient_id': 'count',
            'intervention_cost': 'sum',
            'expected_savings': 'sum',
            'net_benefit': 'sum',
            'actual_deterioration': 'mean'
        }).round(2)
        
        tier_roi.columns = ['Patients', 'Intervention Cost', 'Expected Savings', 
                           'Net Benefit', 'Actual Deterioration Rate']
        
        tier_roi['ROI (%)'] = (
            (tier_roi['Expected Savings'] - tier_roi['Intervention Cost']) / 
            tier_roi['Intervention Cost'] * 100
        ).round(1)
        
        print("\n  ROI by Tier:")
        print(tier_roi)
        
        # Overall metrics
        total_intervention = tier_roi['Intervention Cost'].sum()
        total_savings = tier_roi['Expected Savings'].sum()
        total_net = tier_roi['Net Benefit'].sum()
        overall_roi = (total_net / total_intervention * 100)
        
        print(f"\n  Overall Program:")
        print(f"    Total Intervention: ${total_intervention:,.2f}")
        print(f"    Expected Savings: ${total_savings:,.2f}")
        print(f"    Net Benefit: ${total_net:,.2f}")
        print(f"    ROI: {overall_roi:.1f}%")
        
        self.tier_roi = tier_roi
        self.overall_roi = overall_roi
        self.total_net = total_net
    
    def plot_optimized_roi(self):
        """Visualize optimized ROI"""
        print("\n" + "="*70)
        print("GENERATING VISUALIZATIONS")
        print("="*70)
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        
        # 1. ROI by Tier
        ax1 = axes[0, 0]
        roi_values = self.tier_roi['ROI (%)'].values
        colors = ['#4caf50' if x > 0 else '#f44336' for x in roi_values]
        
        ax1.barh(range(len(roi_values)), roi_values, color=colors)
        ax1.set_yticks(range(len(roi_values)))
        ax1.set_yticklabels([f'Tier {i}' for i in range(1, 6)])
        ax1.set_xlabel('ROI (%)', fontsize=11)
        ax1.set_title(f'ROI by Tier - {self.model_name}', fontsize=12, fontweight='bold')
        ax1.axvline(0, color='black', linewidth=0.8)
        ax1.grid(axis='x', alpha=0.3)
        
        # 2. Predicted vs Actual Deterioration
        ax2 = axes[0, 1]
        
        tier_analysis = self.results.groupby('risk_tier').agg({
            'risk_score': 'mean',
            'actual_deterioration': 'mean'
        })
        
        x = np.arange(1, 6)
        width = 0.35
        
        ax2.bar(x - width/2, tier_analysis['risk_score']*100, width, 
               label='Predicted Risk', color='#2196f3', alpha=0.8)
        ax2.bar(x + width/2, tier_analysis['actual_deterioration']*100, width,
               label='Actual Rate', color='#f44336', alpha=0.8)
        
        ax2.set_xlabel('Risk Tier', fontsize=11)
        ax2.set_ylabel('Rate (%)', fontsize=11)
        ax2.set_title('Predicted vs Actual Deterioration', fontsize=12, fontweight='bold')
        ax2.set_xticks(x)
        ax2.legend()
        ax2.grid(axis='y', alpha=0.3)
        
        # 3. Cost Analysis
        ax3 = axes[1, 0]
        
        x = np.arange(1, 6)
        intervention = self.tier_roi['Intervention Cost'].values
        savings = self.tier_roi['Expected Savings'].values
        
        ax3.bar(x, intervention, label='Intervention Cost', color='#ff9800', alpha=0.8)
        ax3.bar(x, savings, label='Expected Savings', color='#4caf50', alpha=0.8)
        
        ax3.set_xlabel('Risk Tier', fontsize=11)
        ax3.set_ylabel('Amount ($)', fontsize=11)
        ax3.set_title('Cost-Benefit Analysis by Tier', fontsize=12, fontweight='bold')
        ax3.legend()
        ax3.grid(axis='y', alpha=0.3)
        
        # 4. Net Benefit Waterfall
        ax4 = axes[1, 1]
        
        net_benefits = self.tier_roi['Net Benefit'].values
        colors_nb = ['#4caf50' if x > 0 else '#f44336' for x in net_benefits]
        
        ax4.bar(range(1, 6), net_benefits, color=colors_nb, alpha=0.8)
        ax4.set_xlabel('Risk Tier', fontsize=11)
        ax4.set_ylabel('Net Benefit ($)', fontsize=11)
        ax4.set_title('Net Benefit by Tier', fontsize=12, fontweight='bold')
        ax4.axhline(0, color='black', linewidth=0.8)
        ax4.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('data/output/roi_optimized/optimized_roi_analysis.png', dpi=150)
        plt.close()
        
        print("  ✅ Saved: optimized_roi_analysis.png")
    
    def save_results(self):
        """Save detailed results"""
        
        self.results.to_csv('data/output/roi_optimized/patient_level_roi.csv', index=False)
        self.tier_roi.to_csv('data/output/roi_optimized/tier_summary.csv')
        
        print("\n  ✅ Saved: patient_level_roi.csv")
        print("  ✅ Saved: tier_summary.csv")
    
    def generate_report(self):
        """Generate executive summary"""
        
        report = []
        report.append("="*70)
        report.append("OPTIMIZED ROI ANALYSIS - EXECUTIVE SUMMARY")
        report.append("="*70)
        report.append("")
        
        report.append("MODEL CONFIGURATION")
        report.append("-"*70)
        report.append(f"Selected Model: {self.model_name}")
        report.append(f"Optimized Threshold: {self.optimal_threshold:.3f}")
        report.append(f"Total Patients: {len(self.results):,}")
        report.append("")
        
        report.append("RISK STRATIFICATION RESULTS")
        report.append("-"*70)
        tier_dist = self.results['risk_tier'].value_counts().sort_index()
        for tier in [1, 2, 3, 4, 5]:
            count = tier_dist.get(tier, 0)
            pct = (count / len(self.results)) * 100
            tier_label = {1: 'Normal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
            actual_rate = self.results[self.results['risk_tier'] == tier]['actual_deterioration'].mean() * 100
            
            report.append(f"  Tier {tier} ({tier_label:<10}): {count:>4} pts ({pct:>5.1f}%) | "
                         f"Actual Deterioration: {actual_rate:.1f}%")
        report.append("")
        
        report.append("FINANCIAL IMPACT")
        report.append("-"*70)
        report.append(f"Overall Program ROI: {self.overall_roi:.1f}%")
        report.append(f"Total Net Benefit: ${self.total_net:,.2f}")
        report.append("")
        
        report.append("TIER-SPECIFIC ROI")
        report.append("-"*70)
        for tier in [5, 4, 3, 2]:
            roi = self.tier_roi.loc[tier, 'ROI (%)']
            tier_label = {2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
            report.append(f"  Tier {tier} ({tier_label:<10}): {roi:>6.1f}%")
        report.append("")
        
        report.append("="*70)
        
        report_text = '\n'.join(report)
        
        with open('data/output/roi_optimized/executive_summary.txt', 'w') as f:
            f.write(report_text)
        
        print("\n" + report_text)
        print("\n  ✅ Saved: executive_summary.txt")
    
    def run_analysis(self):
        """Execute full analysis"""
        self.load_data_and_models()
        self.stratify_patients()
        self.calculate_roi_comparison()
        self.plot_optimized_roi()
        self.save_results()
        self.generate_report()

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    calculator = OptimizedROICalculator()
    calculator.run_analysis()
    
    print("\n" + "="*70)
    print("✅ OPTIMIZED ROI ANALYSIS COMPLETE!")
    print("="*70)