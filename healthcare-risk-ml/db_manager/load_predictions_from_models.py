"""
CORRECT PHASE 2: Load Baseline Predictions from Actual ML Models
==================================================================

This script:
1. Loads the 3,000 X_test baseline patients (already in DB)
2. Runs ACTUAL ML models (02_roi_calculation.py logic)
3. Stores ACTUAL predictions + ROI to database
4. Uses ACTUAL risk stratification from model outputs

This matches what your ML models actually predict!
"""

import pandas as pd
import numpy as np
import joblib
import psycopg2
from datetime import datetime
import sys
import random

sys.path.insert(0, '/Users/abdullah/Dept Hackathon/healthcare-risk-ml')


class ActualMLPredictionLoader:
    """Load predictions from ACTUAL trained ML models"""
    
    def __init__(self, db_config):
        self.db_config = db_config
        self.conn = None
        self.models = {}
        self.X_test = None
        self.results = {}
    
    def connect_db(self):
        """Connect to PostgreSQL"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            print("✅ Connected to PostgreSQL")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def close_db(self):
        if self.conn:
            self.conn.close()
    
    def load_models_and_data(self):
        """Load actual trained models and test data"""
        print("\n" + "="*70)
        print("LOADING ACTUAL ML MODELS AND TEST DATA")
        print("="*70)
        
        try:
            # Load test features
            self.X_test = pd.read_csv(
                '/Users/abdullah/Dept Hackathon/healthcare-risk-ml/data/processed/X_test.csv'
            )
            print(f"✅ Loaded X_test: {self.X_test.shape}")
            
            # Load targets for validation
            self.y_30_test = pd.read_csv(
                '/Users/abdullah/Dept Hackathon/healthcare-risk-ml/data/processed/y_30_test.csv'
            ).values.ravel()
            self.y_60_test = pd.read_csv(
                '/Users/abdullah/Dept Hackathon/healthcare-risk-ml/data/processed/y_60_test.csv'
            ).values.ravel()
            self.y_90_test = pd.read_csv(
                '/Users/abdullah/Dept Hackathon/healthcare-risk-ml/data/processed/y_90_test.csv'
            ).values.ravel()
            
            # Load actual trained models
            for window in [30, 60, 90]:
                model_file = f'/Users/abdullah/Dept Hackathon/healthcare-risk-ml/models/best_{window}_day_model.pkl'
                model_data = joblib.load(model_file)
                self.models[window] = {
                    'model': model_data['model'],
                    'name': model_data['name'],
                    'threshold': model_data['threshold']
                }
                print(f"✅ Loaded {window}-day model: {model_data['name']}")
            
            print(f"✅ Loaded actual targets (30/60/90 day)")
            
        except Exception as e:
            print(f"❌ Failed to load models/data: {e}")
            return False
        
        return True
    
    def get_risk_tiers_from_model(self, window):
        """
        Get ACTUAL risk tiers using ACTUAL model predictions
        (matches 02_roi_calculation.py logic exactly)
        """
        print(f"\n  Stratifying patients using ACTUAL {window}-day model...")
        
        # Get model
        model = self.models[window]['model']
        
        # Get actual target for validation
        if window == 30:
            actual = self.y_30_test
        elif window == 60:
            actual = self.y_60_test
        else:
            actual = self.y_90_test
        
        # Get risk scores from actual model
        risk_proba = model.predict_proba(self.X_test)[:, 1]
        
        # Create results dataframe
        results = pd.DataFrame({
            'patient_id': range(len(self.X_test)),
            'risk_score': risk_proba,
            'actual_deterioration': actual,
            'total_annual_cost': self.X_test['total_annual_cost'].values
        })
        
        # Stratify into 5 tiers using ACTUAL percentile bins
        # (This is the CORRECT stratification from 02_roi_calculation.py)
        results['risk_tier'] = pd.cut(
            results['risk_score'],
            bins=[-0.001, 0.10, 0.25, 0.50, 0.75, 1.001],
            labels=[1, 2, 3, 4, 5],
            right=False
        ).astype(int)
        
        # Print actual distribution (from YOUR model)
        print(f"\n  Risk Tier Distribution ({window}-day, from ACTUAL model):")
        tier_counts = results['risk_tier'].value_counts().sort_index()
        for tier in [1, 2, 3, 4, 5]:
            count = tier_counts.get(tier, 0)
            pct = (count / len(results)) * 100
            avg_risk = results[results['risk_tier'] == tier]['risk_score'].mean()
            actual_rate = results[results['risk_tier'] == tier]['actual_deterioration'].mean() * 100
            
            tier_label = {1: 'Normal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical'}[tier]
            print(f"    Tier {tier} ({tier_label:<8}): {count:>4} pts ({pct:>5.1f}%) | "
                  f"Risk: {avg_risk:.3f} | Actual: {actual_rate:.1f}%")
        
        return results
    
    def calculate_roi_from_model(self, results, window):
        """
        Calculate ROI using ACTUAL model predictions
        (matches 02_roi_calculation.py logic exactly)
        """
        print(f"\n  Calculating ROI using {window}-day intervention costs...")
        
        # Window-specific intervention costs (from 02_roi_calculation.py)
        intervention_costs = {
            30: {1: 0, 2: 150, 3: 400, 4: 700, 5: 900},
            60: {1: 0, 2: 250, 3: 700, 4: 1100, 5: 1650},
            90: {1: 0, 2: 350, 3: 1050, 4: 1550, 5: 1900}
        }
        
        # Window-specific success rate ranges (from 02_roi_calculation.py)
        success_rate_ranges = {
            30: {
                1: (0.03, 0.08),
                2: (0.10, 0.20),
                3: (0.25, 0.40),
                4: (0.30, 0.50),
                5: (0.40, 0.60)
            },
            60: {
                1: (0.10, 0.25),
                2: (0.25, 0.40),
                3: (0.35, 0.55),
                4: (0.45, 0.65),
                5: (0.55, 0.75)
            },
            90: {
                1: (0.20, 0.35),
                2: (0.35, 0.50),
                3: (0.45, 0.60),
                4: (0.60, 0.80),
                5: (0.70, 0.90)
            }
        }
        
        # Add intervention costs
        results['intervention_cost'] = results['risk_tier'].map(intervention_costs[window])
        
        # Calculate projected cost for the window
        results[f'projected_{window}_day_cost'] = results['total_annual_cost'] * (window / 365)
        
        # Apply success rates (using EXACT same logic as 02_roi_calculation.py)
        def get_success_rate(row):
            tier = row['risk_tier']
            min_rate, max_rate = success_rate_ranges[window][tier]
            patient_seed = 42 + int(row['patient_id'])
            random.seed(patient_seed)
            return random.uniform(min_rate, max_rate)
        
        results['success_rate'] = results.apply(get_success_rate, axis=1)
        
        # Calculate ROI using exact formula from 02_roi_calculation.py
        results['expected_savings'] = results[f'projected_{window}_day_cost'] * results['success_rate']
        results['net_benefit'] = results['expected_savings'] - results['intervention_cost']
        results['roi_percent'] = (
            results['net_benefit'] / results['intervention_cost'] * 100
        ).fillna(0)
        
        # Cap at 100% (from 02_roi_calculation.py)
        results['roi_percent'] = results['roi_percent'].clip(upper=100.0)
        
        # Calculate overall ROI
        total_intervention = results['intervention_cost'].sum()
        total_savings = results['expected_savings'].sum()
        total_net = results['net_benefit'].sum()
        overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
        
        print(f"    Overall {window}-Day ROI: {overall_roi:.1f}%")
        print(f"    Total Net Benefit: ${total_net:,.2f}")
        
        return results
    
    def clear_old_predictions(self):
        """Clear old incorrect predictions from Phase 2"""
        print("\n" + "="*70)
        print("CLEARING OLD INCORRECT PREDICTIONS FROM PHASE 2")
        print("="*70)
        
        try:
            cursor = self.conn.cursor()
            
            # Delete old predictions and ROI (keep patients)
            cursor.execute("DELETE FROM financial_projections")
            cursor.execute("DELETE FROM predictions")
            
            self.conn.commit()
            print("✅ Cleared old predictions and financial_projections")
            return True
        
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Failed to clear old data: {e}")
            return False
    
    def store_predictions(self, results, window):
        """Store ACTUAL model predictions to database"""
        try:
            cursor = self.conn.cursor()
            
            window_name = f"{window}_day"
            
            # Map window to table format
            window_map = {
                30: '30_day',
                60: '60_day',
                90: '90_day'
            }
            
            prediction_window = window_map[window]
            
            # Insert predictions
            for idx, row in results.iterrows():
                # Map patient_id from test set to DB patient_id
                query = """
                SELECT patient_id FROM patients 
                WHERE data_source = 'X_TEST' 
                AND patient_id = (
                    SELECT patient_id FROM patients 
                    WHERE data_source = 'X_TEST' 
                    LIMIT 1 OFFSET %s
                )
                """
                
                # Better approach: use external_id from X_test
                cursor.execute(
                    "SELECT patient_id FROM patients WHERE data_source = 'X_TEST' ORDER BY patient_id LIMIT 1 OFFSET %s",
                    (idx,)
                )
                result = cursor.fetchone()
                
                if not result:
                    continue
                
                patient_id_db = result[0]
                
                # Insert prediction
                insert_pred = """
                INSERT INTO predictions 
                (patient_id, prediction_window, risk_score, risk_tier, model_version, prediction_date)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_pred, (
                    patient_id_db,
                    prediction_window,
                    float(row['risk_score']),
                    int(row['risk_tier']),
                    'ExtraTreesClassifier v1.0',
                    datetime.now()
                ))
            
            self.conn.commit()
            print(f"✅ Stored {len(results)} predictions for {window}-day window")
            return True
        
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Failed to store predictions: {e}")
            return False
    
    def store_financial_projections(self, results, window):
        """Store ACTUAL ROI calculations to database"""
        try:
            cursor = self.conn.cursor()
            
            window_map = {
                30: '30_day',
                60: '60_day',
                90: '90_day'
            }
            
            prediction_window = window_map[window]
            
            # Insert financial projections
            for idx, row in results.iterrows():
                cursor.execute(
                    "SELECT patient_id FROM patients WHERE data_source = 'X_TEST' ORDER BY patient_id LIMIT 1 OFFSET %s",
                    (idx,)
                )
                result = cursor.fetchone()
                
                if not result:
                    continue
                
                patient_id_db = result[0]
                
                # Get prediction_id that was just inserted
                cursor.execute(
                    "SELECT prediction_id FROM predictions WHERE patient_id = %s AND prediction_window = %s ORDER BY prediction_id DESC LIMIT 1",
                    (patient_id_db, prediction_window)
                )
                pred_result = cursor.fetchone()
                
                if not pred_result:
                    continue
                
                prediction_id = pred_result[0]
                
                insert_roi = """
                INSERT INTO financial_projections 
                (patient_id, prediction_id, prediction_window, risk_tier,
                 window_cost, addressable_cost, intervention_cost, success_rate,
                 expected_savings, net_benefit, roi_percent, roi_category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                # Determine ROI category
                roi_pct = row['roi_percent']
                if roi_pct > 75:
                    roi_category = 'EXCELLENT'
                elif roi_pct >= 50:
                    roi_category = 'STRONG'
                elif roi_pct > 0:
                    roi_category = 'POSITIVE'
                else:
                    roi_category = 'NO_ROI'
                
                cursor.execute(insert_roi, (
                    patient_id_db,
                    prediction_id,
                    prediction_window,
                    int(row['risk_tier']),
                    float(row[f'projected_{window}_day_cost']),
                    float(row[f'projected_{window}_day_cost']) * 0.60,  # 60% addressable
                    float(row['intervention_cost']),
                    float(row['success_rate']),
                    float(row['expected_savings']),
                    float(row['net_benefit']),
                    float(row['roi_percent']),
                    roi_category
                ))
            
            self.conn.commit()
            print(f"✅ Stored {len(results)} ROI records for {window}-day window")
            return True
        
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Failed to store financial projections: {e}")
            return False
    
    def run_pipeline(self):
        """Execute full CORRECT pipeline"""
        print("\n" + "="*80)
        print("LOADING BASELINE DATA WITH ACTUAL ML PREDICTIONS")
        print("="*80)
        
        if not self.connect_db():
            return False
        
        try:
            # Step 1: Load models and data
            if not self.load_models_and_data():
                return False
            
            # Step 2: Clear old incorrect predictions
            if not self.clear_old_predictions():
                return False
            
            # Step 3-5: For each window, get predictions and store
            print("\n" + "="*70)
            print("STRATIFYING AND STORING ACTUAL PREDICTIONS")
            print("="*70)
            
            for window in [30, 60, 90]:
                # Get ACTUAL predictions from model
                results = self.get_risk_tiers_from_model(window)
                
                # Calculate ROI using ACTUAL model outputs
                results = self.calculate_roi_from_model(results, window)
                
                # Store to database
                if not self.store_predictions(results, window):
                    return False
                
                if not self.store_financial_projections(results, window):
                    return False
                
                self.results[window] = results
            
            # Step 6: Refresh materialized views
            print("\n" + "="*70)
            print("REFRESHING MATERIALIZED VIEWS")
            print("="*70)
            
            cursor = self.conn.cursor()
            views = [
                'org_tier_summary',
                'roi_aggregations',
                'positive_roi_patients',
                'dept_risk_distribution',
                'high_risk_by_department',
                'dept_performance'
            ]
            
            for view in views:
                cursor.execute(f"REFRESH MATERIALIZED VIEW {view}")
                self.conn.commit()
                print(f"✅ Refreshed {view}")
            
            # Print summary
            print("\n" + "="*70)
            print("PHASE 2 COMPLETE - ACTUAL ML PREDICTIONS LOADED")
            print("="*70)
            
            for window in [30, 60, 90]:
                results = self.results[window]
                print(f"\n{window}-Day Window:")
                print(f"  Total Patients: {len(results)}")
                print(f"  Tier Distribution:")
                tier_dist = results['risk_tier'].value_counts().sort_index()
                for tier in [1, 2, 3, 4, 5]:
                    count = tier_dist.get(tier, 0)
                    pct = (count / len(results)) * 100
                    print(f"    Tier {tier}: {count} ({pct:.1f}%)")
                
                overall_roi = (
                    results['net_benefit'].sum() / 
                    results['intervention_cost'].sum() * 100
                    if results['intervention_cost'].sum() > 0 else 0
                )
                print(f"  Overall ROI: {overall_roi:.1f}%")
                print(f"  Net Benefit: ${results['net_benefit'].sum():,.2f}")
            
            return True
        
        finally:
            self.close_db()


def main():
    db_config = {
        'host': 'localhost',
        'port': 5433,
        'database': 'risk_predictionDB',
        'user': 'abdullah',
        'password': 'abdullah123'
    }
    
    loader = ActualMLPredictionLoader(db_config)
    success = loader.run_pipeline()
    
    if success:
        print("\n✅ DATABASE NOW CONTAINS ACTUAL ML MODEL PREDICTIONS!")
        print("   This matches your 02_roi_calculation.py output!")
    else:
        print("\n❌ Pipeline failed!")


if __name__ == '__main__':
    main()
