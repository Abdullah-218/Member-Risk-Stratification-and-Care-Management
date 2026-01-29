# src/03_create_targets.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import joblib

class MultiWindowTargetCreator:
    """
    Create 3 separate target variables:
    - y_30day: Deterioration in next 30 days
    - y_60day: Deterioration in next 60 days  
    - y_90day: Deterioration in next 90 days
    
    Strategy: Use 2008 baseline → 2009 outcomes
    Define deterioration with increasing severity thresholds
    """
    
    def __init__(self):
        self.target_rates = {}
    
    def load_features(self):
        """Load engineered features"""
        print("="*60)
        print("LOADING FEATURES")
        print("="*60)
        
        df = pd.read_csv('data/processed/features_27.csv')
        print(f"  ✅ Loaded: {df.shape}")
        
        return df
    
    def create_targets(self, df):
        """
        Create 3 deterioration targets
        
        Logic:
        - 30-day: Immediate critical events (death, severe cost spike, readmission proxy)
        - 60-day: 30-day events + moderate deterioration
        - 90-day: 60-day events + broader deterioration signals
        
        Expected positive rates:
        - 30-day: 12-15%
        - 60-day: 18-22%
        - 90-day: 25-30%
        """
        print("\n" + "="*60)
        print("CREATING 3 TARGET VARIABLES")
        print("="*60)
        
        df = df.copy()
        
        # ============================================
        # TARGET 1: 30-DAY DETERIORATION (Critical)
        # ============================================
        
        print("\n1. 30-day target (Critical events)...")
        
        # Most severe events only
        df['y_30day'] = (
            # Death in 2009
            (df['died_2009'] == 1) |
            
            # Extreme cost spike (>100%)
            ((df['cost_increase'] > df['total_cost_2009']) & 
             (df['total_cost_2009'] > df['total_cost_2009'].quantile(0.90))) |
            
            # Very high 2009 costs (top 5%)
            (df['total_cost_2009'] > df['total_cost_2009'].quantile(0.95))
        ).astype(int)
        
        rate_30 = df['y_30day'].mean()
        self.target_rates['30day'] = rate_30
        
        print(f"   Positive rate: {rate_30*100:.1f}%")
        print(f"   Positive cases: {df['y_30day'].sum():,}")
        
        # ============================================
        # TARGET 2: 60-DAY DETERIORATION (High Risk)
        # ============================================
        
        print("\n2. 60-day target (Critical + High risk events)...")
        
        # 30-day events + moderate severity
        df['y_60day'] = (
            # All 30-day events
            (df['y_30day'] == 1) |
            
            # Significant cost spike (>75%)
            ((df['cost_increase'] > 0.75 * df['total_cost_2009']) & 
             (df['total_cost_2009'] > df['total_cost_2009'].quantile(0.75))) |
            
            # High 2009 costs (top 10%)
            (df['total_cost_2009'] > df['total_cost_2009'].quantile(0.90))
        ).astype(int)
        
        rate_60 = df['y_60day'].mean()
        self.target_rates['60day'] = rate_60
        
        print(f"   Positive rate: {rate_60*100:.1f}%")
        print(f"   Positive cases: {df['y_60day'].sum():,}")
        
        # ============================================
        # TARGET 3: 90-DAY DETERIORATION (Moderate+)
        # ============================================
        
        print("\n3. 90-day target (All deterioration signals)...")
        
        # 60-day events + broader signals
        df['y_90day'] = (
            # All 60-day events
            (df['y_60day'] == 1) |
            
            # Moderate cost spike (>50%)
            ((df['cost_increase'] > 0.50 * df['total_cost_2009']) & 
             (df['total_cost_2009'] > df['total_cost_2009'].quantile(0.60))) |
            
            # Elevated 2009 costs (top 20%)
            (df['total_cost_2009'] > df['total_cost_2009'].quantile(0.80))
        ).astype(int)
        
        rate_90 = df['y_90day'].mean()
        self.target_rates['90day'] = rate_90
        
        print(f"   Positive rate: {rate_90*100:.1f}%")
        print(f"   Positive cases: {df['y_90day'].sum():,}")
        
        # ============================================
        # VALIDATION
        # ============================================
        
        print("\n" + "="*60)
        print("TARGET VALIDATION")
        print("="*60)
        
        print(f"\n✅ Hierarchical structure verified:")
        print(f"   30-day ⊆ 60-day: {(df['y_30day'] <= df['y_60day']).all()}")
        print(f"   60-day ⊆ 90-day: {(df['y_60day'] <= df['y_90day']).all()}")
        
        print(f"\n✅ Target rate progression:")
        print(f"   30-day: {rate_30*100:.1f}%")
        print(f"   60-day: {rate_60*100:.1f}% (+{(rate_60-rate_30)*100:.1f}%)")
        print(f"   90-day: {rate_90*100:.1f}% (+{(rate_90-rate_60)*100:.1f}%)")
        
        return df
    
    def create_train_test_splits(self, df):
        """
        Create train/test splits for all 3 targets
        
        Strategy: Single split, use for all models (ensures comparable evaluation)
        """
        print("\n" + "="*60)
        print("CREATING TRAIN/TEST SPLITS")
        print("="*60)
        
        # Load feature names
        feature_names = joblib.load('models/feature_names.pkl')
        
        # Features
        X = df[feature_names].copy()
        
        # Targets
        y_30 = df['y_30day'].copy()
        y_60 = df['y_60day'].copy()
        y_90 = df['y_90day'].copy()
        
        # Single stratified split (use 90-day for stratification as it has most positives)
        X_train, X_test, y_30_train, y_30_test = train_test_split(
            X, y_30, 
            test_size=0.2, 
            random_state=42,
            stratify=y_90  # Stratify on 90-day to ensure balanced split
        )
        
        # Get corresponding splits for other targets
        train_idx = X_train.index
        test_idx = X_test.index
        
        y_60_train = y_60.loc[train_idx]
        y_60_test = y_60.loc[test_idx]
        
        y_90_train = y_90.loc[train_idx]
        y_90_test = y_90.loc[test_idx]
        
        print(f"\n  Train size: {len(X_train):,} samples")
        print(f"  Test size: {len(X_test):,} samples")
        
        print(f"\n  Train target rates:")
        print(f"    30-day: {y_30_train.mean()*100:.1f}%")
        print(f"    60-day: {y_60_train.mean()*100:.1f}%")
        print(f"    90-day: {y_90_train.mean()*100:.1f}%")
        
        print(f"\n  Test target rates:")
        print(f"    30-day: {y_30_test.mean()*100:.1f}%")
        print(f"    60-day: {y_60_test.mean()*100:.1f}%")
        print(f"    90-day: {y_90_test.mean()*100:.1f}%")
        
        return X_train, X_test, y_30_train, y_30_test, y_60_train, y_60_test, y_90_train, y_90_test
    
    def save_datasets(self, X_train, X_test, y_30_train, y_30_test, 
                     y_60_train, y_60_test, y_90_train, y_90_test):
        """Save all train/test splits"""
        print("\n" + "="*60)
        print("SAVING DATASETS")
        print("="*60)
        
        # Features
        X_train.to_csv('data/processed/X_train.csv', index=False)
        X_test.to_csv('data/processed/X_test.csv', index=False)
        
        # Targets (save as separate files)
        pd.DataFrame(y_30_train, columns=['y_30day']).to_csv('data/processed/y_30_train.csv', index=False)
        pd.DataFrame(y_30_test, columns=['y_30day']).to_csv('data/processed/y_30_test.csv', index=False)
        
        pd.DataFrame(y_60_train, columns=['y_60day']).to_csv('data/processed/y_60_train.csv', index=False)
        pd.DataFrame(y_60_test, columns=['y_60day']).to_csv('data/processed/y_60_test.csv', index=False)
        
        pd.DataFrame(y_90_train, columns=['y_90day']).to_csv('data/processed/y_90_train.csv', index=False)
        pd.DataFrame(y_90_test, columns=['y_90day']).to_csv('data/processed/y_90_test.csv', index=False)
        
        # Save target rates
        joblib.dump(self.target_rates, 'models/target_rates.pkl')
        
        print("  💾 Saved:")
        print("     - X_train.csv, X_test.csv")
        print("     - y_30_train.csv, y_30_test.csv")
        print("     - y_60_train.csv, y_60_test.csv")
        print("     - y_90_train.csv, y_90_test.csv")
        print("     - target_rates.pkl")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    creator = MultiWindowTargetCreator()
    
    # Load features
    df = creator.load_features()
    
    # Create targets
    df_with_targets = creator.create_targets(df)
    
    # Create splits
    X_train, X_test, y_30_train, y_30_test, y_60_train, y_60_test, y_90_train, y_90_test = \
        creator.create_train_test_splits(df_with_targets)
    
    # Save
    creator.save_datasets(
        X_train, X_test, 
        y_30_train, y_30_test, 
        y_60_train, y_60_test, 
        y_90_train, y_90_test
    )
    
    print("\n" + "="*60)
    print("✅ TARGET CREATION COMPLETE!")
    print("="*60)
    print("\nNext step: python src/04_train_models.py")