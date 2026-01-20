# src/02_feature_engineering.py

import pandas as pd
import numpy as np
from datetime import datetime

class CMSFeatureEngineer:
    """
    Create comprehensive features from CMS Beneficiary Summary
    """
    
    def __init__(self, reference_year=2010):
        self.reference_year = reference_year
    
    def engineer_features(self, df):
        """
        Create all features from CMS data
        """
        print("Engineering features...")
        df = df.copy()
        
        # ============================================
        # DEMOGRAPHIC FEATURES
        # ============================================
        
        # Calculate age
        df['birth_year'] = pd.to_datetime(df['BENE_BIRTH_DT'], format='%Y%m%d').dt.year
        df['age'] = self.reference_year - df['birth_year']
        
        # Age groups
        df['age_group'] = pd.cut(
            df['age'], 
            bins=[0, 70, 80, 90, 120],
            labels=[0, 1, 2, 3]
        ).astype(int)
        
        # Gender (1=Male, 2=Female in CMS)
        df['is_female'] = (df['BENE_SEX_IDENT_CD'] == 2).astype(int)
        
        # Race (1=White, 2=Black, 3=Other, 5=Hispanic)
        df['race_encoded'] = df['BENE_RACE_CD'].fillna(0).astype(int)
        
        # ESRD indicator
        df['has_esrd'] = df['BENE_ESRD_IND'].fillna('0').str.strip().isin(['Y', '1']).astype(int)
        
        # ============================================
        # CHRONIC CONDITION FEATURES
        # ============================================
        
        condition_cols = [
            'SP_ALZHDMTA', 'SP_CHF', 'SP_CHRNKIDN', 'SP_CNCR',
            'SP_COPD', 'SP_DEPRESSN', 'SP_DIABETES', 'SP_ISCHMCHT',
            'SP_OSTEOPRS', 'SP_RA_OA', 'SP_STRKETIA'
        ]
        
        # Convert to binary (1=has condition, 0=doesn't)
        for col in condition_cols:
            df[col] = df[col].fillna(0).astype(int)
        
        # Chronic condition count
        df['chronic_condition_count'] = df[condition_cols].sum(axis=1)
        
        # Specific combinations (high-risk)
        df['diabetes_heart'] = (
            (df['SP_DIABETES'] == 1) & 
            ((df['SP_CHF'] == 1) | (df['SP_ISCHMCHT'] == 1))
        ).astype(int)
        
        df['ckd_diabetes'] = (
            (df['SP_CHRNKIDN'] == 1) & 
            (df['SP_DIABETES'] == 1)
        ).astype(int)
        
        df['copd_chf'] = (
            (df['SP_COPD'] == 1) & 
            (df['SP_CHF'] == 1)
        ).astype(int)
        
        # Multi-morbidity
        df['multi_morbidity'] = (df['chronic_condition_count'] >= 3).astype(int)
        
        # ============================================
        # COST FEATURES
        # ============================================
        
        # Fill NaN costs with 0
        cost_cols = ['MEDREIMB_IP', 'BENRES_IP', 'PPPYMT_IP',
                     'MEDREIMB_OP', 'BENRES_OP', 'PPPYMT_OP',
                     'MEDREIMB_CAR', 'BENRES_CAR', 'PPPYMT_CAR']
        
        for col in cost_cols:
            df[col] = df[col].fillna(0)
        
        # Total costs by type
        df['total_inpatient_cost'] = (
            df['MEDREIMB_IP'] + df['BENRES_IP'] + df['PPPYMT_IP']
        )
        
        df['total_outpatient_cost'] = (
            df['MEDREIMB_OP'] + df['BENRES_OP'] + df['PPPYMT_OP']
        )
        
        df['total_carrier_cost'] = (
            df['MEDREIMB_CAR'] + df['BENRES_CAR'] + df['PPPYMT_CAR']
        )
        
        # Total annual cost
        df['total_annual_cost'] = (
            df['total_inpatient_cost'] + 
            df['total_outpatient_cost'] + 
            df['total_carrier_cost']
        )
        
        # Cost ratios
        df['inpatient_cost_ratio'] = np.where(
            df['total_annual_cost'] > 0,
            df['total_inpatient_cost'] / df['total_annual_cost'],
            0
        )
        
        # High cost flag (top 25%)
        cost_threshold = df['total_annual_cost'].quantile(0.75)
        df['high_cost_flag'] = (df['total_annual_cost'] > cost_threshold).astype(int)
        
        # Zero cost flag (unusual)
        df['zero_cost_flag'] = (df['total_annual_cost'] == 0).astype(int)
        
        # ============================================
        # COVERAGE FEATURES
        # ============================================
        
        # Coverage months
        df['total_coverage_months'] = (
            df['BENE_HI_CVRAGE_TOT_MONS'].fillna(0) +
            df['BENE_SMI_CVRAGE_TOT_MONS'].fillna(0)
        ) / 2  # Average of Part A and B
        
        # Coverage gap
        df['coverage_gap'] = (
            (df['BENE_HI_CVRAGE_TOT_MONS'] < 12) | 
            (df['BENE_SMI_CVRAGE_TOT_MONS'] < 12)
        ).astype(int)
        
        # HMO enrollment
        df['has_hmo'] = (df['BENE_HMO_CVRAGE_TOT_MONS'].fillna(0) > 0).astype(int)
        
        # Part D coverage
        df['has_part_d'] = (df['PLAN_CVRG_MOS_NUM'].fillna(0) > 0).astype(int)
        
        # ============================================
        # DERIVED RISK SCORES
        # ============================================
        
        # Cost percentile
        df['cost_percentile'] = df['total_annual_cost'].rank(pct=True)
        
        # Complexity index
        df['complexity_index'] = (
            df['chronic_condition_count'] * df['cost_percentile']
        )
        
        # Frailty score (proxy)
        df['frailty_score'] = (
            ((df['age'] - 65) / 30).clip(0, 1) +  # Normalized age
            (df['chronic_condition_count'] / 11) +  # Normalized conditions
            df['high_cost_flag']
        ) / 3
        
        print(f"✅ Features engineered: {df.shape}")
        
        return df
    
    def get_feature_list(self):
        """Return list of engineered features for modeling"""
        features = [
            # Demographics
            'age', 'age_group', 'is_female', 'race_encoded', 'has_esrd',
            
            # Chronic conditions
            'SP_ALZHDMTA', 'SP_CHF', 'SP_CHRNKIDN', 'SP_CNCR',
            'SP_COPD', 'SP_DEPRESSN', 'SP_DIABETES', 'SP_ISCHMCHT',
            'SP_OSTEOPRS', 'SP_RA_OA', 'SP_STRKETIA',
            'chronic_condition_count',
            
            # Condition combinations
            'diabetes_heart', 'ckd_diabetes', 'copd_chf', 'multi_morbidity',
            
            # Costs
            'total_inpatient_cost', 'total_outpatient_cost', 'total_carrier_cost',
            'total_annual_cost', 'inpatient_cost_ratio', 
            'high_cost_flag', 'zero_cost_flag',
            
            # Coverage
            'total_coverage_months', 'coverage_gap', 'has_hmo', 'has_part_d',
            
            # Derived scores
            'cost_percentile', 'complexity_index', 'frailty_score'
        ]
        
        return features

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    # Load raw data
    df_2008 = pd.read_csv('data/processed/cms_2008_raw.csv')
    df_2009 = pd.read_csv('data/processed/cms_2009_raw.csv')
    
    # Engineer features
    fe = CMSFeatureEngineer(reference_year=2008)
    df_2008_featured = fe.engineer_features(df_2008)
    
    fe.reference_year = 2009
    df_2009_featured = fe.engineer_features(df_2009)
    
    # Save
    df_2008_featured.to_csv('data/processed/cms_2008_featured.csv', index=False)
    df_2009_featured.to_csv('data/processed/cms_2009_featured.csv', index=False)
    
    print("\n✅ Feature engineering complete!")
    print(f"   2008 featured: {df_2008_featured.shape}")
    print(f"   2009 featured: {df_2009_featured.shape}")
    
    # Print feature list
    print(f"\n📋 Total features: {len(fe.get_feature_list())}")