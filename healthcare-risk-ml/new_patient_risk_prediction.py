# new_patient_risk_prediction.py

"""
NEW PATIENT RISK PREDICTION WITH 3-WINDOW ROI PROJECTION
=========================================================

CORRECTED VERSION - TIME-SCALED INTERVENTION COSTS

For patients NEW to the platform (not in database):
1. Accept patient demographics, conditions, and cost data
2. Predict risk and tier for 30, 60, 90-day windows
3. Project costs and losses across 3 windows
4. Calculate ROI if intervention is taken within each window (TIME-SCALED)
5. Generate detailed patient risk report

KEY FIX: ROI calculations now use time-scaled intervention costs
         that match the prediction window (30/60/90 days)
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from datetime import datetime, timedelta
import json
import random
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

class NewPatientRiskPredictor:
    """Predict risk and ROI for new patients not in database"""
    
    def __init__(self, db_config=None, use_database=True):
        Path('data/output/new_patient_analysis').mkdir(parents=True, exist_ok=True)
        
        # Database configuration
        self.use_database = use_database
        self.conn = None
        if db_config is None:
            db_config = {
                'host': 'localhost',
                'port': 5433,
                'database': 'risk_predictionDB',
                'user': 'abdullah',
                'password': 'abdullah123'
            }
        self.db_config = db_config
        
        # TIME-SCALED intervention costs by window and tier
        # These are proportional costs for the specific time window, NOT annual costs
        # INCREASED to be more realistic and avoid 100% ROI cap
        self.intervention_costs = {
            '30_day': {
                1: 0,       # Tier 1: Monitor only
                2: 400,     # Tier 2: Higher cost for actual intervention
                3: 800,     # Tier 3: Moderate intervention costs
                4: 1200,    # Tier 4: Intensive intervention
                5: 1500     # Tier 5: Critical intervention
            },
            '60_day': {
                1: 0,       # Tier 1: Monitor only
                2: 700,     # Tier 2: Extended intervention
                3: 1400,    # Tier 3: Moderate intervention
                4: 2000,    # Tier 4: Intensive intervention
                5: 2800     # Tier 5: Critical intervention
            },
            '90_day': {
                1: 0,       # Tier 1: Monitor only
                2: 1000,    # Tier 2: Extended intervention
                3: 2000,    # Tier 3: Moderate intervention
                4: 3000,    # Tier 4: Intensive intervention
                5: 4000     # Tier 5: Critical intervention
            }
        }
        
        # Window-specific success rate ranges (controlled randomness for variability)
        # Higher tiers = higher success rates (better ROI when intervention is applied)
        self.success_rate_ranges = {
            '30_day': {
                1: (0.03, 0.08),    # Tier 1: 3% - 8% (minimal monitoring)
                2: (0.10, 0.20),    # Tier 2: 10% - 20% (low intervention)
                3: (0.25, 0.40),    # Tier 3: 25% - 40% (moderate intervention)
                4: (0.30, 0.50),    # Tier 4: 30% - 50% (intensive intervention)
                5: (0.40, 0.60)     # Tier 5: 40% - 60% (critical intervention)
            },
            '60_day': {
                1: (0.10, 0.25),    # Tier 1: 10% - 25% (extended monitoring)
                2: (0.25, 0.40),    # Tier 2: 25% - 40% (early intervention)
                3: (0.35, 0.55),    # Tier 3: 35% - 55% (moderate intervention)
                4: (0.45, 0.65),    # Tier 4: 45% - 65% (intensive intervention)
                5: (0.55, 0.75)     # Tier 5: 55% - 75% (critical intervention)
            },
            '90_day': {
                1: (0.20, 0.35),    # Tier 1: 20% - 35% (long-term monitoring)
                2: (0.35, 0.50),    # Tier 2: 35% - 50% (early intervention)
                3: (0.45, 0.60),    # Tier 3: 45% - 60% (moderate intervention)
                4: (0.60, 0.80),    # Tier 4: 60% - 80% (intensive intervention)
                5: (0.70, 0.90)     # Tier 5: 70% - 90% (critical intervention)
            }
        }
        
        # Fixed random seed for reproducible hackathon demonstrations
        # Ensures same patient gets same ROI across multiple runs
        random.seed(42)
        np.random.seed(42)
        
        # Tier labels and descriptions
        self.tier_labels = {
            1: 'Normal',
            2: 'Low Risk',
            3: 'Moderate Risk',
            4: 'High Risk',
            5: 'Critical Risk'
        }
        
        self.tier_descriptions = {
            1: 'Patient has low risk of readmission. Routine monitoring recommended.',
            2: 'Patient has low-to-moderate risk. Basic preventive measures suggested.',
            3: 'Patient has moderate risk. Proactive care coordination recommended.',
            4: 'Patient has high risk. Intensive case management recommended.',
            5: 'Patient has critical risk. Immediate intervention required.'
        }
        
        # Feature names (must match training data)
        self.feature_names = None
        self.models = {}
        self.load_models_and_config()
    
    def load_models_and_config(self):
        """Load pre-trained models and feature configuration"""
        
        print("\n" + "="*70, file=sys.stderr)
        print("LOADING TRAINED MODELS (CORRECTED TIME-SCALED VERSION)", file=sys.stderr)
        print("="*70 + "\n", file=sys.stderr)
        
        try:
            # Load trained models for each window
            for window in ['30_day', '60_day', '90_day']:
                model_path = f'models/best_{window}_model.pkl'
                model_data = joblib.load(model_path)
                self.models[window] = model_data['model']
                print(f"  ✅ Loaded {window.replace('_', '-').upper()} model: {model_data.get('name', 'Model')}", file=sys.stderr)
            
            # Load X_train to get feature names
            X_train = pd.read_csv('data/processed/X_train.csv')
            self.feature_names = X_train.columns.tolist()
            print(f"  ✅ Loaded {len(self.feature_names)} feature definitions", file=sys.stderr)
            print(f"  ✅ Using TIME-SCALED ROI calculation (0-100% realistic range)", file=sys.stderr)
            print(file=sys.stderr)
            
        except Exception as e:
            print(f"  ❌ Error loading models: {e}", file=sys.stderr)
            print("  Make sure models are trained by running src/04_model_train_test.py", file=sys.stderr)
            raise
    
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            print("✅ Connected to PostgreSQL", file=sys.stderr)
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}", file=sys.stderr)
            return False
    
    def close_db(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def assign_department(self, patient_features):
        """
        Assign patient to PRIMARY department based on conditions
        Handles MULTIPLE conditions by ranking priority
        """
        applicable_depts = []
        
        # Priority 1: CARDIAC
        if patient_features['has_chf'] or patient_features['has_ischemic_heart']:
            applicable_depts.append(('CARDIOLOGY', 1))
        
        # Priority 2: RENAL
        if patient_features['has_ckd'] or patient_features.get('has_esrd', 0):
            applicable_depts.append(('NEPHROLOGY', 2))
        
        # Priority 3: PULMONARY
        if patient_features['has_copd']:
            applicable_depts.append(('PULMONOLOGY', 4))
        
        # Priority 4: CANCER
        if patient_features['has_cancer']:
            applicable_depts.append(('ONCOLOGY', 6))
        
        # Priority 5: NEURO
        if patient_features['has_stroke'] or patient_features['has_alzheimers']:
            applicable_depts.append(('NEUROLOGY', 5))
        
        # Priority 6: ENDOCRINE
        if patient_features['has_diabetes']:
            applicable_depts.append(('ENDOCRINOLOGY', 3))
        
        # Priority 7: PSYCH
        if patient_features['has_depression']:
            applicable_depts.append(('PSYCHIATRY', 7))
        
        # Priority 8: RHEUM
        if patient_features['has_ra_oa']:
            applicable_depts.append(('RHEUMATOLOGY', 8))
        
        # Priority 9: ELDERLY
        if patient_features['age'] >= 75 or patient_features.get('frailty_score', 0) > 0.7:
            applicable_depts.append(('GERIATRICS', 9))
        
        # Assign to PRIMARY
        if applicable_depts:
            primary_dept, dept_id = applicable_depts[0]
            secondary = [d[0] for d in applicable_depts[1:]]
        else:
            primary_dept = 'GENERAL_MEDICINE'
            dept_id = 10
            secondary = []
        
        return dept_id, primary_dept, secondary
    
    def store_to_database(self, patient_id, patient_data, predictions, projection):
        """Store new patient data to database
        
        Args:
            patient_id: External patient identifier
            patient_data: Dict with original patient data (age, conditions, costs, etc)
            predictions: Dict with risk predictions for 30/60/90 days
            projection: Dict with ROI calculations for each window
        """
        
        try:
            cursor = self.conn.cursor()
            
            # Use patient_data which is a dict with all features
            if not isinstance(patient_data, dict):
                print(f"❌ Storage failed: patient_data must be dict, got {type(patient_data)}", file=sys.stderr)
                return None
            
            # Insert patient
            dept_id, dept_name, secondary_depts = self.assign_department(patient_data)
            gender = 'F' if patient_data.get('is_female', 0) == 1 else 'M'
            
            query = """
            INSERT INTO patients 
            (organization_id, department_id, external_id, age, gender, race,
             annual_cost, cost_percentile, is_high_cost, data_source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING patient_id
            """
            
            # Ensure all values are proper Python types (not numpy)
            org_id = 1
            age_val = int(patient_data['age'])
            annual_cost_val = float(patient_data['total_annual_cost'])
            cost_percentile_val = float(patient_data.get('cost_percentile', 0.25))
            is_high_cost_val = bool(int(patient_data.get('high_cost', 0)))
            
            cursor.execute(query, (
                org_id, dept_id, patient_id, age_val, gender,
                'Unknown', annual_cost_val,
                cost_percentile_val,
                is_high_cost_val, 'NEW_PATIENT'
            ))
            
            result = cursor.fetchone()
            patient_id_db = result['patient_id'] if isinstance(result, dict) else result[0]
            self.conn.commit()
            print(f"✅ Patient inserted (ID: {patient_id_db}) → {dept_name}", file=sys.stderr)
            if secondary_depts:
                print(f"   Secondary: {', '.join(secondary_depts)}", file=sys.stderr)
            
            # Insert predictions and ROI
            window_map = {'30_day': '30_day', '60_day': '60_day', '90_day': '90_day'}
            
            for window_key, window_data in predictions.items():
                query = """
                INSERT INTO predictions
                (patient_id, prediction_window, risk_score, risk_tier, 
                 model_version, prediction_date)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING prediction_id
                """
                
                risk_score_val = float(window_data['risk_score'])
                tier_val = int(window_data['tier'])
                
                cursor.execute(query, (
                    patient_id_db, window_map[window_key],
                    risk_score_val, tier_val,
                    'ExtraTreesClassifier v1.0', datetime.now()
                ))
                
                result = cursor.fetchone()
                prediction_id = result['prediction_id'] if isinstance(result, dict) else result[0]
                self.conn.commit()
                
                proj = projection[window_key]
                roi_pct = float(proj['roi_percent'])
                roi_category = 'EXCELLENT' if roi_pct > 75 else ('STRONG' if roi_pct >= 50 else ('POSITIVE' if roi_pct > 0 else 'NO_ROI'))
                
                proj_cost = float(proj['projected_cost'])
                roi_query = """
                INSERT INTO financial_projections
                (patient_id, prediction_id, prediction_window, risk_tier,
                 window_cost, addressable_cost, intervention_cost, success_rate,
                 expected_savings, net_benefit, roi_percent, roi_category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(roi_query, (
                    patient_id_db, prediction_id, window_map[window_key],
                    int(proj['tier']), proj_cost,
                    proj_cost * 0.60, float(proj['intervention_cost']),
                    float(proj['success_rate']), float(proj['expected_savings']),
                    float(proj['net_benefit']), roi_pct, roi_category
                ))
            
            self.conn.commit()
            print(f"✅ Stored 3 predictions and ROI to database", file=sys.stderr)
            
            # Update aggregation tables for organization and tier statistics
            print(f"📊 Updating organization & tier aggregation tables...", file=sys.stderr)
            self._update_aggregation_tables(cursor, patient_id_db)
            self.conn.commit()
            print(f"✅ Updated aggregation tables\n", file=sys.stderr)
            
            return patient_id_db
        
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Storage failed: {e}\n", file=sys.stderr)
            return None
    
    def _update_aggregation_tables(self, cursor, patient_id_db):
        """Update organization_predictions and tier_statistics tables"""
        
        # Get org and window info for this patient
        cursor.execute("""
            SELECT organization_id FROM patients WHERE patient_id = %s
        """, (patient_id_db,))
        org_id = cursor.fetchone()[0]
        
        # Update organization_predictions for all 3 windows
        for window in ['30_day', '60_day', '90_day']:
            cursor.execute(f"""
                INSERT INTO organization_predictions 
                (organization_id, prediction_window, total_patients, avg_risk_score,
                 tier_1_count, tier_2_count, tier_3_count, tier_4_count, tier_5_count,
                 avg_roi_percent, avg_intervention_cost, total_expected_savings, total_net_benefit)
                
                SELECT 
                    {org_id},
                    '{window}',
                    COUNT(DISTINCT p.patient_id),
                    AVG(pr.risk_score),
                    SUM(CASE WHEN pr.risk_tier = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN pr.risk_tier = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN pr.risk_tier = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN pr.risk_tier = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN pr.risk_tier = 5 THEN 1 ELSE 0 END),
                    AVG(fp.roi_percent),
                    AVG(fp.intervention_cost),
                    SUM(fp.expected_savings),
                    SUM(fp.net_benefit)
                FROM patients p
                JOIN predictions pr ON p.patient_id = pr.patient_id
                LEFT JOIN financial_projections fp ON pr.prediction_id = fp.prediction_id
                WHERE p.organization_id = {org_id} AND pr.prediction_window = '{window}'
                
                ON CONFLICT (organization_id, prediction_window) DO UPDATE SET
                    total_patients = EXCLUDED.total_patients,
                    avg_risk_score = EXCLUDED.avg_risk_score,
                    tier_1_count = EXCLUDED.tier_1_count,
                    tier_2_count = EXCLUDED.tier_2_count,
                    tier_3_count = EXCLUDED.tier_3_count,
                    tier_4_count = EXCLUDED.tier_4_count,
                    tier_5_count = EXCLUDED.tier_5_count,
                    avg_roi_percent = EXCLUDED.avg_roi_percent,
                    avg_intervention_cost = EXCLUDED.avg_intervention_cost,
                    total_expected_savings = EXCLUDED.total_expected_savings,
                    total_net_benefit = EXCLUDED.total_net_benefit,
                    updated_at = CURRENT_TIMESTAMP
            """)
        
        # Update tier_statistics for all tiers and windows
        for window in ['30_day', '60_day', '90_day']:
            for tier in [1, 2, 3, 4, 5]:
                risk_vals = {1: 3, 2: 15, 3: 35, 4: 60, 5: 85}
                cursor.execute(f"""
                    INSERT INTO tier_statistics
                    (organization_id, prediction_window, risk_tier, total_patients, avg_risk_score,
                     avg_cost, avg_roi_percent, success_rate, intervention_cost,
                     total_expected_savings, total_net_benefit, readmission_risk)
                    
                    SELECT 
                        {org_id},
                        '{window}',
                        {tier},
                        COUNT(DISTINCT p.patient_id),
                        AVG(pr.risk_score),
                        AVG(p.annual_cost),
                        AVG(fp.roi_percent),
                        AVG(fp.success_rate),
                        AVG(fp.intervention_cost),
                        SUM(fp.expected_savings),
                        SUM(fp.net_benefit),
                        {risk_vals[tier]}
                    FROM patients p
                    JOIN predictions pr ON p.patient_id = pr.patient_id
                    LEFT JOIN financial_projections fp ON pr.prediction_id = fp.prediction_id
                    WHERE p.organization_id = {org_id} AND pr.prediction_window = '{window}' 
                          AND pr.risk_tier = {tier}
                    
                    ON CONFLICT (organization_id, prediction_window, risk_tier) DO UPDATE SET
                        total_patients = EXCLUDED.total_patients,
                        avg_risk_score = EXCLUDED.avg_risk_score,
                        avg_cost = EXCLUDED.avg_cost,
                        avg_roi_percent = EXCLUDED.avg_roi_percent,
                        success_rate = EXCLUDED.success_rate,
                        intervention_cost = EXCLUDED.intervention_cost,
                        total_expected_savings = EXCLUDED.total_expected_savings,
                        total_net_benefit = EXCLUDED.total_net_benefit,
                        updated_at = CURRENT_TIMESTAMP
                """)

    def display_header(self):
        """Display welcome message"""
        print("\n" + "="*70)
        print("🏥 NEW PATIENT RISK PREDICTION & ROI ANALYSIS")
        print("   (TIME-SCALED INTERVENTION COSTS)")
        print("="*70)
        print("\nThis tool helps new patients understand their:")
        print("  • Risk level across 30, 60, and 90-day windows")
        print("  • Risk tier based on ML model predictions")
        print("  • Projected costs and intervention benefits (TIME-ALIGNED)")
        print("  • ROI if interventions are taken within each window")
        print("  • ROI shows realistic variation based on intervention effectiveness")
        print()
    
    def get_patient_input_interactive(self):
        """
        Get patient data interactively from user input
        Collects 15 raw input fields and engineers them into 27 features
        Returns: dict with engineered features
        """
        
        print("="*70)
        print("PATIENT INFORMATION ENTRY")
        print("="*70 + "\n")
        
        raw_patient_data = {}
        
        # Demographics
        print("👤 DEMOGRAPHICS")
        print("-"*70)
        
        # Age
        while True:
            try:
                age = int(input("  Age (years): "))
                if 0 < age < 120:
                    raw_patient_data['age'] = age
                    break
                else:
                    print("    ❌ Please enter age between 0 and 120")
            except ValueError:
                print("    ❌ Please enter a valid number")
        
        # Gender (1 for Male, 2 for Female)
        while True:
            gender_input = input("  Gender (M/F): ").strip().upper()
            if gender_input in ['M', 'F']:
                raw_patient_data['gender'] = 1 if gender_input == 'M' else 2
                break
            else:
                print("    ❌ Please enter M or F")
        
        # Race
        print("\n  Race:")
        print("    1 = White, 2 = Black, 3 = Other, 5 = Hispanic")
        while True:
            try:
                race = int(input("  Race code (1/2/3/5): "))
                if race in [1, 2, 3, 5]:
                    raw_patient_data['race'] = race
                    break
                else:
                    print("    ❌ Please enter 1, 2, 3, or 5")
            except ValueError:
                print("    ❌ Please enter a valid number")
        
        # Annual cost
        while True:
            try:
                annual_cost = float(input("\n  Annual Healthcare Cost ($): "))
                if annual_cost >= 0:
                    raw_patient_data['total_annual_cost'] = annual_cost
                    break
                else:
                    print("    ❌ Cost cannot be negative")
            except ValueError:
                print("    ❌ Please enter a valid number")
        
        # Chronic conditions (0 = No, 1 = Yes)
        print("\n🏥 CHRONIC CONDITIONS (Yes=1/No=0)")
        print("-"*70)
        
        conditions = [
            ('alzheimers', 'Alzheimer\'s Disease'),
            ('chf', 'Congestive Heart Failure'),
            ('ckd', 'Chronic Kidney Disease'),
            ('cancer', 'Cancer'),
            ('copd', 'COPD'),
            ('depression', 'Depression'),
            ('diabetes', 'Diabetes Mellitus'),
            ('ischemic_heart', 'Ischemic Heart Disease'),
            ('ra_oa', 'Rheumatoid Arthritis/Osteoarthritis'),
            ('stroke', 'Stroke/TIA')
        ]
        
        for condition_key, condition_name in conditions:
            while True:
                condition_input = input(f"  {condition_name} (0/1): ").strip()
                if condition_input in ['0', '1']:
                    raw_patient_data[f'has_{condition_key}'] = int(condition_input)
                    break
                else:
                    print("    ❌ Please enter 0 or 1")
        
        # Other key flags
        print("\n📋 ADDITIONAL FACTORS")
        print("-"*70)
        
        while True:
            esrd_input = input("  End-Stage Renal Disease (0/1): ").strip()
            if esrd_input in ['0', '1']:
                raw_patient_data['has_esrd'] = int(esrd_input)
                break
            else:
                print("    ❌ Please enter 0 or 1")
        
        # Utilization metrics
        print("\n📊 UTILIZATION METRICS (in past 12 months)")
        print("-"*70)
        
        utilization = [
            ('total_admissions', 'Hospital Admissions'),
            ('total_hospital_days', 'Hospital Days'),
            ('total_outpatient_visits', 'Outpatient Visits'),
        ]
        
        for util_key, util_name in utilization:
            while True:
                try:
                    value = float(input(f"  {util_name}: "))
                    if value >= 0:
                        raw_patient_data[util_key] = value
                        break
                    else:
                        print("    ❌ Value cannot be negative")
                except ValueError:
                    print("    ❌ Please enter a valid number")
        
        # Days since last admission
        while True:
            try:
                days = float(input(f"  Days Since Last Admission (or 999 if none): "))
                if days >= 0:
                    raw_patient_data['days_since_last_admission'] = days
                    break
                else:
                    print("    ❌ Value cannot be negative")
            except ValueError:
                print("    ❌ Please enter a valid number")
        
        print("\n✅ Patient data entered successfully\n")
        
        # Engineer the 27 features from raw input
        engineered_features = self.engineer_features(raw_patient_data)
        return engineered_features
    
    def engineer_features(self, raw_patient_data):
        """
        Transform 15 raw input fields into 27 engineered features
        
        Raw Inputs (15):
        - age, gender, race, total_annual_cost, has_esrd
        - has_alzheimers, has_chf, has_ckd, has_cancer, has_copd
        - has_depression, has_diabetes, has_ischemic_heart, has_ra_oa, has_stroke
        - total_admissions, total_hospital_days, days_since_last_admission, total_outpatient_visits
        
        Engineered Features (27):
        - Demographics (5): age, is_female, is_elderly, race_encoded, has_esrd
        - Chronic Conditions (10): has_alzheimers, has_chf, has_ckd, has_cancer, has_copd,
                                   has_depression, has_diabetes, has_ischemic_heart, has_ra_oa, has_stroke
        - Utilization (6): total_admissions_2008, total_hospital_days_2008, days_since_last_admission,
                          recent_admission, total_outpatient_visits_2008, high_outpatient_user
        - Costs (4): total_annual_cost, cost_percentile, high_cost, total_inpatient_cost
        - Derived (2): frailty_score, complexity_index
        """
        
        features = {}
        
        # ============================================
        # 1. DEMOGRAPHICS (5 features)
        # ============================================
        
        features['age'] = raw_patient_data.get('age', 65)
        features['is_female'] = 1 if raw_patient_data.get('gender', 1) == 2 else 0
        features['is_elderly'] = 1 if features['age'] >= 75 else 0
        
        # Race encoding: 1->0 (White), 2->1 (Black), 3->2 (Other), 5->3 (Hispanic)
        race_map = {1: 0, 2: 1, 3: 2, 5: 3}
        features['race_encoded'] = race_map.get(raw_patient_data.get('race', 1), 4)
        
        features['has_esrd'] = raw_patient_data.get('has_esrd', 0)
        
        # ============================================
        # 2. CHRONIC CONDITIONS (10 features)
        # ============================================
        
        condition_fields = [
            'has_alzheimers', 'has_chf', 'has_ckd', 'has_cancer', 'has_copd',
            'has_depression', 'has_diabetes', 'has_ischemic_heart', 'has_ra_oa', 'has_stroke'
        ]
        
        for condition in condition_fields:
            features[condition] = raw_patient_data.get(condition, 0)
        
        # Calculate total chronic condition count
        chronic_count = sum([raw_patient_data.get(cond, 0) for cond in condition_fields])
        
        # ============================================
        # 3. UTILIZATION (6 features)
        # ============================================
        
        features['total_admissions_2008'] = raw_patient_data.get('total_admissions', 0)
        features['total_hospital_days_2008'] = raw_patient_data.get('total_hospital_days', 0)
        features['days_since_last_admission'] = raw_patient_data.get('days_since_last_admission', 999)
        features['recent_admission'] = 1 if features['days_since_last_admission'] <= 90 else 0
        features['total_outpatient_visits_2008'] = raw_patient_data.get('total_outpatient_visits', 0)
        features['high_outpatient_user'] = 1 if features['total_outpatient_visits_2008'] > 10 else 0
        
        # ============================================
        # 4. COSTS (4 features)
        # ============================================
        
        features['total_annual_cost'] = raw_patient_data.get('total_annual_cost', 0)
        
        # Cost percentile: Estimate based on thresholds
        # Low: < $5k, Medium: $5-15k, High: $15-30k, Very High: > $30k
        annual_cost = features['total_annual_cost']
        if annual_cost < 5000:
            features['cost_percentile'] = 0.25
        elif annual_cost < 15000:
            features['cost_percentile'] = 0.50
        elif annual_cost < 30000:
            features['cost_percentile'] = 0.75
        else:
            features['cost_percentile'] = 0.90
        
        features['high_cost'] = 1 if features['cost_percentile'] > 0.75 else 0
        
        # Inpatient cost estimation: assume ~60% of total cost is inpatient
        features['total_inpatient_cost'] = features['total_annual_cost'] * 0.6
        
        # ============================================
        # 5. DERIVED (2 features)
        # ============================================
        
        # Frailty score: composite of age, chronic conditions, and cost
        age_component = max(0, min(1, (features['age'] - 65) / 30))
        frailty = (
            age_component * 0.4 +  # Age component (40%)
            (chronic_count / 10) * 0.4 +                       # Chronic condition component (40%)
            features['high_cost'] * 0.2                        # Cost component (20%)
        )
        features['frailty_score'] = frailty
        
        # Complexity index: chronic count * cost percentile
        features['complexity_index'] = chronic_count * features['cost_percentile']
        
        return features
    
    def get_patient_input_csv(self, csv_path):
        """
        Load patient data from CSV file
        CSV should have columns matching feature names
        """
        try:
            df = pd.read_csv(csv_path)
            print(f"\n✅ Loaded {len(df)} patient(s) from CSV\n")
            return [df.iloc[i].to_dict() for i in range(len(df))]
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            raise
    
    def prepare_features(self, patient_features):
        """
        Prepare patient data into feature vector matching training data
        
        Accepts either:
        1. Dict of engineered features (from engineer_features())
        2. DataFrame row
        
        Returns feature vector in correct order for model
        """
        
        if isinstance(patient_features, dict):
            # Already engineered features
            features_dict = patient_features
        else:
            # Convert DataFrame row or other format
            features_dict = patient_features.to_dict() if hasattr(patient_features, 'to_dict') else patient_features
        
        # Create feature vector with all features from training data
        features = {feature: 0.0 for feature in self.feature_names}
        
        # Update with provided data
        for key, value in features_dict.items():
            if key in features:
                features[key] = float(value)
        
        # Convert to DataFrame for alignment
        feature_df = pd.DataFrame([features])
        
        # Ensure feature order matches training data exactly
        feature_df = feature_df[self.feature_names]
        
        return feature_df.values[0]
    
    def predict_risk_windows(self, patient_features):
        """
        Predict risk score and tier for all 3 windows
        Returns: dict with predictions for each window
        """
        
        X_patient = patient_features.reshape(1, -1)
        results = {}
        
        for window in ['30_day', '60_day', '90_day']:
            model = self.models[window]
            
            # Get probability prediction (class 1)
            risk_score = model.predict_proba(X_patient)[0, 1]
            
            # Stratify to tier
            tier = self.stratify_to_tier(risk_score)
            
            results[window] = {
                'risk_score': risk_score,
                'tier': tier,
                'tier_label': self.tier_labels[tier],
                'description': self.tier_descriptions[tier]
            }
        
        return results
    
    def stratify_to_tier(self, risk_score):
        """Convert continuous risk score to 5-tier category"""
        if risk_score < 0.10:
            return 1
        elif risk_score < 0.25:
            return 2
        elif risk_score < 0.50:
            return 3
        elif risk_score < 0.75:
            return 4
        else:
            return 5
    
    def explain_prediction_with_shap(self, patient_features, predictions):
        """
        Calculate SHAP values to explain what's driving the risk predictions
        Returns top risk drivers for each prediction window
        """
        try:
            import shap
            
            X_patient = patient_features.reshape(1, -1)
            explanations = {}
            
            # Feature name mapping for user-friendly display
            feature_labels = {
                'age': 'Age',
                'is_female': 'Gender (Female)',
                'is_elderly': 'Elderly Status (75+)',
                'race_encoded': 'Race/Ethnicity',
                'has_esrd': 'End-Stage Renal Disease',
                'has_alzheimers': "Alzheimer's Disease",
                'has_chf': 'Congestive Heart Failure',
                'has_ckd': 'Chronic Kidney Disease',
                'has_cancer': 'Cancer',
                'has_copd': 'COPD',
                'has_depression': 'Depression',
                'has_diabetes': 'Diabetes',
                'has_ischemic_heart': 'Ischemic Heart Disease',
                'has_ra_oa': 'Arthritis (RA/OA)',
                'has_stroke': 'Stroke/TIA History',
                'total_admissions_2008': 'Hospital Admissions (past year)',
                'total_hospital_days_2008': 'Total Hospital Days',
                'days_since_last_admission': 'Days Since Last Admission',
                'recent_admission': 'Recent Admission (90 days)',
                'total_outpatient_visits_2008': 'Outpatient Visits',
                'high_outpatient_user': 'High Outpatient User (10+ visits)',
                'total_annual_cost': 'Annual Healthcare Cost',
                'cost_percentile': 'Cost Percentile',
                'high_cost': 'High Cost Patient',
                'total_inpatient_cost': 'Inpatient Costs',
                'frailty_score': 'Frailty Score',
                'complexity_index': 'Medical Complexity Index'
            }
            
            for window in ['30_day', '60_day', '90_day']:
                model = self.models[window]
                
                # Handle CalibratedClassifierCV - extract base estimator
                if hasattr(model, 'calibrated_classifiers_'):
                    # Get the first calibrated classifier's base estimator
                    base_model = model.calibrated_classifiers_[0].estimator
                else:
                    base_model = model
                
                # Create SHAP explainer for tree-based models
                explainer = shap.TreeExplainer(base_model)
                shap_values = explainer.shap_values(X_patient)
                
                # Get SHAP values for positive class (readmission risk)
                if isinstance(shap_values, list):
                    shap_values_positive = shap_values[1][0]  # Class 1 (positive)
                else:
                    shap_values_positive = shap_values[0]
                
                # Create list of feature impacts
                feature_impacts = []
                for i, feature_name in enumerate(self.feature_names):
                    impact_value = float(shap_values_positive[i])
                    feature_value = float(X_patient[0][i])
                    
                    # Only include features with non-zero values or significant impact
                    if abs(impact_value) > 0.001 or feature_value > 0:
                        feature_impacts.append({
                            'feature': feature_name,
                            'label': feature_labels.get(feature_name, feature_name),
                            'impact': impact_value,
                            'value': feature_value,
                            'abs_impact': abs(impact_value)
                        })
                
                # Sort by absolute impact (most influential first)
                feature_impacts.sort(key=lambda x: x['abs_impact'], reverse=True)
                
                # Get top 5 drivers
                top_drivers = feature_impacts[:5]
                
                # Calculate percentage contribution
                total_impact = sum([abs(f['impact']) for f in top_drivers])
                for driver in top_drivers:
                    if total_impact > 0:
                        driver['percentage'] = (abs(driver['impact']) / total_impact) * 100
                    else:
                        driver['percentage'] = 0
                    driver['direction'] = 'increases' if driver['impact'] > 0 else 'decreases'
                
                # Get base risk - handle different expected_value formats
                try:
                    if isinstance(explainer.expected_value, (list, np.ndarray)):
                        if len(explainer.expected_value) > 1:
                            base_risk = float(explainer.expected_value[1])  # Binary classification
                        else:
                            base_risk = float(explainer.expected_value[0])
                    else:
                        base_risk = float(explainer.expected_value)
                except (IndexError, TypeError):
                    base_risk = 0.0
                
                explanations[window] = {
                    'top_drivers': top_drivers,
                    'base_risk': base_risk,
                    'predicted_risk': predictions[window]['risk_score']
                }
            
            return explanations
            
        except ImportError:
            print("⚠ SHAP not available, skipping explanation", file=sys.stderr)
            return None
        except Exception as e:
            print(f"⚠ SHAP explanation failed: {e}", file=sys.stderr)
            return None
    
    def calculate_3_window_projection(self, patient_data, predictions):
        """
        Calculate projected costs and ROI across 3 windows
        using TIME-SCALED intervention costs and window-specific success rates
        
        CORRECTED Logic:
        - Uses TIME-SCALED intervention costs (30/60/90 day proportional)
        - Uses window-specific success rate ranges
        - ROI capped at 100% maximum (realistic constraint)
        - Costs and savings aligned to same time window
        """
        
        base_cost = patient_data['total_annual_cost']
        
        projection = {}
        
        windows_info = [
            ('30_day', 30, 'Month 1 (0-30 days)'),
            ('60_day', 60, 'Months 1-2 (0-60 days)'),
            ('90_day', 90, 'Months 1-3 (0-90 days)')
        ]
        
        for window_key, days, label in windows_info:
            window_data = predictions[window_key]
            tier = window_data['tier']
            risk_score = window_data['risk_score']
            
            # Project cost for the time window (proportional to annual cost)
            # NOW ALIGNED with time-scaled intervention costs
            projected_cost = (base_cost * days) / 365
            
            # Get controlled random success rate for this tier and window
            # Uses deterministic seed for reproducible hackathon results
            min_rate, max_rate = self.success_rate_ranges[window_key][tier]
            # Use window and tier as seed for reproducibility
            patient_seed = 42 + hash(window_key) % 100 + tier * 10
            random.seed(patient_seed)
            success_rate = random.uniform(min_rate, max_rate)
            
            # Get TIME-SCALED intervention cost for this window and tier
            intervention_cost = self.intervention_costs[window_key][tier]
            
            # Apply exact ROI formula as specified
            expected_savings = projected_cost * success_rate
            net_benefit = expected_savings - intervention_cost
            
            # Calculate ROI with 100% cap (realistic constraint)
            if intervention_cost > 0:
                roi_percent = (net_benefit / intervention_cost) * 100
                roi_percent = min(max(roi_percent, 0.0), 100.0)  # Cap between 0-100%
            else:
                roi_percent = 0
            
            projection[window_key] = {
                'label': label,
                'days': days,
                'risk_score': risk_score,
                'tier': tier,
                'tier_label': window_data['tier_label'],
                'projected_cost': projected_cost,
                'intervention_cost': intervention_cost,
                'success_rate': success_rate,
                'success_rate_range': f"{min_rate*100:.0f}%-{max_rate*100:.0f}%",
                'expected_savings': expected_savings,
                'net_benefit': net_benefit,
                'roi_percent': roi_percent
            }
        
        return projection
    
    def calculate_overall_roi(self, patient_data, projection):
        """
        Calculate overall ROI across all 3 windows combined
        Uses evaluation/02_roi_calculation.py logic
        """
        
        total_intervention = 0
        total_savings = 0
        total_net_benefit = 0
        
        for window_key in ['30_day', '60_day', '90_day']:
            proj = projection[window_key]
            total_intervention += proj['intervention_cost']
            total_savings += proj['expected_savings']
            total_net_benefit += proj['net_benefit']
        
        # Calculate overall ROI
        if total_intervention > 0:
            overall_roi_percent = (total_net_benefit / total_intervention) * 100
            overall_roi_percent = min(max(overall_roi_percent, 0.0), 100.0)  # Cap between 0-100%
        else:
            overall_roi_percent = 0
        
        return {
            'total_intervention_cost': total_intervention,
            'total_expected_savings': total_savings,
            'total_net_benefit': total_net_benefit,
            'overall_roi_percent': overall_roi_percent,
            'avg_annual_cost': patient_data.get('total_annual_cost', 0)
        }
    
    def display_patient_report(self, patient_data, predictions, projection):
        """Display comprehensive patient risk report"""
        
        print("\n" + "="*70)
        print("PATIENT RISK ASSESSMENT REPORT (TIME-SCALED ROI)")
        print("="*70)
        print(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}\n")
        
        # Patient summary
        print("PATIENT SUMMARY")
        print("-"*70)
        print(f"  Age: {patient_data.get('age', 'N/A')} years")
        print(f"  Annual Healthcare Cost: ${patient_data.get('total_annual_cost', 0):,.2f}")
        print()
        
        # Risk assessment across windows
        print("RISK ASSESSMENT - ALL WINDOWS")
        print("-"*70)
        
        for window_key, (window_data, proj_data) in zip(
            ['30_day', '60_day', '90_day'],
            zip(
                [predictions['30_day'], predictions['60_day'], predictions['90_day']],
                [projection['30_day'], projection['60_day'], projection['90_day']]
            )
        ):
            window_label = proj_data['label']
            tier = proj_data['tier']
            risk_score = proj_data['risk_score']
            tier_label = proj_data['tier_label']
            
            print(f"\n  📅 {window_label.upper()}")
            print(f"     Risk Score: {risk_score:.4f}")
            print(f"     Risk Tier: {tier}/5 - {tier_label}")
            print(f"     Status: {window_data['description']}")
        
        print()
        
        # Detailed window projections
        print("DETAILED WINDOW PROJECTIONS & ROI ANALYSIS (TIME-SCALED)")
        print("="*70)
        
        for window_key in ['30_day', '60_day', '90_day']:
            proj = projection[window_key]
            
            print(f"\n📊 {proj['label'].upper()}")
            print("-"*70)
            print(f"  Risk Tier: {proj['tier']}/5 - {proj['tier_label']}")
            print(f"  Risk Score: {proj['risk_score']:.4f}")
            print()
            print(f"  💰 Financial Projection ({proj['days']} days):")
            print(f"     Projected Cost: ${proj['projected_cost']:,.2f}")
            print(f"     Success Rate: {proj['success_rate']*100:.1f}% (Range: {proj['success_rate_range']})")
            print()
            print(f"  🏥 Intervention Impact (Tier {proj['tier']} Program - {proj['days']}-day):")
            print(f"     Intervention Cost: ${proj['intervention_cost']:,.2f} ({proj['days']}-day scaled)")
            print(f"     Expected Savings: ${proj['expected_savings']:,.2f}")
            print(f"     Net Benefit: ${proj['net_benefit']:,.2f}")
            print(f"     ROI: {proj['roi_percent']:.1f}%")
            
            if proj['roi_percent'] > 0:
                print(f"     ✅ POSITIVE ROI - Intervention is financially beneficial")
            else:
                print(f"     ⚠️  NEGATIVE ROI - Monitor before intervention")
        
        
        print("\n" + "="*70)
        print("OVERALL PATIENT ROI ANALYSIS (3-WINDOW COMBINED)")
        print("="*70)
        
        # Calculate overall ROI
        overall_stats = self.calculate_overall_roi(patient_data, projection)
        
        print(f"\n  💰 Combined 90-Day Intervention Plan:")
        print(f"     Total Intervention Cost: ${overall_stats['total_intervention_cost']:,.2f}")
        print(f"     Total Expected Savings: ${overall_stats['total_expected_savings']:,.2f}")
        print(f"     Total Net Benefit: ${overall_stats['total_net_benefit']:,.2f}")
        print(f"     Overall ROI: {overall_stats['overall_roi_percent']:.1f}%")
        print()
        
        if overall_stats['overall_roi_percent'] >= 75:
            print(f"  ✅ EXCELLENT ROI - Strong return on intervention investment")
        elif overall_stats['overall_roi_percent'] >= 50:
            print(f"  ✅ STRONG ROI - Good return on intervention investment")
        elif overall_stats['overall_roi_percent'] > 0:
            print(f"  ✅ POSITIVE ROI - Intervention is cost-beneficial")
        else:
            print(f"  ⚠️  NO ROI - Monitor effectiveness before intervention")
        
        print("\n" + "="*70)
        print("NOTE: All costs are TIME-SCALED to match prediction windows")
        print("      ROI varies by intervention cost and success rate")
        print("="*70)
    
    def save_patient_report(self, patient_id, patient_data, predictions, projection):
        """Save detailed patient report to file"""
        
        report = []
        report.append("="*70)
        report.append("NEW PATIENT RISK ASSESSMENT REPORT (TIME-SCALED ROI)")
        report.append("="*70)
        report.append(f"Patient ID: {patient_id}")
        report.append(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}")
        report.append("")
        
        # Patient Summary
        report.append("PATIENT PROFILE")
        report.append("-"*70)
        report.append(f"Age: {patient_data.get('age', 'N/A')} years")
        report.append(f"Annual Healthcare Cost: ${patient_data.get('total_annual_cost', 0):,.2f}")
        report.append("")
        
        # Chronic conditions
        conditions = [k for k, v in patient_data.items() if k.startswith('condition_') and v == 1]
        if conditions:
            report.append("Documented Conditions:")
            for cond in conditions:
                cond_name = cond.replace('condition_', '').replace('_', ' ').title()
                report.append(f"  • {cond_name}")
            report.append("")
        
        # Risk Summary
        report.append("RISK SUMMARY - 3 WINDOW ANALYSIS (TIME-SCALED)")
        report.append("-"*70)
        
        for window_key in ['30_day', '60_day', '90_day']:
            proj = projection[window_key]
            report.append(f"\n{proj['label'].upper()}")
            report.append(f"  Risk Score: {proj['risk_score']:.4f}")
            report.append(f"  Risk Tier: {proj['tier']}/5 - {proj['tier_label']}")
            report.append(f"  Projected Cost: ${proj['projected_cost']:,.2f} ({proj['days']}-day)")
            report.append(f"  Intervention Cost: ${proj['intervention_cost']:,.2f} ({proj['days']}-day scaled)")
            report.append(f"  Expected Savings: ${proj['expected_savings']:,.2f}")
            report.append(f"  Net Benefit: ${proj['net_benefit']:,.2f}")
            report.append(f"  ROI: {proj['roi_percent']:.1f}% (capped at 100%)")
        
        report.append("\n" + "="*70)
        report.append("CLINICAL RECOMMENDATIONS")
        report.append("-"*70)
        
        # Get highest risk tier
        max_tier = max(proj['tier'] for proj in projection.values())
        recommendation = self.tier_descriptions[max_tier]
        report.append(f"\nBased on risk assessment: {recommendation}")
        report.append("")
        
        # Intervention recommendation
        if max_tier >= 4:
            report.append("⚠️  RECOMMENDED ACTION: Schedule immediate consultation")
        elif max_tier == 3:
            report.append("⚠️  RECOMMENDED ACTION: Schedule consultation within 1 week")
        else:
            report.append("✅ RECOMMENDED ACTION: Continue routine care, follow-up in 3 months")
        
        report.append("\n" + "="*70)
        report.append("METHODOLOGY NOTES")
        report.append("-"*70)
        report.append("• All intervention costs are TIME-SCALED to match prediction windows")
        report.append("• ROI calculations use realistic constraints (100% maximum)")
        report.append("• Success rates vary by tier and window duration")
        report.append("• Costs aligned: X-day projected cost vs X-day intervention cost")
        report.append("="*70)
        
        report_text = '\n'.join(report)
        
        # Save to file
        output_file = f'data/output/new_patient_analysis/patient_{patient_id}_report.txt'
        with open(output_file, 'w') as f:
            f.write(report_text)
        
        print(f"✅ Report saved to: {output_file}\n")
        
        return report_text
    
    def save_patient_data_json(self, patient_id, patient_data, predictions, projection):
        """Save structured data as JSON for integration with other systems"""
        
        output = {
            'patient_id': str(patient_id),
            'timestamp': datetime.now().isoformat(),
            'methodology': 'time_scaled_roi',
            'roi_cap': 100.0,
            'patient_profile': patient_data,
            'risk_predictions': {
                window: {
                    'risk_score': float(pred['risk_score']),
                    'tier': int(pred['tier']),
                    'tier_label': pred['tier_label']
                }
                for window, pred in predictions.items()
            },
            'financial_projection': {
                window: {
                    'days': proj['days'],
                    'projected_cost': float(proj['projected_cost']),
                    'intervention_cost': float(proj['intervention_cost']),
                    'intervention_cost_type': f"{proj['days']}-day time-scaled",
                    'success_rate': float(proj['success_rate']),
                    'expected_savings': float(proj['expected_savings']),
                    'net_benefit': float(proj['net_benefit']),
                    'roi_percent': float(proj['roi_percent'])
                }
                for window, proj in projection.items()
            }
        }
        
        output_file = f'data/output/new_patient_analysis/patient_{patient_id}_data.json'
        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"✅ Data saved to: {output_file}\n")
    
    def run_new_patient_analysis(self, patient_data=None, patient_id='NEW_001'):
        """
        Execute complete analysis for new patient
        
        Args:
            patient_data: dict with patient features (if None, prompts user)
            patient_id: identifier for patient
        """
        
        # Get patient data
        if patient_data is None:
            patient_data = self.get_patient_input_interactive()
        
        # Prepare features
        patient_features = self.prepare_features(patient_data)
        
        # Predict risk across windows
        predictions = self.predict_risk_windows(patient_features)
        
        # Calculate 3-window projection (TIME-SCALED)
        projection = self.calculate_3_window_projection(patient_data, predictions)
        
        # Display report
        self.display_patient_report(patient_data, predictions, projection)
        
        # Save results to files
        self.save_patient_report(patient_id, patient_data, predictions, projection)
        self.save_patient_data_json(patient_id, patient_data, predictions, projection)
        
        # Store to database if enabled
        patient_id_db = None
        if self.use_database:
            print("\n" + "="*70)
            print("STORING TO DATABASE...")
            print("="*70 + "\n")
            if self.connect_db():
                patient_id_db = self.store_to_database(patient_id, patient_data, predictions, projection)
                self.close_db()
        
        return {
            'patient_id': patient_id,
            'patient_id_db': patient_id_db,
            'patient_data': patient_data,
            'predictions': predictions,
            'projection': projection
        }


# ============================================
# MAIN EXECUTION
# ============================================

def main():
    """Main entry point - supports interactive, CSV, and JSON modes"""
    
    import sys
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='New Patient Risk Prediction')
    parser.add_argument('--json-input', type=str, help='JSON string with patient data')
    parser.add_argument('--patient-id', type=str, default=None, help='Patient identifier')
    parser.add_argument('--save-to-db', type=str, default='true', help='Save to database (true/false)')
    
    args = parser.parse_args()
    
    # JSON INPUT MODE (for backend integration)
    if args.json_input:
        try:
            predictor = NewPatientRiskPredictor(use_database=(args.save_to_db.lower() == 'true'))
            
            # Parse JSON input
            patient_data = json.loads(args.json_input)
            patient_id = args.patient_id or f'JSON_{int(datetime.now().timestamp())}'
            
            # Engineer features from raw input
            engineered_features = predictor.engineer_features(patient_data)
            
            # Run prediction (without display)
            patient_features = predictor.prepare_features(engineered_features)
            predictions = predictor.predict_risk_windows(patient_features)
            projection = predictor.calculate_3_window_projection(engineered_features, predictions)
            
            # Calculate SHAP explanations
            explanations = predictor.explain_prediction_with_shap(patient_features, predictions)
            
            # Store to database if enabled
            patient_id_db = None
            if predictor.use_database:
                if predictor.connect_db():
                    patient_id_db = predictor.store_to_database(patient_id, engineered_features, predictions, projection)
                    predictor.close_db()
            
            # Output JSON to stdout for Node.js to capture
            output = {
                'success': True,
                'patient_id': patient_id,
                'patient_id_db': patient_id_db,
                'patient_data': engineered_features,
                'predictions': predictions,
                'projection': projection,
                'explanations': explanations  # Add SHAP explanations
            }
            
            print(json.dumps(output))
            sys.exit(0)
            
        except Exception as e:
            error_output = {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
            print(json.dumps(error_output))
            sys.exit(1)
    
    # INTERACTIVE/CSV MODE (original functionality)
    predictor = NewPatientRiskPredictor()
    predictor.display_header()
    
    print("="*70)
    print("SELECT INPUT METHOD")
    print("="*70)
    print("1) Interactive terminal input")
    print("2) Load from CSV file")
    print()
    
    while True:
        choice = input("Choose option (1 or 2): ").strip()
        if choice in ['1', '2']:
            break
        print("❌ Please enter 1 or 2")
    
    print()
    
    if choice == '1':
        # Interactive input
        print("👤 Enter patient information\n")
        predictor.run_new_patient_analysis()
        
    else:
        # CSV input
        csv_path = input("Enter path to CSV file: ").strip()
        try:
            patients = predictor.get_patient_input_csv(csv_path)
            for idx, patient_data in enumerate(patients):
                patient_id = f'CSV_{idx+1:03d}'
                print(f"\nProcessing patient {idx+1}/{len(patients)}...")
                predictor.run_new_patient_analysis(patient_data, patient_id)
        except Exception as e:
            print(f"❌ Error processing CSV: {e}")
            return
    
    print("\n" + "="*70)
    print("✅ NEW PATIENT RISK ANALYSIS COMPLETE (TIME-SCALED ROI)!")
    print("="*70)
    print(f"Reports saved to: data/output/new_patient_analysis/\n")


if __name__ == "__main__":
    main()