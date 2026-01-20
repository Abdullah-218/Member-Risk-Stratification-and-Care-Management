# src/04_model_training.py

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, average_precision_score
)
import matplotlib.pyplot as plt
import seaborn as sns

class RiskModel:
    """
    Train health deterioration risk prediction models
    """
    
    def __init__(self, random_state=42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.feature_names = None
        self.xgb_model = None
        self.lr_model = None
    
    def prepare_data(self):
        """Load and prepare training data"""
        print("Preparing training data...")
        
        # Load
        df = pd.read_csv('data/processed/training_data.csv')
        
        # Define features (from 2008 only - no data leakage!)
        feature_cols = [
            # Demographics
            'age_2008', 'age_group_2008', 'is_female_2008', 
            'race_encoded_2008', 'has_esrd_2008',
            
            # Chronic conditions
            'SP_ALZHDMTA_2008', 'SP_CHF_2008', 'SP_CHRNKIDN_2008', 
            'SP_CNCR_2008', 'SP_COPD_2008', 'SP_DEPRESSN_2008',
            'SP_DIABETES_2008', 'SP_ISCHMCHT_2008', 'SP_OSTEOPRS_2008',
            'SP_RA_OA_2008', 'SP_STRKETIA_2008',
            'chronic_condition_count_2008',
            
            # Condition combinations
            'diabetes_heart_2008', 'ckd_diabetes_2008', 
            'copd_chf_2008', 'multi_morbidity_2008',
            
            # Costs
            'total_inpatient_cost_2008', 'total_outpatient_cost_2008',
            'total_carrier_cost_2008', 'total_annual_cost_2008',
            'inpatient_cost_ratio_2008', 'high_cost_flag_2008',
            'zero_cost_flag_2008',
            
            # Coverage
            'total_coverage_months_2008', 'coverage_gap_2008',
            'has_hmo_2008', 'has_part_d_2008',
            
            # Derived
            'cost_percentile_2008', 'complexity_index_2008',
            'frailty_score_2008'
        ]
        
        # Filter to existing columns
        feature_cols = [col for col in feature_cols if col in df.columns]
        
        X = df[feature_cols]
        y = df['health_deterioration']
        
        # Clean feature names (remove _2008 suffix for readability)
        X.columns = [col.replace('_2008', '') for col in X.columns]
        self.feature_names = X.columns.tolist()
        
        print(f"✅ Data prepared:")
        print(f"   Samples: {len(X)}")
        print(f"   Features: {len(self.feature_names)}")
        print(f"   Target rate: {y.mean()*100:.1f}%")
        
        return X, y
    
    def split_data(self, X, y):
        """Train/test split"""
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.2,
            random_state=self.random_state,
            stratify=y
        )
        
        print(f"\nTrain/Test Split:")
        print(f"   Train: {len(X_train)} samples")
        print(f"   Test: {len(X_test)} samples")
        
        # Save for later use
        X_train.to_csv('data/processed/X_train.csv', index=False)
        X_test.to_csv('data/processed/X_test.csv', index=False)
        pd.DataFrame(y_train, columns=['health_deterioration']).to_csv(
            'data/processed/y_train.csv', index=False
        )
        pd.DataFrame(y_test, columns=['health_deterioration']).to_csv(
            'data/processed/y_test.csv', index=False
        )
        
        return X_train, X_test, y_train, y_test
    
    def train_baseline(self, X_train, y_train, X_test, y_test):
        """Train Logistic Regression baseline"""
        print("\n" + "="*60)
        print("BASELINE: LOGISTIC REGRESSION")
        print("="*60)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.lr_model = LogisticRegression(
            max_iter=1000,
            random_state=self.random_state,
            class_weight='balanced'
        )
        self.lr_model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred_proba = self.lr_model.predict_proba(X_test_scaled)[:, 1]
        auc = roc_auc_score(y_test, y_pred_proba)
        
        print(f"ROC-AUC: {auc:.4f}")
        
        return y_pred_proba
    
    def train_xgboost(self, X_train, y_train, X_test, y_test):
        """Train XGBoost model"""
        print("\n" + "="*60)
        print("PRIMARY MODEL: XGBOOST")
        print("="*60)
        
        # Calculate class weights
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        print(f"Class imbalance ratio: {scale_pos_weight:.2f}")
        
        # Train
        self.xgb_model = XGBClassifier(
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
        
        self.xgb_model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Evaluate
        y_pred = self.xgb_model.predict(X_test)
        y_pred_proba = self.xgb_model.predict_proba(X_test)[:, 1]
        
        auc = roc_auc_score(y_test, y_pred_proba)
        
        print(f"\nPerformance:")
        print(f"ROC-AUC: {auc:.4f}")
        print(f"\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance
        self._plot_feature_importance()
        
        return y_pred_proba
    
    def _plot_feature_importance(self):
        """Plot top features"""
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.xgb_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        plt.figure(figsize=(10, 8))
        sns.barplot(data=importance_df.head(15), x='importance', y='feature')
        plt.title('Top 15 Most Important Features')
        plt.xlabel('Importance Score')
        plt.tight_layout()
        plt.savefig('data/output/feature_importance.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("✅ Feature importance saved")
    
    def plot_roc_comparison(self, y_test, lr_proba, xgb_proba):
        """Compare ROC curves"""
        plt.figure(figsize=(10, 6))
        
        # Logistic Regression
        fpr_lr, tpr_lr, _ = roc_curve(y_test, lr_proba)
        auc_lr = roc_auc_score(y_test, lr_proba)
        plt.plot(fpr_lr, tpr_lr, label=f'Logistic Regression (AUC={auc_lr:.3f})', linewidth=2)
        
        # XGBoost
        fpr_xgb, tpr_xgb, _ = roc_curve(y_test, xgb_proba)
        auc_xgb = roc_auc_score(y_test, xgb_proba)
        plt.plot(fpr_xgb, tpr_xgb, label=f'XGBoost (AUC={auc_xgb:.3f})', linewidth=2)
        
        # Random
        plt.plot([0, 1], [0, 1], 'k--', label='Random')
        
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve Comparison')
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('data/output/roc_curves.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print("✅ ROC curves saved")
    
    def save_models(self):
        """Save all models"""
        joblib.dump(self.xgb_model, 'models/xgb_risk_model.pkl')
        joblib.dump(self.lr_model, 'models/lr_baseline_model.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        joblib.dump(self.feature_names, 'models/feature_names.pkl')
        
        print("\n✅ Models saved to models/")


# ============================================
# MAIN EXECUTION (MUST BE AT MODULE LEVEL!)
# ============================================

if __name__ == "__main__":
    trainer = RiskModel()
    
    # Prepare data
    X, y = trainer.prepare_data()
    X_train, X_test, y_train, y_test = trainer.split_data(X, y)
    
    # Train models
    lr_proba = trainer.train_baseline(X_train, y_train, X_test, y_test)
    xgb_proba = trainer.train_xgboost(X_train, y_train, X_test, y_test)
    
    # Compare
    trainer.plot_roc_comparison(y_test, lr_proba, xgb_proba)
    
    # Save
    trainer.save_models()
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE!")
    print("="*60)