# src/04_train_models.py

import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, precision_recall_curve,
    average_precision_score
)
import matplotlib.pyplot as plt
import seaborn as sns

class MultiWindowModelTrainer:
    """
    Train 3 separate XGBoost models for 30/60/90-day predictions
    
    Each model optimized for its specific time horizon
    """
    
    def __init__(self, random_state=42):
        self.random_state = random_state
        self.models = {}
        self.performance = {}
    
    def load_data(self):
        """Load all train/test datasets"""
        print("="*60)
        print("LOADING TRAIN/TEST DATA")
        print("="*60)
        
        X_train = pd.read_csv('data/processed/X_train.csv')
        X_test = pd.read_csv('data/processed/X_test.csv')
        
        y_30_train = pd.read_csv('data/processed/y_30_train.csv').values.ravel()
        y_30_test = pd.read_csv('data/processed/y_30_test.csv').values.ravel()
        
        y_60_train = pd.read_csv('data/processed/y_60_train.csv').values.ravel()
        y_60_test = pd.read_csv('data/processed/y_60_test.csv').values.ravel()
        
        y_90_train = pd.read_csv('data/processed/y_90_train.csv').values.ravel()
        y_90_test = pd.read_csv('data/processed/y_90_test.csv').values.ravel()
        
        feature_names = joblib.load('models/feature_names.pkl')
        
        print(f"  ✅ X_train: {X_train.shape}")
        print(f"  ✅ X_test: {X_test.shape}")
        print(f"  ✅ Features: {len(feature_names)}")
        
        return (X_train, X_test, 
                y_30_train, y_30_test, 
                y_60_train, y_60_test, 
                y_90_train, y_90_test,
                feature_names)
    
    def train_single_model(self, X_train, y_train, X_test, y_test, window_name):
        """
        Train XGBoost model for specific time window
        """
        print(f"\n{'='*60}")
        print(f"TRAINING MODEL: {window_name}")
        print(f"{'='*60}")
        
        # Calculate class imbalance
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        print(f"  Class imbalance ratio: {scale_pos_weight:.2f}")
        
        # Train XGBoost
        model = XGBClassifier(
            max_depth=6,
            learning_rate=0.1,
            n_estimators=200,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight,
            random_state=self.random_state,
            n_jobs=-1,
            eval_metric='logloss'
        )
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Evaluate
        auc = roc_auc_score(y_test, y_pred_proba)
        avg_precision = average_precision_score(y_test, y_pred_proba)
        
        print(f"\n  Performance:")
        print(f"    ROC-AUC: {auc:.4f}")
        print(f"    Avg Precision: {avg_precision:.4f}")
        
        print(f"\n  Classification Report:")
        print(classification_report(y_test, y_pred, target_names=['No Event', 'Deterioration']))
        
        # Store
        self.models[window_name] = model
        self.performance[window_name] = {
            'auc': auc,
            'avg_precision': avg_precision,
            'y_test': y_test,
            'y_pred_proba': y_pred_proba
        }
        
        return model
    
    def train_all_models(self, X_train, X_test, y_30_train, y_30_test,
                        y_60_train, y_60_test, y_90_train, y_90_test):
        """Train all 3 models"""
        
        # 30-day model
        self.train_single_model(X_train, y_30_train, X_test, y_30_test, '30_day')
        
        # 60-day model
        self.train_single_model(X_train, y_60_train, X_test, y_60_test, '60_day')
        
        # 90-day model
        self.train_single_model(X_train, y_90_train, X_test, y_90_test, '90_day')
    
    def plot_comparative_roc(self):
        """Plot ROC curves for all 3 models"""
        print("\n" + "="*60)
        print("GENERATING COMPARATIVE ROC CURVES")
        print("="*60)
        
        plt.figure(figsize=(10, 6))
        
        colors = {'30_day': '#d32f2f', '60_day': '#f57c00', '90_day': '#fbc02d'}
        
        for window_name, perf in self.performance.items():
            fpr, tpr, _ = roc_curve(perf['y_test'], perf['y_pred_proba'])
            auc = perf['auc']
            
            plt.plot(fpr, tpr, 
                    label=f'{window_name} (AUC={auc:.3f})',
                    linewidth=2,
                    color=colors[window_name])
        
        # Random classifier
        plt.plot([0, 1], [0, 1], 'k--', linewidth=1, label='Random')
        
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('ROC Curves: Multi-Window Risk Prediction', fontsize=14, fontweight='bold')
        plt.legend(fontsize=11, loc='lower right')
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('data/output/roc_curves_multiwindow.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("  ✅ Saved: data/output/roc_curves_multiwindow.png")
    
    def plot_feature_importance(self, feature_names):
        """Plot feature importance for 30-day model (most critical)"""
        print("\n" + "="*60)
        print("GENERATING FEATURE IMPORTANCE")
        print("="*60)
        
        model_30 = self.models['30_day']
        
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model_30.feature_importances_
        }).sort_values('importance', ascending=False)
        
        plt.figure(figsize=(10, 8))
        sns.barplot(data=importance_df.head(15), x='importance', y='feature', palette='viridis')
        plt.title('Top 15 Features (30-day Model)', fontsize=14, fontweight='bold')
        plt.xlabel('Importance Score', fontsize=12)
        plt.ylabel('Feature', fontsize=12)
        plt.tight_layout()
        plt.savefig('data/output/feature_importance.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("  ✅ Saved: data/output/feature_importance.png")
        
        print(f"\n  Top 10 Features:")
        for idx, row in importance_df.head(10).iterrows():
            print(f"    {row['feature']}: {row['importance']:.4f}")
    
    def save_models(self):
        """Save all trained models"""
        print("\n" + "="*60)
        print("SAVING MODELS")
        print("="*60)
        
        for window_name, model in self.models.items():
            filepath = f'models/xgb_model_{window_name}.pkl'
            joblib.dump(model, filepath)
            print(f"  💾 {filepath}")
        
        # Save performance metrics
        perf_summary = {
            window: {
                'auc': perf['auc'],
                'avg_precision': perf['avg_precision']
            }
            for window, perf in self.performance.items()
        }
        joblib.dump(perf_summary, 'models/model_performance.pkl')
        print(f"  💾 models/model_performance.pkl")
    
    def print_summary(self):
        """Print final performance summary"""
        print("\n" + "="*60)
        print("MODEL PERFORMANCE SUMMARY")
        print("="*60)
        
        print(f"\n{'Window':<10} {'ROC-AUC':<12} {'Avg Precision':<15} {'Status':<10}")
        print("-" * 60)
        
        for window_name in ['30_day', '60_day', '90_day']:
            perf = self.performance[window_name]
            auc = perf['auc']
            avg_prec = perf['avg_precision']
            status = "✅ Excellent" if auc >= 0.85 else "⚠️ Good"
            
            print(f"{window_name:<10} {auc:<12.4f} {avg_prec:<15.4f} {status:<10}")
        
        print("\n" + "="*60)

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    trainer = MultiWindowModelTrainer()
    
    # Load data
    (X_train, X_test, 
     y_30_train, y_30_test, 
     y_60_train, y_60_test, 
     y_90_train, y_90_test,
     feature_names) = trainer.load_data()
    
    # Train all models
    trainer.train_all_models(
        X_train, X_test,
        y_30_train, y_30_test,
        y_60_train, y_60_test,
        y_90_train, y_90_test
    )
    
    # Visualizations
    trainer.plot_comparative_roc()
    trainer.plot_feature_importance(feature_names)
    
    # Save models
    trainer.save_models()
    
    # Summary
    trainer.print_summary()
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE!")
    print("="*60)
    print("\nTrained 3 XGBoost models:")
    print("  - xgb_model_30_day.pkl")
    print("  - xgb_model_60_day.pkl")
    print("  - xgb_model_90_day.pkl")
    print("\nNext step: python src/05_shap_explainer.py")
