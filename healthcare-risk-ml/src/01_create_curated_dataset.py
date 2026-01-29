# src/01_create_curated_dataset.py

import pandas as pd
import numpy as np
from pathlib import Path

class CuratedDatasetCreator:
    """
    Create 15K stratified sample ensuring all risk tiers represented
    
    Strategy:
    - Tier 5 (Critical): 5% = 750 patients
    - Tier 4 (High): 10% = 1,500 patients  
    - Tier 3 (Moderate): 20% = 3,000 patients
    - Tier 2 (Low): 30% = 4,500 patients
    - Tier 1 (Normal): 35% = 5,250 patients
    """
    
    def __init__(self):
        self.target_size = 15000
        self.tier_distribution = {
            5: 0.05,   # Critical
            4: 0.10,   # High
            3: 0.20,   # Moderate
            2: 0.30,   # Low
            1: 0.35    # Normal
        }
    
    def load_all_beneficiaries(self):
        """Load 2008-2009 beneficiary data"""
        print("="*60)
        print("LOADING BENEFICIARY DATA")
        print("="*60)
        
        ben_2008 = pd.read_csv('data/raw/cms/beneficiary/DE1_0_2008_Beneficiary_Summary_File_Sample_1.csv')
        ben_2009 = pd.read_csv('data/raw/cms/beneficiary/DE1_0_2009_Beneficiary_Summary_File_Sample_1.csv')
        
        print(f"  2008: {len(ben_2008):,} patients")
        print(f"  2009: {len(ben_2009):,} patients")
        
        return ben_2008, ben_2009
    
    def calculate_risk_proxy(self, ben_2008, ben_2009):
        """
        Calculate risk proxy to enable stratification
        
        Uses 2008 baseline + 2009 outcomes
        """
        print("\n" + "="*60)
        print("CALCULATING RISK PROXY SCORES")
        print("="*60)
        
        # Merge 2008 and 2009
        merged = ben_2008.merge(
            ben_2009[['DESYNPUF_ID', 'BENE_DEATH_DT', 'MEDREIMB_IP', 'MEDREIMB_OP', 'MEDREIMB_CAR']],
            on='DESYNPUF_ID',
            suffixes=('_2008', '_2009'),
            how='inner'
        )
        
        print(f"  Matched patients: {len(merged):,}")
        
        # Calculate age
        merged['birth_year'] = pd.to_datetime(merged['BENE_BIRTH_DT'], format='%Y%m%d', errors='coerce').dt.year
        merged['age'] = 2008 - merged['birth_year']
        
        # Chronic condition count
        condition_cols = ['SP_ALZHDMTA', 'SP_CHF', 'SP_CHRNKIDN', 'SP_CNCR',
                         'SP_COPD', 'SP_DEPRESSN', 'SP_DIABETES', 'SP_ISCHMCHT',
                         'SP_OSTEOPRS', 'SP_RA_OA', 'SP_STRKETIA']
        merged['chronic_count'] = merged[condition_cols].fillna(0).sum(axis=1)
        
        # Total costs 2008
        merged['total_cost_2008'] = (
            merged['MEDREIMB_IP_2008'].fillna(0) +
            merged['MEDREIMB_OP_2008'].fillna(0) +
            merged['MEDREIMB_CAR_2008'].fillna(0)
        )
        
        # Total costs 2009
        merged['total_cost_2009'] = (
            merged['MEDREIMB_IP_2009'].fillna(0) +
            merged['MEDREIMB_OP_2009'].fillna(0) +
            merged['MEDREIMB_CAR_2009'].fillna(0)
        )
        
        # Cost increase
        merged['cost_increase'] = merged['total_cost_2009'] - merged['total_cost_2008']
        
        # Death flag (post-merge columns may be suffixed if both years contain BENE_DEATH_DT)
        death_col_2009 = (
            'BENE_DEATH_DT_2009'
            if 'BENE_DEATH_DT_2009' in merged.columns
            else ('BENE_DEATH_DT' if 'BENE_DEATH_DT' in merged.columns else None)
        )
        if death_col_2009 is None:
            merged['died_2009'] = 0
        else:
            merged['died_2009'] = merged[death_col_2009].notna().astype(int)
        
        # ============================================
        # RISK PROXY SCORE (0-100)
        # ============================================
        
        # Normalize components to 0-1
        age_score = ((merged['age'] - 65) / 30).clip(0, 1)
        condition_score = (merged['chronic_count'] / 11).clip(0, 1)
        cost_score = (merged['total_cost_2008'] / merged['total_cost_2008'].quantile(0.95)).clip(0, 1)
        increase_score = (merged['cost_increase'] / merged['cost_increase'].quantile(0.95)).clip(0, 1)
        death_score = merged['died_2009']
        
        # Weighted risk proxy
        merged['risk_proxy'] = (
            age_score * 0.15 +
            condition_score * 0.25 +
            cost_score * 0.25 +
            increase_score * 0.25 +
            death_score * 0.10
        ) * 100
        
        print(f"\n  Risk proxy statistics:")
        print(f"    Mean: {merged['risk_proxy'].mean():.2f}")
        print(f"    Median: {merged['risk_proxy'].median():.2f}")
        print(f"    Min: {merged['risk_proxy'].min():.2f}")
        print(f"    Max: {merged['risk_proxy'].max():.2f}")
        
        return merged
    
    def stratified_sampling(self, merged):
        """
        Sample 15K patients across 5 risk tiers
        """
        print("\n" + "="*60)
        print("STRATIFIED SAMPLING (15,000 PATIENTS)")
        print("="*60)
        
        # Assign preliminary tiers based on risk proxy percentiles
        merged['prelim_tier'] = pd.cut(
            merged['risk_proxy'],
            bins=[0, 
                  merged['risk_proxy'].quantile(0.35),  # Bottom 35% → Tier 1
                  merged['risk_proxy'].quantile(0.65),  # Next 30% → Tier 2
                  merged['risk_proxy'].quantile(0.85),  # Next 20% → Tier 3
                  merged['risk_proxy'].quantile(0.95),  # Next 10% → Tier 4
                  100],                                  # Top 5% → Tier 5
            labels=[1, 2, 3, 4, 5]
        )
        
        # Sample from each tier
        sampled_patients = []
        
        for tier, proportion in self.tier_distribution.items():
            target_n = int(self.target_size * proportion)
            tier_patients = merged[merged['prelim_tier'] == tier]
            
            # Sample (with replacement if needed)
            if len(tier_patients) >= target_n:
                sample = tier_patients.sample(n=target_n, random_state=42)
            else:
                sample = tier_patients.sample(n=target_n, replace=True, random_state=42)
            
            sampled_patients.append(sample)
            
            print(f"  Tier {tier}: Sampled {len(sample):,} / {len(tier_patients):,} available")
        
        # Combine
        curated = pd.concat(sampled_patients, ignore_index=True)
        
        # Shuffle
        curated = curated.sample(frac=1, random_state=42).reset_index(drop=True)
        
        print(f"\n✅ Curated dataset: {len(curated):,} patients")
        print(f"\n  Tier distribution:")
        print(curated['prelim_tier'].value_counts().sort_index())
        
        return curated
    
    def save_curated_dataset(self, curated):
        """Save curated patient IDs and baseline data"""
        
        # Keep only 2008 baseline columns + 2009 outcomes for target creation
        essential_cols = [
            'DESYNPUF_ID', 'prelim_tier', 'risk_proxy',
            'age', 'chronic_count', 'total_cost_2008', 'total_cost_2009',
            'cost_increase', 'died_2009'
        ]
        
        # Add all 2008 columns
        cols_2008 = [col for col in curated.columns if col.endswith('_2008') or not col.endswith('_2009')]
        essential_cols.extend([col for col in cols_2008 if col not in essential_cols])
        
        curated_subset = curated[[col for col in essential_cols if col in curated.columns]]
        
        # Save
        curated_subset.to_csv('data/processed/curated_15k_patients.csv', index=False)
        
        print("\n💾 Saved: data/processed/curated_15k_patients.csv")
        
        # Also save just patient IDs for reference
        curated[['DESYNPUF_ID', 'prelim_tier']].to_csv(
            'data/processed/curated_patient_ids.csv', index=False
        )
        
        print("💾 Saved: data/processed/curated_patient_ids.csv")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    creator = CuratedDatasetCreator()
    
    # Load data
    ben_2008, ben_2009 = creator.load_all_beneficiaries()
    
    # Calculate risk proxy
    merged = creator.calculate_risk_proxy(ben_2008, ben_2009)
    
    # Stratified sampling
    curated = creator.stratified_sampling(merged)
    
    # Save
    creator.save_curated_dataset(curated)
    
    print("\n" + "="*60)
    print("✅ CURATED DATASET CREATION COMPLETE!")
    print("="*60)
    print("\nNext step: python src/02_feature_engineering.py")