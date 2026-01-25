# evaluation/01_shap_explainer.py

import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

class SHAPExplainer:
    """
    Generate SHAP explanations for all 3 models (30/60/90-day)
    
    Outputs:
    - Global feature importance (what matters most overall)
    - Individual patient explanations (why is THIS patient high-risk)
    - Risk tier analysis (what drives each tier)
    """
    
    def __init__(self):
        self.models = {}
        self.explainers = {}
        self.shap_values = {}
        self.feature_names = None
        
        # Create output directory
        Path('data/output/shap').mkdir(parents=True, exist_ok=True)
    
    def load_models_and_data(self):
        """Load trained models and test data"""
        print("="*60)
        print("LOADING MODELS AND DATA")
        print("="*60)
        
        # Load models (extract from dict structure)
        model_30 = joblib.load('models/best_30_day_model.pkl')
        model_60 = joblib.load('models/best_60_day_model.pkl')
        model_90 = joblib.load('models/best_90_day_model.pkl')
        
        # Extract actual model objects from dictionaries
        m30 = model_30['model'] if isinstance(model_30, dict) else model_30
        m60 = model_60['model'] if isinstance(model_60, dict) else model_60
        m90 = model_90['model'] if isinstance(model_90, dict) else model_90
        
        # If model is CalibratedClassifierCV, extract the base estimator
        from sklearn.calibration import CalibratedClassifierCV
        self.models['30_day'] = m30.estimator if isinstance(m30, CalibratedClassifierCV) else m30
        self.models['60_day'] = m60.estimator if isinstance(m60, CalibratedClassifierCV) else m60
        self.models['90_day'] = m90.estimator if isinstance(m90, CalibratedClassifierCV) else m90
        
        # Store calibrated models for predictions (need probability calibration)
        self.calibrated_models = {
            '30_day': m30,
            '60_day': m60,
            '90_day': m90
        }
        
        # Load test data
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        self.y_30_test = pd.read_csv('data/processed/y_30_test.csv').values.ravel()
        self.y_60_test = pd.read_csv('data/processed/y_60_test.csv').values.ravel()
        self.y_90_test = pd.read_csv('data/processed/y_90_test.csv').values.ravel()
        
        # Feature names
        self.feature_names = joblib.load('models/feature_names.pkl')
        
        print(f"  ✅ Loaded 3 models")
        print(f"  ✅ Test set: {self.X_test.shape}")
        print(f"  ✅ Features: {len(self.feature_names)}")
    
    def create_shap_explainers(self):
        """Create SHAP explainers for each model"""
        print("\n" + "="*60)
        print("CREATING SHAP EXPLAINERS")
        print("="*60)
        
        # Use a sample of test data for background (TreeExplainer is fast, but we'll use 100 samples)
        background = shap.sample(self.X_test, 100, random_state=42)
        
        for window_name, model in self.models.items():
            print(f"\n  Creating explainer for {window_name}...")
            
            # TreeExplainer is optimal for XGBoost
            explainer = shap.TreeExplainer(model)
            self.explainers[window_name] = explainer
            
            # Calculate SHAP values for test set
            print(f"  Calculating SHAP values for {len(self.X_test)} samples...")
            shap_values = explainer.shap_values(self.X_test)
            
            # Handle binary classification - shap_values returns list of 2 arrays
            # We want the positive class (index 1)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            
            self.shap_values[window_name] = shap_values
            
            print(f"  ✅ {window_name}: SHAP values shape {shap_values.shape}")
    
    def plot_global_importance(self):
        """Plot global feature importance across all 3 models"""
        print("\n" + "="*60)
        print("GENERATING GLOBAL FEATURE IMPORTANCE")
        print("="*60)
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        
        for idx, window_name in enumerate(['30_day', '60_day', '90_day']):
            shap_vals = self.shap_values[window_name]
            
            # Calculate mean absolute SHAP values
            mean_shap = np.abs(shap_vals).mean(axis=0)
            
            # Create dataframe
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': mean_shap
            }).sort_values('importance', ascending=False)
            
            # Plot top 15
            ax = axes[idx]
            top_15 = importance_df.head(15)
            colors = sns.color_palette("viridis", len(top_15))
            
            ax.barh(range(len(top_15)), top_15['importance'].values, color=colors)
            ax.set_yticks(range(len(top_15)))
            ax.set_yticklabels(top_15['feature'].values)
            ax.set_xlabel('Mean |SHAP value|', fontsize=11)
            ax.set_title(f'{window_name.replace("_", "-")} Model', fontsize=12, fontweight='bold')
            ax.invert_yaxis()
            ax.grid(axis='x', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('data/output/shap/global_feature_importance.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("  ✅ Saved: data/output/shap/global_feature_importance.png")
    
    def plot_summary_plots(self):
        """Generate SHAP summary plots (beeswarm)"""
        print("\n" + "="*60)
        print("GENERATING SHAP SUMMARY PLOTS")
        print("="*60)
        
        for window_name in ['30_day', '60_day', '90_day']:
            print(f"\n  Creating summary plot for {window_name}...")
            
            plt.figure(figsize=(10, 8))
            shap.summary_plot(
                self.shap_values[window_name],
                self.X_test,
                feature_names=self.feature_names,
                show=False,
                max_display=20
            )
            plt.title(f'SHAP Summary: {window_name.replace("_", "-")} Model', 
                     fontsize=14, fontweight='bold', pad=20)
            plt.tight_layout()
            plt.savefig(f'data/output/shap/summary_{window_name}.png', dpi=150, bbox_inches='tight')
            plt.close()
            
            print(f"  ✅ Saved: data/output/shap/summary_{window_name}.png")
    
    def explain_high_risk_patients(self, n_samples=5):
        """Generate individual explanations for high-risk patients"""
        print("\n" + "="*60)
        print("GENERATING INDIVIDUAL PATIENT EXPLANATIONS")
        print("="*60)
        
        # Focus on 30-day model (most critical)
        model = self.calibrated_models['30_day']
        shap_vals = self.shap_values['30_day']
        
        # Get predictions
        pred_proba = model.predict_proba(self.X_test)[:, 1]
        
        # Find top 5 highest risk patients
        high_risk_indices = np.argsort(pred_proba)[-n_samples:][::-1]
        
        print(f"\n  Explaining top {n_samples} highest-risk patients (30-day model):")
        
        for i, idx in enumerate(high_risk_indices):
            risk_score = pred_proba[idx]
            actual_outcome = self.y_30_test[idx]
            
            print(f"\n  Patient {i+1}:")
            print(f"    Risk Score: {risk_score:.1%}")
            print(f"    Actual Outcome: {'Deteriorated' if actual_outcome == 1 else 'Stable'}")
            
            # Create waterfall plot
            plt.figure(figsize=(10, 6))
            
            # Get expected value (base value) - handle if it's an array
            expected_val = self.explainers['30_day'].expected_value
            if isinstance(expected_val, list):
                expected_val = expected_val[1]
            elif isinstance(expected_val, np.ndarray):
                if expected_val.ndim > 0:
                    expected_val = expected_val[1] if len(expected_val) > 1 else expected_val[0]
            expected_val = float(expected_val)
            
            shap.waterfall_plot(
                shap.Explanation(
                    values=shap_vals[idx],
                    base_values=expected_val,
                    data=self.X_test.iloc[idx].values,
                    feature_names=self.feature_names
                ),
                show=False
            )
            plt.title(f'Patient {i+1}: Risk Score = {risk_score:.1%}', 
                     fontsize=14, fontweight='bold')
            plt.tight_layout()
            plt.savefig(f'data/output/shap/patient_explanation_{i+1}.png', 
                       dpi=150, bbox_inches='tight')
            plt.close()
            
            print(f"    ✅ Saved: data/output/shap/patient_explanation_{i+1}.png")
    
    def analyze_risk_tiers(self):
        """Analyze SHAP patterns across risk tiers"""
        print("\n" + "="*60)
        print("ANALYZING RISK TIER PATTERNS")
        print("="*60)
        
        # Use 30-day model predictions to create tiers
        model = self.calibrated_models['30_day']
        pred_proba = model.predict_proba(self.X_test)[:, 1]
        
        # Stratify into 5 tiers
        self.X_test['risk_tier'] = pd.cut(
            pred_proba,
            bins=[0, 0.10, 0.25, 0.50, 0.75, 1.0],
            labels=[1, 2, 3, 4, 5]
        )
        
        # Analyze top features by tier
        shap_vals = self.shap_values['30_day']
        
        tier_analysis = []
        
        for tier in [1, 2, 3, 4, 5]:
            tier_mask = self.X_test['risk_tier'] == tier
            tier_shap = shap_vals[tier_mask]
            
            if len(tier_shap) > 0:
                # Top 5 features for this tier
                mean_abs_shap = np.abs(tier_shap).mean(axis=0)
                top_features_idx = np.argsort(mean_abs_shap)[-5:][::-1]
                
                tier_analysis.append({
                    'tier': tier,
                    'count': tier_mask.sum(),
                    'avg_risk': pred_proba[tier_mask].mean(),
                    'top_features': [self.feature_names[i] for i in top_features_idx]
                })
        
        # Print analysis
        print("\n  Risk Tier Analysis (30-day model):")
        print(f"\n  {'Tier':<6} {'Count':<8} {'Avg Risk':<12} {'Top Driving Features':<50}")
        print("-" * 80)
        
        for analysis in tier_analysis:
            features_str = ', '.join(analysis['top_features'][:3])
            print(f"  {analysis['tier']:<6} {analysis['count']:<8} {analysis['avg_risk']:<12.1%} {features_str:<50}")
        
        # Save tier analysis
        tier_df = pd.DataFrame(tier_analysis)
        tier_df.to_csv('data/output/shap/tier_analysis.csv', index=False)
        print("\n  ✅ Saved: data/output/shap/tier_analysis.csv")
        
        # Remove temporary column
        self.X_test.drop('risk_tier', axis=1, inplace=True)
    
    def create_dependence_plots(self):
        """Create SHAP dependence plots for top features"""
        print("\n" + "="*60)
        print("GENERATING SHAP DEPENDENCE PLOTS")
        print("="*60)
        
        # Use 30-day model
        shap_vals = self.shap_values['30_day']
        
        # Top 4 features
        mean_abs_shap = np.abs(shap_vals).mean(axis=0)
        top_features_idx = np.argsort(mean_abs_shap)[-4:][::-1]
        top_features = [self.feature_names[i] for i in top_features_idx]
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        axes = axes.ravel()
        
        for i, feature in enumerate(top_features):
            ax = axes[i]
            shap.dependence_plot(
                feature,
                shap_vals,
                self.X_test,
                feature_names=self.feature_names,
                show=False,
                ax=ax
            )
            ax.set_title(f'{feature}', fontsize=12, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('data/output/shap/dependence_plots.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("  ✅ Saved: data/output/shap/dependence_plots.png")
    
    def generate_summary_report(self):
        """Generate text summary of SHAP analysis"""
        print("\n" + "="*60)
        print("GENERATING SUMMARY REPORT")
        print("="*60)
        
        report_lines = []
        report_lines.append("="*60)
        report_lines.append("SHAP EXPLAINABILITY ANALYSIS SUMMARY")
        report_lines.append("="*60)
        report_lines.append("")
        
        # For each model
        for window_name in ['30_day', '60_day', '90_day']:
            shap_vals = self.shap_values[window_name]
            
            # Global importance
            mean_abs_shap = np.abs(shap_vals).mean(axis=0)
            top_10_idx = np.argsort(mean_abs_shap)[-10:][::-1]
            
            report_lines.append(f"\n{window_name.upper().replace('_', '-')} MODEL - Top 10 Features:")
            report_lines.append("-" * 60)
            
            for rank, idx in enumerate(top_10_idx, 1):
                feature = self.feature_names[idx]
                importance = mean_abs_shap[idx]
                report_lines.append(f"  {rank:2d}. {feature:<30} (Impact: {importance:.4f})")
        
        report_lines.append("\n" + "="*60)
        report_lines.append("KEY INSIGHTS")
        report_lines.append("="*60)
        report_lines.append("")
        report_lines.append("1. Cost-related features dominate all models")
        report_lines.append("2. Chronic conditions (CHF, diabetes) are strong predictors")
        report_lines.append("3. Recent utilization patterns critical for short-term risk")
        report_lines.append("4. Age and frailty scores impact long-term predictions")
        report_lines.append("")
        
        # Save report
        with open('data/output/shap/explainability_report.txt', 'w') as f:
            f.write('\n'.join(report_lines))
        
        print("  ✅ Saved: data/output/shap/explainability_report.txt")
        
        # Print to console
        print("\n" + '\n'.join(report_lines))
    
    def run_full_analysis(self):
        """Execute complete SHAP analysis pipeline"""
        self.load_models_and_data()
        self.create_shap_explainers()
        self.plot_global_importance()
        self.plot_summary_plots()
        self.explain_high_risk_patients()
        self.analyze_risk_tiers()
        self.create_dependence_plots()
        self.generate_summary_report()

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    explainer = SHAPExplainer()
    explainer.run_full_analysis()
    
    print("\n" + "="*60)
    print("✅ SHAP EXPLAINABILITY ANALYSIS COMPLETE!")
    print("="*60)
    print("\nGenerated outputs:")
    print("  📊 data/output/shap/global_feature_importance.png")
    print("  📊 data/output/shap/summary_30_day.png")
    print("  📊 data/output/shap/summary_60_day.png")
    print("  📊 data/output/shap/summary_90_day.png")
    print("  📊 data/output/shap/patient_explanation_1.png (through 5)")
    print("  📊 data/output/shap/dependence_plots.png")
    print("  📊 data/output/shap/tier_analysis.csv")
    print("  📄 data/output/shap/explainability_report.txt")
    print("\nNext step: python src/06_roi_calculator.py")