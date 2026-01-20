# src/01_data_loading.py

import pandas as pd
import numpy as np
import os

class CMSDataLoader:
    """
    Load and validate CMS DE-SynPUF Beneficiary Summary files
    """
    
    def __init__(self, data_dir='data/raw/cms'):
        self.data_dir = data_dir
        
    def load_beneficiary_summary(self, year):
        """
        Load CMS Beneficiary Summary for specified year
        
        Args:
            year: 2008, 2009, or 2010
        """
        filename = f'DE1_0_{year}_Beneficiary_Summary_File_Sample_1.csv'
        filepath = os.path.join(self.data_dir, filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(
                f"CMS file not found: {filepath}\n"
                f"Please download from: https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-claims-synthetic-public-use-files"
            )
        
        print(f"Loading {filename}...")
        df = pd.read_csv(filepath)
        
        print(f"✅ Loaded {year} data: {df.shape}")
        print(f"   Beneficiaries: {df['DESYNPUF_ID'].nunique()}")
        
        return df
    
    def validate_data(self, df):
        """Basic data validation"""
        print("\nData Validation:")
        print("-" * 60)
        
        # Check for required columns
        required_cols = [
            'DESYNPUF_ID', 'BENE_BIRTH_DT', 'BENE_SEX_IDENT_CD',
            'SP_DIABETES', 'SP_CHF', 'MEDREIMB_IP'
        ]
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"⚠️ Missing columns: {missing_cols}")
        else:
            print("✅ All required columns present")
        
        # Check missing values
        print(f"\nMissing values:")
        missing = df.isnull().sum()
        if missing.sum() > 0:
            print(missing[missing > 0])
        else:
            print("✅ No missing values")
        
        # Basic statistics
        print(f"\nBasic Statistics:")
        print(f"  Unique beneficiaries: {df['DESYNPUF_ID'].nunique()}")
        print(f"  Age range: {df['BENE_BIRTH_DT'].min()} to {df['BENE_BIRTH_DT'].max()}")
        
        return True

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    loader = CMSDataLoader()
    
    # Load data
    df_2008 = loader.load_beneficiary_summary(2008)
    df_2009 = loader.load_beneficiary_summary(2009)
    
    # Validate
    loader.validate_data(df_2008)
    loader.validate_data(df_2009)
    
    # Save for next step
    df_2008.to_csv('data/processed/cms_2008_raw.csv', index=False)
    df_2009.to_csv('data/processed/cms_2009_raw.csv', index=False)
    
    print("\n✅ Data loading complete!")