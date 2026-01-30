"""
Reassign patient departments based on their actual chronic conditions
Uses the same logic from database_setup.py but with corrected condition data
"""

import psycopg2
import sys

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'risk_predictionDB',
    'user': 'abdullah',
    'password': 'abdullah123'
}

def assign_department_based_on_conditions(conditions):
    """
    Assign department based on chronic conditions using IF-THEN hierarchy
    Same logic as database_setup.py assign_department_option_c()
    
    Args:
        conditions: dict with condition flags (has_diabetes, has_chf, etc.)
    
    Returns:
        department_code: string (e.g., 'CARDIOLOGY', 'NEPHROLOGY')
    """
    # Extract condition flags
    has_chf = conditions.get('has_chf', 0) > 0
    has_ischemic_heart = conditions.get('has_ischemic_heart', 0) > 0
    has_ckd = conditions.get('has_ckd', 0) > 0
    has_esrd = conditions.get('has_esrd', 0) > 0
    has_diabetes = conditions.get('has_diabetes', 0) > 0
    has_copd = conditions.get('has_copd', 0) > 0
    has_stroke = conditions.get('has_stroke', 0) > 0
    has_alzheimers = conditions.get('has_alzheimers', 0) > 0
    has_cancer = conditions.get('has_cancer', 0) > 0
    has_depression = conditions.get('has_depression', 0) > 0
    has_ra_oa = conditions.get('has_ra_oa', 0) > 0
    
    # Priority-based assignment (IF-THEN hierarchy)
    if has_chf or has_ischemic_heart:
        return 'CARD'  # Cardiology
    elif has_ckd or has_esrd:
        return 'NEPH'  # Nephrology
    elif has_diabetes:
        return 'ENDO'  # Endocrinology
    elif has_copd:
        return 'PULM'  # Pulmonology
    elif has_stroke or has_alzheimers:
        return 'NEUR'  # Neurology
    elif has_cancer:
        return 'ONCO'  # Oncology
    elif has_depression:
        return 'PSYCH'  # Psychiatry
    elif has_ra_oa:
        return 'NEUR'  # Use NEUR for arthritis (no RHEUM department)
    else:
        return 'NEUR'  # Default to Neurology (no GEN_MED department)

def get_department_id(conn, dept_code):
    """Get department_id from department_code"""
    query = "SELECT department_id FROM departments WHERE department_code = %s"
    with conn.cursor() as cur:
        cur.execute(query, (dept_code,))
        result = cur.fetchone()
        return result[0] if result else None

def reassign_all_departments(conn):
    """Reassign departments for all patients based on their conditions"""
    print("🔄 Fetching all patients with conditions...")
    
    # Fetch all patients with their conditions
    query = """
        SELECT 
            p.patient_id,
            pf.has_diabetes,
            pf.has_chf,
            pf.has_ckd,
            pf.has_copd,
            pf.has_cancer,
            pf.has_ischemic_heart,
            pf.has_stroke,
            pf.has_alzheimers,
            pf.has_depression,
            pf.has_esrd,
            pf.has_ra_oa
        FROM patients p
        LEFT JOIN patient_features pf ON p.patient_id = pf.patient_id
        WHERE p.is_active = true
    """
    
    with conn.cursor() as cur:
        cur.execute(query)
        patients = cur.fetchall()
    
    print(f"✅ Found {len(patients):,} patients")
    
    # Count department assignments
    dept_counts = {}
    updates = []
    
    print("\n📊 Assigning departments based on conditions...")
    
    for patient in patients:
        patient_id = patient[0]
        
        # Create conditions dict
        conditions = {
            'has_diabetes': patient[1] or 0,
            'has_chf': patient[2] or 0,
            'has_ckd': patient[3] or 0,
            'has_copd': patient[4] or 0,
            'has_cancer': patient[5] or 0,
            'has_ischemic_heart': patient[6] or 0,
            'has_stroke': patient[7] or 0,
            'has_alzheimers': patient[8] or 0,
            'has_depression': patient[9] or 0,
            'has_esrd': patient[10] or 0,
            'has_ra_oa': patient[11] or 0,
        }
        
        # Assign department
        dept_code = assign_department_based_on_conditions(conditions)
        dept_id = get_department_id(conn, dept_code)
        
        if dept_id:
            updates.append((dept_id, patient_id))
            dept_counts[dept_code] = dept_counts.get(dept_code, 0) + 1
        else:
            print(f"⚠️  Warning: Department code '{dept_code}' not found in database")
    
    # Display distribution
    print("\n📈 Department Distribution:")
    for dept, count in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {dept:20s}: {count:4d} patients ({count/len(patients)*100:.1f}%)")
    
    # Bulk update
    print(f"\n💾 Updating {len(updates):,} patient department assignments...")
    
    update_query = "UPDATE patients SET department_id = %s WHERE patient_id = %s"
    
    with conn.cursor() as cur:
        cur.executemany(update_query, updates)
    
    conn.commit()
    print("✅ Successfully updated all department assignments!")

def verify_assignments(conn):
    """Verify department assignments match conditions"""
    print("\n🔍 Verifying assignments...")
    
    query = """
        SELECT 
            d.department_code,
            COUNT(*) as patient_count,
            COUNT(CASE WHEN pf.has_chf > 0 OR pf.has_ischemic_heart > 0 THEN 1 END) as cardio_conditions,
            COUNT(CASE WHEN pf.has_ckd > 0 OR pf.has_esrd > 0 THEN 1 END) as nephro_conditions,
            COUNT(CASE WHEN pf.has_diabetes > 0 THEN 1 END) as diabetes_conditions
        FROM patients p
        JOIN departments d ON p.department_id = d.department_id
        LEFT JOIN patient_features pf ON p.patient_id = pf.patient_id
        WHERE p.is_active = true
        GROUP BY d.department_code
        ORDER BY patient_count DESC
    """
    
    with conn.cursor() as cur:
        cur.execute(query)
        results = cur.fetchall()
    
    print("\n  Department        | Patients | Cardio | Nephro | Diabetes")
    print("  " + "-" * 65)
    for row in results:
        print(f"  {row[0]:18s}| {row[1]:8d} | {row[2]:6d} | {row[3]:6d} | {row[4]:8d}")

def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("REASSIGN PATIENT DEPARTMENTS BASED ON CONDITIONS")
    print("="*70 + "\n")
    
    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to PostgreSQL")
        
        # Reassign departments
        reassign_all_departments(conn)
        
        # Verify
        verify_assignments(conn)
        
        print("\n" + "="*70)
        print("✅ DEPARTMENT REASSIGNMENT COMPLETE!")
        print("="*70 + "\n")
        
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
