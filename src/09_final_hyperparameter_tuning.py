# src/09_final_hyperparameter_tuning.py

"""
OPTIONAL: Fine-tune the best models using grid search
Only run if you want to squeeze out extra 1-2% AUC improvement
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from catboost import CatBoostClassifier
import warnings
warnings.filterwarnings('ignore')

class FinalTuning:
    
    def __init__(self):
        self.best_params = {}
    
    def load_data(self):
        print("="*70)
        print("LOADING DATA FOR HYPERPARAMETER TUNING")
        print("="*70)
        
        self.X_train = pd.read_csv('data/processed/X_train.csv')
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        
        self.y_30_train = pd.read_csv('data/processed/y_30_train.csv').values.ravel()
        self.y_60_train = pd.read_csv('data/processed/y_60_train.csv').values.ravel()
        self.y_90_train = pd.read_csv('data/processed/y_90_train.csv').values.ravel()
        
        print(f"  ✅ Loaded: {self.X_train.shape}\n")
    
    def tune_extratrees_30day(self):
        """Fine-tune ExtraTrees for 30-day prediction"""
        print("="*70)
        print("TUNING: ExtraTrees (30-day)")
        print("="*70)
        
        param_grid = {
            'n_estimators': [300, 500],
            'max_depth': [10, 12, 15],
            'min_samples_split': [10, 20],
            'min_samples_leaf': [5, 10],
            'max_features': ['sqrt', 0.5]
        }
        
        base_model = ExtraTreesClassifier(
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        
        grid = GridSearchCV(
            base_model,
            param_grid,
            cv=cv,
            scoring='roc_auc',
            n_jobs=-1,
            verbose=1
        )
        
        print("\n  Running grid search (this may take 5-10 minutes)...")
        grid.fit(self.X_train, self.y_30_train)
        
        print(f"\n  ✅ Best AUC: {grid.best_score_:.4f}")
        print(f"  Best params: {grid.best_params_}")
        
        self.best_params['30_day'] = grid.best_params_
        
        # Save tuned model
        joblib.dump(grid.best_estimator_, 'models/tuned_30_day_model.pkl')
        print("  💾 Saved: tuned_30_day_model.pkl\n")
    
    def tune_randomforest_60day(self):
        """Fine-tune RandomForest for 60-day prediction"""
        print("="*70)
        print("TUNING: RandomForest (60-day)")
        print("="*70)
        
        param_grid = {
            'n_estimators': [300, 500],
            'max_depth': [10, 12, 15],
            'min_samples_split': [10, 20],
            'min_samples_leaf': [5, 10],
            'max_features': ['sqrt', 0.5]
        }
        
        base_model = RandomForestClassifier(
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        
        grid = GridSearchCV(
            base_model,
            param_grid,
            cv=cv,
            scoring='roc_auc',
            n_jobs=-1,
            verbose=1
        )
        
        print("\n  Running grid search...")
        grid.fit(self.X_train, self.y_60_train)
        
        print(f"\n  ✅ Best AUC: {grid.best_score_:.4f}")
        print(f"  Best params: {grid.best_params_}")
        
        self.best_params['60_day'] = grid.best_params_
        
        joblib.dump(grid.best_estimator_, 'models/tuned_60_day_model.pkl')
        print("  💾 Saved: tuned_60_day_model.pkl\n")
    
    def tune_catboost_90day(self):
        """Fine-tune CatBoost for 90-day prediction"""
        print("="*70)
        print("TUNING: CatBoost (90-day)")
        print("="*70)
        
        scale_pos = (self.y_90_train == 0).sum() / (self.y_90_train == 1).sum()
        
        param_grid = {
            'iterations': [300, 500],
            'depth': [5, 6, 8],
            'learning_rate': [0.03, 0.05, 0.1]
        }
        
        base_model = CatBoostClassifier(
            scale_pos_weight=scale_pos,
            random_state=42,
            verbose=False
        )
        
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        
        grid = GridSearchCV(
            base_model,
            param_grid,
            cv=cv,
            scoring='roc_auc',
            n_jobs=-1,
            verbose=1
        )
        
        print("\n  Running grid search...")
        grid.fit(self.X_train, self.y_90_train)
        
        print(f"\n  ✅ Best AUC: {grid.best_score_:.4f}")
        print(f"  Best params: {grid.best_params_}")
        
        self.best_params['90_day'] = grid.best_params_
        
        joblib.dump(grid.best_estimator_, 'models/tuned_90_day_model.pkl')
        print("  💾 Saved: tuned_90_day_model.pkl\n")
    
    def run_tuning(self):
        """Run all tuning"""
        self.load_data()
        self.tune_extratrees_30day()
        self.tune_randomforest_60day()
        self.tune_catboost_90day()
        
        # Save all best params
        joblib.dump(self.best_params, 'models/tuned_hyperparameters.pkl')
        
        print("="*70)
        print("✅ HYPERPARAMETER TUNING COMPLETE!")
        print("="*70)
        print("\nBest parameters saved to: models/tuned_hyperparameters.pkl")

if __name__ == "__main__":
    tuner = FinalTuning()
    tuner.run_tuning()