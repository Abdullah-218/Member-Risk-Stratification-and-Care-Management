"""
Populate patient_features table with condition data from features_27.csv
This script loads the existing feature data that was used to assign departments.
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import sys

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'risk_predictionDB',
    'user': 'abdullah',
    'password': 'abdullah123'
}

def load_features_data():
    """Load features from CSV file"""
    print("📂 Loading features_27.csv...")
    features_df = pd.read_csv('/Users/abdullah/Dept Hackathon/healthcare-risk-ml/data/processed/features_27.csv')
    print(f"✅ Loaded {len(features_df):,} patient features")
    return features_df

def get_patient_mapping(conn):
    """Get mapping of external_id to patient_id from database"""
    print("🔍 Fetching patient ID mapping from database...")
    query = "SELECT patient_id, external_id FROM patients WHERE is_active = true"
    
    with conn.cursor() as cur:
        cur.execute(query)
        rows = cur.fetchall()
    
    mapping = {external_id: patient_id for patient_id, external_id in rows}
    print(f"✅ Found {len(mapping):,} active patients in database")
    return mapping

def populate_patient_features(conn, features_df, patient_mapping):
    """
    Insert patient features into patient_features table
    """
    print("💉 Populating patient_features table...")
    
    # Prepare data for insertion
    insert_data = []
    matched = 0
    skipped = 0
    
    for idx, row in features_df.iterrows():
        external_id = row.get('DESYNPUF_ID') or row.get('external_id')
        
        if external_id not in patient_mapping:
            skipped += 1
            continue
        
        patient_id = patient_mapping[external_id]
        matched += 1
        
        # Map feature columns to database columns
        insert_data.append((
            patient_id,
            # Demographics
            bool(row.get('is_elderly', 0)),
            bool(row.get('is_female', 0)),
            # Chronic conditions (0=no, 1=yes, 2=missing -> treat 2 as 0)
            1 if row.get('has_esrd', 0) == 1 else 0,
            1 if row.get('has_alzheimers', 0) == 1 else 0,
            1 if row.get('has_chf', 0) == 1 else 0,
            1 if row.get('has_ckd', 0) == 1 else 0,
            1 if row.get('has_cancer', 0) == 1 else 0,
            1 if row.get('has_copd', 0) == 1 else 0,
            1 if row.get('has_depression', 0) == 1 else 0,
            1 if row.get('has_diabetes', 0) == 1 else 0,
            1 if row.get('has_ischemic_heart', 0) == 1 else 0,
            1 if row.get('has_ra_oa', 0) == 1 else 0,
            1 if row.get('has_stroke', 0) == 1 else 0,
            # Utilization metrics
            float(row.get('total_admissions_2008', 0)),
            float(row.get('total_hospital_days_2008', 0)),
            float(row.get('days_since_last_admission', 0)),
            int(row.get('recent_admission', 0)),
            float(row.get('total_outpatient_visits_2008', 0)),
            int(row.get('high_outpatient_user', 0)),
            # Cost metrics
            float(row.get('total_annual_cost', 0)),
            float(row.get('cost_percentile', 0)),
            int(row.get('high_cost', 0)),
            float(row.get('total_inpatient_cost', 0)),
            # Derived risk metrics
            float(row.get('frailty_score', 0)),
            float(row.get('complexity_index', 0))
        ))
        
        if matched % 500 == 0:
            print(f"  Processed {matched:,} patients...")
    
    print(f"📊 Matched: {matched:,} | Skipped: {skipped:,}")
    
    # Bulk insert using execute_values for performance
    insert_query = """
        INSERT INTO patient_features (
            patient_id, is_elderly, is_female,
            has_esrd, has_alzheimers, has_chf, has_ckd, has_cancer, 
            has_copd, has_depression, has_diabetes, has_ischemic_heart, 
            has_ra_oa, has_stroke,
            total_admissions_2008, total_hospital_days_2008, 
            days_since_last_admission, recent_admission,
            total_outpatient_visits_2008, high_outpatient_user,
            total_annual_cost, cost_percentile, high_cost, 
            total_inpatient_cost, frailty_score, complexity_index
        ) VALUES %s
        ON CONFLICT (patient_id) DO UPDATE SET
            is_elderly = EXCLUDED.is_elderly,
            is_female = EXCLUDED.is_female,
            has_esrd = EXCLUDED.has_esrd,
            has_alzheimers = EXCLUDED.has_alzheimers,
            has_chf = EXCLUDED.has_chf,
            has_ckd = EXCLUDED.has_ckd,
            has_cancer = EXCLUDED.has_cancer,
            has_copd = EXCLUDED.has_copd,
            has_depression = EXCLUDED.has_depression,
            has_diabetes = EXCLUDED.has_diabetes,
            has_ischemic_heart = EXCLUDED.has_ischemic_heart,
            has_ra_oa = EXCLUDED.has_ra_oa,
            has_stroke = EXCLUDED.has_stroke,
            total_admissions_2008 = EXCLUDED.total_admissions_2008,
            total_hospital_days_2008 = EXCLUDED.total_hospital_days_2008,
            days_since_last_admission = EXCLUDED.days_since_last_admission,
            recent_admission = EXCLUDED.recent_admission,
            total_outpatient_visits_2008 = EXCLUDED.total_outpatient_visits_2008,
            high_outpatient_user = EXCLUDED.high_outpatient_user,
            total_annual_cost = EXCLUDED.total_annual_cost,
            cost_percentile = EXCLUDED.cost_percentile,
            high_cost = EXCLUDED.high_cost,
            total_inpatient_cost = EXCLUDED.total_inpatient_cost,
            frailty_score = EXCLUDED.frailty_score,
            complexity_index = EXCLUDED.complexity_index,
            updated_at = CURRENT_TIMESTAMP
    """
    
    with conn.cursor() as cur:
        execute_values(cur, insert_query, insert_data, page_size=1000)
    
    conn.commit()
    print(f"✅ Successfully inserted/updated {matched:,} patient features")

def verify_data(conn):
    """Verify that data was populated correctly"""
    print("\n🔍 Verifying data...")
    
    with conn.cursor() as cur:
        # Count total features
        cur.execute("SELECT COUNT(*) FROM patient_features")
        total = cur.fetchone()[0]
        
        # Count patients with at least one condition
        cur.execute("""
            SELECT COUNT(*) FROM patient_features
            WHERE has_diabetes > 0 OR has_chf > 0 OR has_ckd > 0 
               OR has_copd > 0 OR has_cancer > 0
        """)
        with_conditions = cur.fetchone()[0]
        
        # Sample conditions
        cur.execute("""
            SELECT 
                has_diabetes, has_chf, has_ckd, has_copd, has_cancer,
                has_stroke, has_alzheimers, has_depression
            FROM patient_features
            LIMIT 5
        """)
        samples = cur.fetchall()
    
    print(f"  Total features: {total:,}")
    print(f"  With conditions: {with_conditions:,} ({with_conditions/total*100:.1f}%)")
    print(f"\n  Sample data (first 5 patients):")
    print(f"  Diabetes | CHF | CKD | COPD | Cancer | Stroke | Alzheimers | Depression")
    for sample in samples:
        print(f"  {sample[0]:8} | {sample[1]:3} | {sample[2]:3} | {sample[3]:4} | {sample[4]:6} | {sample[5]:6} | {sample[6]:10} | {sample[7]:10}")

def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("POPULATE PATIENT CONDITIONS FROM FEATURES_27.CSV")
    print("="*70 + "\n")
    
    try:
        # Load features data
        features_df = load_features_data()
        
        # Connect to database
        print("\n🔌 Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to PostgreSQL")
        
        # Get patient mapping
        patient_mapping = get_patient_mapping(conn)
        
        # Populate features
        populate_patient_features(conn, features_df, patient_mapping)
        
        # Verify
        verify_data(conn)
        
        print("\n" + "="*70)
        print("✅ SUCCESSFULLY POPULATED PATIENT CONDITIONS!")
        print("="*70 + "\n")
        
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
