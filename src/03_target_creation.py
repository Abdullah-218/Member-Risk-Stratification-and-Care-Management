# src/03_target_creation.py

import pandas as pd
import numpy as np

class TargetCreator:
    """
    Create target variable: Health Deterioration
    
    Strategy: Compare 2008 baseline to 2009 outcomes
    """
    
    def create_target(self, df_2008, df_2009):
        """
        Define health deterioration by comparing Year 1 vs Year 2
        
        Deterioration = ANY of:
        1. Cost increased >50%
        2. New chronic condition developed
        3. Death occurred
        4. Inpatient admission with high cost
        """
        print("Creating target variable...")
        
        # Merge 2008 and 2009 data
        merged = df_2008.merge(
            df_2009,
            on='DESYNPUF_ID',
            suffixes=('_2008', '_2009'),
            how='inner'
        )
        
        print(f"  Matched beneficiaries: {len(merged)}")
        
        # ============================================
        # CRITERION 1: Cost Spike
        # ============================================
        
        merged['cost_increase_pct'] = np.where(
            merged['total_annual_cost_2008'] > 0,
            (merged['total_annual_cost_2009'] - merged['total_annual_cost_2008']) / 
            merged['total_annual_cost_2008'],
            0
        )
        
        merged['had_cost_spike'] = (merged['cost_increase_pct'] > 0.5).astype(int)
        
        # ============================================
        # CRITERION 2: New Chronic Condition
        # ============================================
        
        merged['had_new_condition'] = (
            merged['chronic_condition_count_2009'] > 
            merged['chronic_condition_count_2008']
        ).astype(int)
        
        # ============================================
        # CRITERION 3: Death
        # ============================================
        
        # Check if death date exists in 2009 data
        merged['died'] = merged['BENE_DEATH_DT_2009'].notna().astype(int)
        
        # ============================================
        # CRITERION 4: High Inpatient Utilization
        # ============================================
        
        merged['high_inpatient_cost'] = (
            merged['total_inpatient_cost_2009'] > 
            merged['total_inpatient_cost_2009'].quantile(0.90)
        ).astype(int)
        
        # ============================================
        # FINAL TARGET: Any deterioration indicator
        # ============================================
        
        merged['health_deterioration'] = (
            (merged['had_cost_spike'] == 1) |
            (merged['had_new_condition'] == 1) |
            (merged['died'] == 1) |
            (merged['high_inpatient_cost'] == 1)
        ).astype(int)
        
        # Print statistics
        print(f"\n📊 Target Variable Statistics:")
        print(f"   Total samples: {len(merged)}")
        print(f"   Deterioration cases: {merged['health_deterioration'].sum()} "
              f"({merged['health_deterioration'].mean()*100:.1f}%)")
        print(f"\n   Breakdown:")
        print(f"   - Cost spike >50%: {merged['had_cost_spike'].sum()}")
        print(f"   - New condition: {merged['had_new_condition'].sum()}")
        print(f"   - Death: {merged['died'].sum()}")
        print(f"   - High inpatient: {merged['high_inpatient_cost'].sum()}")
        
        return merged

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    # Load featured data
    df_2008 = pd.read_csv('data/processed/cms_2008_featured.csv')
    df_2009 = pd.read_csv('data/processed/cms_2009_featured.csv')
    
    # Create target
    tc = TargetCreator()
    training_data = tc.create_target(df_2008, df_2009)
    
    # Save training dataset
    training_data.to_csv('data/processed/training_data.csv', index=False)
    
    print("\n✅ Target creation complete!")
    print(f"   Saved: data/processed/training_data.csv")