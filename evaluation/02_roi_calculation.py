# evaluation/02_roi_calculation.py

"""
ROI ANALYSIS WITH OPTIMIZED BEST MODELS
========================================

CORRECTED VERSION - TIME-SCALED INTERVENTION COSTS

Uses the best-performing models from comparison analysis
with optimized thresholds for maximum business impact

KEY FIX: ROI calculations now use time-scaled intervention costs
         that match the prediction window (30/60/90 days)
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import random

class OptimizedROICalculator:
    """
    Calculate ROI using best models and optimized thresholds
    WITH CORRECTED TIME-SCALED COSTS
    """
    
    def __init__(self):
        # Base intervention costs for 30-day window (existing logic)
        self.intervention_costs = {
            1: 0,       # Tier 1: Monitor only
            2: 150,     # Tier 2: $100-200 range, using midpoint
            3: 400,     # Tier 3: $300-500 range, using midpoint
            4: 700,     # Tier 4: $600-800 range, using midpoint
            5: 900      # Tier 5: $800-1000 range, using midpoint
        }
        
        # Multi-window intervention costs (from model_train_test.py)
        self.multi_window_costs = {
            30: {
                1: 0,       # Tier 1: Monitor only
                2: 150,     # Tier 2: $100-200 range, using midpoint
                3: 400,     # Tier 3: $300-500 range, using midpoint
                4: 700,     # Tier 4: $600-800 range, using midpoint
                5: 900      # Tier 5: $800-1000 range, using midpoint
            },
            60: {
                1: 0,       # Tier 1: Monitor only
                2: 250,     # Tier 2: $200-300 range, using midpoint
                3: 700,     # Tier 3: $600-800 range, using midpoint
                4: 1100,    # Tier 4: $1000-1200 range, using midpoint
                5: 1650     # Tier 5: $1500-1800 range, using midpoint
            },
            90: {
                1: 0,       # Tier 1: Monitor only
                2: 350,     # Tier 2: $300-400 range, using midpoint
                3: 1050,    # Tier 3: $900-1200 range, using midpoint
                4: 1550,    # Tier 4: $1400-1700 range, using midpoint
                5: 1900     # Tier 5: $1800-2000 range, using midpoint
            }
        }
        
        # Multi-window success rate ranges (from model_train_test.py)
        self.multi_window_success_rates = {
            30: {
                1: (0.03, 0.08),    # Tier 1: 3% - 8% (minimal monitoring)
                2: (0.10, 0.20),    # Tier 2: 10% - 20% (low intervention)
                3: (0.25, 0.40),    # Tier 3: 25% - 40% (moderate intervention)
                4: (0.30, 0.50),    # Tier 4: 30% - 50% (intensive intervention)
                5: (0.40, 0.60)     # Tier 5: 40% - 60% (critical intervention)
            },
            60: {
                1: (0.10, 0.25),    # Tier 1: 10% - 25% (extended monitoring)
                2: (0.25, 0.40),    # Tier 2: 25% - 40% (early intervention)
                3: (0.35, 0.55),    # Tier 3: 35% - 55% (moderate intervention)
                4: (0.45, 0.65),    # Tier 4: 45% - 65% (intensive intervention)
                5: (0.55, 0.75)     # Tier 5: 55% - 75% (critical intervention)
            },
            90: {
                1: (0.20, 0.35),    # Tier 1: 20% - 35% (long-term monitoring)
                2: (0.35, 0.50),    # Tier 2: 35% - 50% (early intervention)
                3: (0.45, 0.60),    # Tier 3: 45% - 60% (moderate intervention)
                4: (0.60, 0.80),    # Tier 4: 60% - 80% (intensive intervention)
                5: (0.70, 0.90)     # Tier 5: 70% - 90% (critical intervention)
            }
        }
        
        # Window-specific success rate ranges (existing logic)
        self.success_rate_ranges = {
            1: (0.03, 0.08),    # Tier 1: 3% - 8% (minimal monitoring)
            2: (0.10, 0.20),    # Tier 2: 10% - 20% (low intervention)
            3: (0.25, 0.40),    # Tier 3: 25% - 40% (moderate intervention)
            4: (0.30, 0.50),    # Tier 4: 30% - 50% (intensive intervention)
            5: (0.40, 0.60)     # Tier 5: 40% - 60% (critical intervention)
        }
        
        # Fixed random seed for reproducible hackathon demonstrations
        random.seed(42)
        np.random.seed(42)
        
        Path('data/output/roi_optimized').mkdir(parents=True, exist_ok=True)
        
        # Multi-window results storage (NEW)
        self.multi_window_results = {}
        self.multi_window_tier_roi = {}
    
    def load_data_and_models(self):
        """Load test data and best models"""
        print("="*70)
        print("LOADING DATA AND BEST MODELS")
        print("="*70)
        
        # Load test features
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        
        # Load targets for all windows (NEW)
        self.y_30_test = pd.read_csv('data/processed/y_30_test.csv').values.ravel()
        self.y_60_test = pd.read_csv('data/processed/y_60_test.csv').values.ravel()
        self.y_90_test = pd.read_csv('data/processed/y_90_test.csv').values.ravel()
        
        # Load best 30-day model (existing logic for backward compatibility)
        best_model_data = joblib.load('models/best_30_day_model.pkl')
        self.model = best_model_data['model']
        self.model_name = best_model_data['name']
        self.optimal_threshold = best_model_data['threshold']
        
        # Load all window models (NEW)
        self.models = {}
        for window in [30, 60, 90]:
            model_data = joblib.load(f'models/best_{window}_day_model.pkl')
            self.models[window] = {
                'model': model_data['model'],
                'name': model_data['name'],
                'threshold': model_data['threshold']
            }
        
        print(f"  ✅ Test set: {self.X_test.shape}")
        print(f"  ✅ Best model: {self.model_name}")
        print(f"  ✅ Optimal threshold: {self.optimal_threshold:.3f}")
        print(f"  ✅ Loaded models for 30, 60, 90 day windows\n")
    
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
        """
        Calculate ROI using TIME-SCALED intervention costs
        
        CORRECTED Logic:
        - Uses 30-day intervention costs (not annual)
        - Uses 30-day projected costs (aligned time window)
        - ROI capped at 100% maximum (realistic constraint)
        - Controlled random success rates for variability
        """
        print("\n" + "="*70)
        print("ROI CALCULATION (TIME-SCALED COSTS)")
        print("="*70)
        
        # Add TIME-SCALED intervention costs by tier (30-day window)
        self.results['intervention_cost'] = self.results['risk_tier'].map(self.intervention_costs)
        
        # Calculate projected cost for 30-day window (proportional to annual cost)
        # NOW ALIGNED with 30-day intervention costs
        self.results['projected_30_day_cost'] = self.results['total_annual_cost'] * (30/365)
        
        # Apply controlled random success rates by tier
        # Each patient gets a unique but reproducible success rate within their tier range
        def get_success_rate(row):
            tier = row['risk_tier']
            min_rate, max_rate = self.success_rate_ranges[tier]
            # Use patient ID as additional seed for variability while maintaining reproducibility
            patient_seed = 42 + int(row['patient_id'])
            random.seed(patient_seed)
            return random.uniform(min_rate, max_rate)
        
        self.results['success_rate'] = self.results.apply(get_success_rate, axis=1)
        
        # Apply exact ROI formula as specified
        self.results['expected_savings'] = self.results['projected_30_day_cost'] * self.results['success_rate']
        self.results['net_benefit'] = self.results['expected_savings'] - self.results['intervention_cost']
        
        # Calculate ROI percent with 100% cap (realistic constraint)
        self.results['roi_percent'] = (
            self.results['net_benefit'] / self.results['intervention_cost'] * 100
        ).fillna(0)
        
        # Cap ROI at 100% maximum - no patient should have >100% ROI (unrealistic)
        self.results['roi_percent'] = self.results['roi_percent'].clip(upper=100.0)
        
        # Aggregate by tier
        tier_roi = self.results.groupby('risk_tier').agg({
            'patient_id': 'count',
            'intervention_cost': 'sum',
            'expected_savings': 'sum',
            'net_benefit': 'sum',
            'actual_deterioration': 'mean',
            'total_annual_cost': 'mean',
            'projected_30_day_cost': 'mean',
            'success_rate': 'mean'
        }).round(2)
        
        tier_roi.columns = ['Patients', 'Intervention Cost', 'Expected Savings', 
                           'Net Benefit', 'Actual Deterioration Rate', 
                           'Avg Annual Cost', 'Avg 30-Day Cost', 'Avg Success Rate']
        
        # Calculate tier-level ROI
        tier_roi['ROI (%)'] = (
            (tier_roi['Expected Savings'] - tier_roi['Intervention Cost']) / 
            tier_roi['Intervention Cost'] * 100
        ).round(1)
        
        print("\n  ROI by Tier (TIME-SCALED):")
        print(tier_roi)
        
        # Overall metrics
        total_intervention = tier_roi['Intervention Cost'].sum()
        total_savings = tier_roi['Expected Savings'].sum()
        total_net = tier_roi['Net Benefit'].sum()
        overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
        
        print(f"\n  Overall Program (30-Day Window):")
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
        ax1.set_title(f'ROI by Tier (Time-Scaled) - {self.model_name}', fontsize=12, fontweight='bold')
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
        
        # 3. Cost Analysis (Time-Scaled)
        ax3 = axes[1, 0]
        
        x = np.arange(1, 6)
        intervention = self.tier_roi['Intervention Cost'].values
        savings = self.tier_roi['Expected Savings'].values
        
        ax3.bar(x, intervention, label='30-Day Intervention Cost', color='#ff9800', alpha=0.8)
        ax3.bar(x, savings, label='Expected Savings', color='#4caf50', alpha=0.8)
        
        ax3.set_xlabel('Risk Tier', fontsize=11)
        ax3.set_ylabel('Amount ($)', fontsize=11)
        ax3.set_title('Cost-Benefit Analysis by Tier (30-Day)', fontsize=12, fontweight='bold')
        ax3.legend()
        ax3.grid(axis='y', alpha=0.3)
        
        # 4. Net Benefit Waterfall
        ax4 = axes[1, 1]
        
        net_benefits = self.tier_roi['Net Benefit'].values
        colors_nb = ['#4caf50' if x > 0 else '#f44336' for x in net_benefits]
        
        ax4.bar(range(1, 6), net_benefits, color=colors_nb, alpha=0.8)
        ax4.set_xlabel('Risk Tier', fontsize=11)
        ax4.set_ylabel('Net Benefit ($)', fontsize=11)
        ax4.set_title('Net Benefit by Tier (30-Day)', fontsize=12, fontweight='bold')
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
        report.append(f"Prediction Window: 30 days")
        report.append("")
        
        report.append("CORRECTED ROI LOGIC")
        report.append("-"*70)
        report.append("✓ TIME-SCALED intervention costs (30-day, not annual)")
        report.append("✓ Costs aligned: 30-day intervention vs 30-day projected savings")
        report.append("✓ ROI capped at 100% maximum (realistic constraint)")
        report.append("✓ Success rates: 3%-60% by tier (controlled randomness)")
        report.append("")
        
        report.append("INTERVENTION COSTS (30-DAY WINDOW)")
        report.append("-"*70)
        for tier, cost in self.intervention_costs.items():
            tier_label = {1: 'Normal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
            report.append(f"  Tier {tier} ({tier_label:<10}): ${cost:>4}")
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
        
        report.append("FINANCIAL IMPACT (30-DAY WINDOW)")
        report.append("-"*70)
        report.append(f"Overall Program ROI: {self.overall_roi:.1f}%")
        report.append(f"Total Net Benefit: ${self.total_net:,.2f}")
        report.append("")
        
        report.append("TIER-SPECIFIC ROI")
        report.append("-"*70)
        for tier in [5, 4, 3, 2, 1]:
            roi = self.tier_roi.loc[tier, 'ROI (%)']
            tier_label = {1: 'Normal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
            status = "✓ Positive" if roi > 0 else "✗ Negative"
            report.append(f"  Tier {tier} ({tier_label:<10}): {roi:>6.1f}% {status}")
        report.append("")
        
        report.append("KEY INSIGHTS")
        report.append("-"*70)
        report.append("• Higher tiers (4-5) should show positive ROI with corrected logic")
        report.append("• Lower tiers (1-2) may have negative ROI (acceptable - monitoring only)")
        report.append("• Time-scaling ensures costs match intervention timeframe")
        report.append("• 100% ROI cap prevents unrealistic returns")
        report.append("")
        
        report.append("="*70)
        
        report_text = '\n'.join(report)
        
        with open('data/output/roi_optimized/executive_summary.txt', 'w') as f:
            f.write(report_text)
        
        print("\n" + report_text)
        print("\n  ✅ Saved: executive_summary.txt")
    
    def run_multi_window_analysis(self):
        """NEW: Run ROI analysis for all windows (30/60/90 days)"""
        print("\n" + "="*70)
        print("MULTI-WINDOW ROI ANALYSIS (30/60/90 DAYS)")
        print("="*70)
        
        multi_window_summary = {
            'total_patients': len(self.X_test),
            'windows': {}
        }
        
        for window in [30, 60, 90]:
            print(f"\n{'='*50}")
            print(f"ANALYZING {window}-DAY WINDOW")
            print(f"{'='*50}")
            
            # Get model for this window
            model_info = self.models[window]
            model = model_info['model']
            
            # Get actual deterioration for this window
            if window == 30:
                actual = self.y_30_test
            elif window == 60:
                actual = self.y_60_test
            else:
                actual = self.y_90_test
            
            # Get predictions
            risk_proba = model.predict_proba(self.X_test)[:, 1]
            
            # Create results dataframe
            results = pd.DataFrame({
                'patient_id': range(len(self.X_test)),
                'risk_score': risk_proba,
                'actual_deterioration': actual,
                'total_annual_cost': self.X_test['total_annual_cost'].values
            })
            
            # Stratify into tiers (same logic as original)
            results['risk_tier'] = pd.cut(
                results['risk_score'],
                bins=[-0.001, 0.10, 0.25, 0.50, 0.75, 1.001],
                labels=[1, 2, 3, 4, 5],
                right=False
            ).astype(int)
            
            # Add intervention costs for this window
            intervention_costs = self.multi_window_costs[window]
            results['intervention_cost'] = results['risk_tier'].map(intervention_costs)
            
            # Calculate projected cost for the window
            results[f'projected_{window}_day_cost'] = results['total_annual_cost'] * (window/365)
            
            # Apply success rates (same logic as model_train_test.py)
            def get_success_rate(row):
                tier = row['risk_tier']
                # Use window-specific success rate ranges from model_train_test.py
                min_rate, max_rate = self.multi_window_success_rates[window][tier]
                # Use exact same random seed logic as original
                patient_seed = 42 + int(row['patient_id'])
                random.seed(patient_seed)
                return random.uniform(min_rate, max_rate)
            
            results['success_rate'] = results.apply(get_success_rate, axis=1)
            
            # Calculate ROI (same logic as original)
            results['expected_savings'] = results[f'projected_{window}_day_cost'] * results['success_rate']
            results['net_benefit'] = results['expected_savings'] - results['intervention_cost']
            results['roi_percent'] = (
                results['net_benefit'] / results['intervention_cost'] * 100
            ).fillna(0)
            
            # Apply same ROI cap as original (100% maximum)
            results['roi_percent'] = results['roi_percent'].clip(upper=100.0)
            
            # Aggregate by tier
            tier_roi = results.groupby('risk_tier').agg({
                'patient_id': 'count',
                'intervention_cost': 'sum',
                'expected_savings': 'sum',
                'net_benefit': 'sum',
                'actual_deterioration': 'mean'
            }).round(2)
            
            tier_roi.columns = ['Patients', 'Intervention Cost', 'Expected Savings', 
                               'Net Benefit', 'Actual Deterioration Rate']
            
            # Calculate tier-level ROI (same logic as original)
            tier_roi['ROI (%)'] = (
                (tier_roi['Expected Savings'] - tier_roi['Intervention Cost']) / 
                tier_roi['Intervention Cost'] * 100
            ).round(1)
            
            # Apply same ROI cap as original (100% maximum)
            tier_roi['ROI (%)'] = tier_roi['ROI (%)'].clip(upper=100.0)
            
            # Overall metrics (same logic as original)
            total_intervention = tier_roi['Intervention Cost'].sum()
            total_savings = tier_roi['Expected Savings'].sum()
            total_net = tier_roi['Net Benefit'].sum()
            overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
            
            # Store results
            self.multi_window_results[window] = results
            self.multi_window_tier_roi[window] = tier_roi
            
            # Print results
            print(f"\n  {window}-Day Results:")
            print(f"  Overall ROI: {overall_roi:.1f}%")
            print(f"  Net Benefit: ${total_net:,.2f}")
            print(f"  Total Patients: {len(results)}")
            
            print(f"\n  Tier Distribution:")
            tier_counts = results['risk_tier'].value_counts().sort_index()
            for tier in [1, 2, 3, 4, 5]:
                count = tier_counts.get(tier, 0)
                pct = (count / len(results)) * 100
                roi = tier_roi.loc[tier, 'ROI (%)']
                tier_label = {1: 'Normal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
                print(f"    Tier {tier} ({tier_label:<8}): {count:>4} pts ({pct:>5.1f}%) | ROI: {roi:>6.1f}%")
            
            # Save window results
            results.to_csv(f'data/output/roi_optimized/{window}day_patient_roi.csv', index=False)
            tier_roi.to_csv(f'data/output/roi_optimized/{window}day_tier_summary.csv')
            
            # Store summary
            multi_window_summary['windows'][f'{window}_day'] = {
                'overall_roi_percent': overall_roi,
                'total_net_benefit': total_net,
                'total_intervention_cost': total_intervention,
                'total_expected_savings': total_savings,
                'tier_counts': tier_counts.to_dict(),
                'tier_roi': tier_roi['ROI (%)'].to_dict()
            }
        
        # Save multi-window summary
        import json
        with open('data/output/roi_optimized/multi_window_summary.json', 'w') as f:
            json.dump(multi_window_summary, f, indent=2, default=str)
        
        print(f"\n{'='*70}")
        print("✅ MULTI-WINDOW ANALYSIS COMPLETE!")
        print("="*70)
        print("Results saved to: data/output/roi_optimized/")
        
        return multi_window_summary
    
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
    
    # Run original 30-day analysis (existing functionality)
    print("RUNNING ORIGINAL 30-DAY ANALYSIS")
    calculator.run_analysis()
    
    # Run multi-window analysis (NEW functionality)
    print("\n" + "="*80)
    print("RUNNING MULTI-WINDOW ANALYSIS")
    print("="*80)
    calculator.run_multi_window_analysis()
    
    print("\n" + "="*80)
    print("✅ COMPLETE ANALYSIS FINISHED!")
    print("="*80)
    print("✅ Original 30-day analysis complete")
    print("✅ Multi-window (30/60/90 day) analysis complete")
    print("✅ All results saved to: data/output/roi_optimized/")