# src/02_feature_engineering.py

import pandas as pd
import numpy as np
import joblib

class FeatureEngineer:
    """
    Engineer ~27 high-quality features (not 44)
    
    Focus on MOST IMPORTANT features only:
    - Demographics (5)
    - Chronic Conditions (10)
    - Utilization (6)
    - Costs (4)
    - Derived (2)
    """
    
    def __init__(self):
        self.selected_features = None
    
    def load_data(self):
        """Load curated dataset + claims"""
        print("="*60)
        print("LOADING DATA")
        print("="*60)
        
        # Curated patients
        curated = pd.read_csv('data/processed/curated_15k_patients.csv')
        print(f"  Curated patients: {len(curated):,}")
        
        # Load claims
        inpatient = pd.read_csv('data/raw/cms/inpatient/DE1_0_2008_to_2010_Inpatient_Claims_Sample_1.csv')
        outpatient = pd.read_csv('data/raw/cms/outpatient/DE1_0_2008_to_2010_Outpatient_Claims_Sample_1.csv')
        
        # Filter claims to curated patients only
        patient_ids = curated['DESYNPUF_ID'].unique()
        inpatient = inpatient[inpatient['DESYNPUF_ID'].isin(patient_ids)]
        outpatient = outpatient[outpatient['DESYNPUF_ID'].isin(patient_ids)]
        
        print(f"  Inpatient claims: {len(inpatient):,}")
        print(f"  Outpatient claims: {len(outpatient):,}")
        
        return curated, inpatient, outpatient
    
    def process_claims_features(self, inpatient, outpatient):
        """Extract simplified claims features"""
        print("\n" + "="*60)
        print("PROCESSING CLAIMS FEATURES")
        print("="*60)
        
        # ============================================
        # INPATIENT FEATURES (4)
        # ============================================
        
        # Convert dates
        inpatient['CLM_ADMSN_DT'] = pd.to_datetime(inpatient['CLM_ADMSN_DT'], format='%Y%m%d', errors='coerce')
        inpatient['CLM_THRU_DT'] = pd.to_datetime(inpatient['CLM_THRU_DT'], format='%Y%m%d', errors='coerce')
        
        # Filter to 2008
        inp_2008 = inpatient[inpatient['CLM_ADMSN_DT'].dt.year == 2008].copy()
        
        # Length of stay
        inp_2008['los'] = (inp_2008['CLM_THRU_DT'] - inp_2008['CLM_ADMSN_DT']).dt.days
        
        # Aggregate
        inp_features = inp_2008.groupby('DESYNPUF_ID').agg({
            'CLM_ADMSN_DT': ['count', 'max'],
            'los': 'sum'
        }).reset_index()
        
        inp_features.columns = ['DESYNPUF_ID', 'total_admissions_2008', 'last_admission_date', 'total_hospital_days_2008']
        
        # Days since last admission
        reference_date = pd.to_datetime('2008-12-31')
        inp_features['days_since_last_admission'] = (
            reference_date - inp_features['last_admission_date']
        ).dt.days
        
        inp_features = inp_features.drop('last_admission_date', axis=1)
        
        print(f"  Inpatient features: {len(inp_features):,} patients")
        
        # ============================================
        # OUTPATIENT FEATURES (2)
        # ============================================
        
        outpatient['CLM_FROM_DT'] = pd.to_datetime(outpatient['CLM_FROM_DT'], format='%Y%m%d', errors='coerce')
        out_2008 = outpatient[outpatient['CLM_FROM_DT'].dt.year == 2008].copy()
        
        out_features = out_2008.groupby('DESYNPUF_ID').agg({
            'CLM_FROM_DT': 'count'
        }).reset_index()
        
        out_features.columns = ['DESYNPUF_ID', 'total_outpatient_visits_2008']
        out_features['high_outpatient_user'] = (out_features['total_outpatient_visits_2008'] > 10).astype(int)
        
        print(f"  Outpatient features: {len(out_features):,} patients")
        
        return inp_features, out_features
    
    def engineer_features(self, curated, inp_features, out_features):
        """Create final 27-feature dataset"""
        print("\n" + "="*60)
        print("ENGINEERING 27 SELECTED FEATURES")
        print("="*60)
        
        df = curated.copy()
        
        # Merge claims
        df = df.merge(inp_features, on='DESYNPUF_ID', how='left')
        df = df.merge(out_features, on='DESYNPUF_ID', how='left')
        
        # Fill NaN
        df['total_admissions_2008'].fillna(0, inplace=True)
        df['total_hospital_days_2008'].fillna(0, inplace=True)
        df['days_since_last_admission'].fillna(999, inplace=True)
        df['total_outpatient_visits_2008'].fillna(0, inplace=True)
        df['high_outpatient_user'].fillna(0, inplace=True)
        
        # ============================================
        # FEATURE SET (27 FEATURES)
        # ============================================
        
        # 1. DEMOGRAPHICS (5)
        df['is_female'] = (df['BENE_SEX_IDENT_CD'] == 2).astype(int)
        df['is_elderly'] = (df['age'] >= 75).astype(int)
        df['race_encoded'] = df['BENE_RACE_CD'].map({1: 0, 2: 1, 3: 2, 5: 3}).fillna(4).astype(int)
        df['has_esrd'] = df.get('BENE_ESRD_IND', 'N').fillna('N').str.strip().isin(['Y', '1']).astype(int)
        
        # 2. CHRONIC CONDITIONS (10)
        condition_map = {
            'SP_ALZHDMTA': 'has_alzheimers',
            'SP_CHF': 'has_chf',
            'SP_CHRNKIDN': 'has_ckd',
            'SP_CNCR': 'has_cancer',
            'SP_COPD': 'has_copd',
            'SP_DEPRESSN': 'has_depression',
            'SP_DIABETES': 'has_diabetes',
            'SP_ISCHMCHT': 'has_ischemic_heart',
            'SP_RA_OA': 'has_ra_oa',
            'SP_STRKETIA': 'has_stroke'
        }
        
        for old_col, new_col in condition_map.items():
            df[new_col] = df[old_col].fillna(0).astype(int)
        
        # 3. UTILIZATION (6)
        # Already have: total_admissions_2008, total_hospital_days_2008, days_since_last_admission, 
        #               total_outpatient_visits_2008, high_outpatient_user
        df['recent_admission'] = (df['days_since_last_admission'] <= 90).astype(int)
        
        # 4. COSTS (4)
        df['total_inpatient_cost'] = df['MEDREIMB_IP_2008'].fillna(0) + df['BENRES_IP'].fillna(0)
        df['total_annual_cost'] = (
            df['total_inpatient_cost'] +
            df['MEDREIMB_OP_2008'].fillna(0) +
            df['MEDREIMB_CAR_2008'].fillna(0)
        )
        df['cost_percentile'] = df['total_annual_cost'].rank(pct=True)
        df['high_cost'] = (df['cost_percentile'] > 0.75).astype(int)
        
        # 5. DERIVED (2)
        df['frailty_score'] = (
            ((df['age'] - 65) / 30).clip(0, 1) * 0.4 +
            (df['chronic_count'] / 10) * 0.4 +
            df['high_cost'] * 0.2
        )
        
        df['complexity_index'] = df['chronic_count'] * df['cost_percentile']
        
        # ============================================
        # SELECT FINAL 27 FEATURES
        # ============================================
        
        self.selected_features = [
            # Demographics (5)
            'age', 'is_female', 'is_elderly', 'race_encoded', 'has_esrd',
            
            # Chronic Conditions (10)
            'has_alzheimers', 'has_chf', 'has_ckd', 'has_cancer', 'has_copd',
            'has_depression', 'has_diabetes', 'has_ischemic_heart', 'has_ra_oa', 'has_stroke',
            
            # Utilization (6)
            'total_admissions_2008', 'total_hospital_days_2008', 'days_since_last_admission',
            'recent_admission', 'total_outpatient_visits_2008', 'high_outpatient_user',
            
            # Costs (4)
            'total_annual_cost', 'cost_percentile', 'high_cost', 'total_inpatient_cost',
            
            # Derived (2)
            'frailty_score', 'complexity_index'
        ]
        
        print(f"\n✅ Selected 27 features:")
        print(f"   Demographics: 5")
        print(f"   Chronic Conditions: 10")
        print(f"   Utilization: 6")
        print(f"   Costs: 4")
        print(f"   Derived: 2")
        
        # Keep ID + features + outcome columns
        keep_cols = ['DESYNPUF_ID'] + self.selected_features + ['died_2009', 'cost_increase', 'total_cost_2009']
        df_final = df[[col for col in keep_cols if col in df.columns]].copy()
        
        return df_final
    
    def save_features(self, df):
        """Save engineered features"""
        df.to_csv('data/processed/features_27.csv', index=False)
        joblib.dump(self.selected_features, 'models/feature_names.pkl')
        
        print("\n💾 Saved: data/processed/features_27.csv")
        print("💾 Saved: models/feature_names.pkl")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    engineer = FeatureEngineer()
    
    # Load
    curated, inpatient, outpatient = engineer.load_data()
    
    # Process claims
    inp_features, out_features = engineer.process_claims_features(inpatient, outpatient)
    
    # Engineer features
    df_final = engineer.engineer_features(curated, inp_features, out_features)
    
    # Save
    engineer.save_features(df_final)
    
    print("\n" + "="*60)
    print("✅ FEATURE ENGINEERING COMPLETE!")
    print("="*60)
    print("\nNext step: python src/03_create_targets.py")