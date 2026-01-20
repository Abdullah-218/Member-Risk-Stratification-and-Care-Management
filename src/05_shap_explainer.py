import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib.pyplot as plt

class SHAPExplainer:
    """
    Generate SHAP explanations for predictions
    """
    
    def __init__(self):
        self.model = joblib.load('models/xgb_risk_model.pkl')
        self.feature_names = joblib.load('models/feature_names.pkl')
        self.explainer = None
    
    def create_explainer(self, X_sample):
        """Create SHAP TreeExplainer"""
        print("Creating SHAP explainer...")
        self.explainer = shap.TreeExplainer(self.model)
        print("✅ Explainer created")
    
    def generate_shap_values(self, X):
        """Calculate SHAP values"""
        print(f"Calculating SHAP values for {len(X)} samples...")
        shap_values = self.explainer.shap_values(X)
        print("✅ SHAP values calculated")
        return shap_values
    
    def plot_summary(self, shap_values, X):
        """Population-level SHAP summary"""
        plt.figure(figsize=(10, 8))
        shap.summary_plot(
            shap_values, X,
            feature_names=self.feature_names,
            show=False,
            max_display=15
        )
        plt.tight_layout()
        plt.savefig('data/output/shap_summary.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("✅ SHAP summary saved")
    
    def plot_waterfall(self, shap_values, X, idx=0):
        """Individual patient explanation"""
        shap.waterfall_plot(
            shap.Explanation(
                values=shap_values[idx],
                base_values=self.explainer.expected_value,
                data=X.iloc[idx],
                feature_names=self.feature_names
            ),
            show=False,
            max_display=10
        )
        plt.tight_layout()
        plt.savefig(f'data/output/shap_waterfall_patient{idx}.png', 
                   dpi=150, bbox_inches='tight')
        plt.close()
        print(f"✅ Waterfall plot saved for patient {idx}")
    
    def get_top_features_for_patient(self, shap_values, X, idx, top_n=3):
        """Get top contributing features"""
        feature_impact = pd.DataFrame({
            'feature': self.feature_names,
            'shap_value': shap_values[idx],
            'feature_value': X.iloc[idx].values,
            'abs_impact': np.abs(shap_values[idx])
        }).sort_values('abs_impact', ascending=False)
        
        return feature_impact.head(top_n)
    
    def save_explainer(self):
        """Save for production use"""
        joblib.dump(self.explainer, 'models/shap_explainer.pkl')
        print("✅ SHAP explainer saved")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    # Load test data
    X_test = pd.read_csv('data/processed/X_test.csv')
    
    # Sample for SHAP (computationally expensive)
    X_sample = X_test.sample(n=min(500, len(X_test)), random_state=42)
    
    # Create explainer
    explainer = SHAPExplainer()
    explainer.create_explainer(X_sample)
    
    # Generate SHAP values
    shap_values = explainer.generate_shap_values(X_sample)
    
    # Visualizations
    explainer.plot_summary(shap_values, X_sample)
    explainer.plot_waterfall(shap_values, X_sample, idx=0)
    explainer.plot_waterfall(shap_values, X_sample, idx=10)
    
    # Example explanations
    print("\n" + "="*60)
    print("EXAMPLE: Top Risk Factors")
    print("="*60)
    
    for idx in [0, 10, 50]:
        if idx < len(X_sample):
            print(f"\nPatient {idx}:")
            top = explainer.get_top_features_for_patient(shap_values, X_sample, idx)
            print(top[['feature', 'shap_value', 'feature_value']])
    
    # Save
    explainer.save_explainer()
    
    print("\n✅ SHAP analysis complete!")