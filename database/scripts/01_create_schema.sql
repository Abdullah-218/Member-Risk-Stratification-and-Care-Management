-- ============================================================================
-- HEALTHCARE RISK ML PLATFORM - DATABASE SCHEMA
-- Option C: Hybrid (Clinical Department + Risk Tier Tracking)
-- Date: January 29, 2026
-- ============================================================================

-- Drop existing tables if they exist (CAREFUL: This deletes all data!)
-- Uncomment to reset database
-- DROP TABLE IF EXISTS financial_projections CASCADE;
-- DROP TABLE IF EXISTS predictions CASCADE;
-- DROP TABLE IF EXISTS patient_features CASCADE;
-- DROP TABLE IF EXISTS new_patient_raw_input CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================
-- Purpose: Organization master data (supports multi-tenancy)
-- Cardinality: Usually 1 record per deployment

CREATE TABLE IF NOT EXISTS organizations (
    organization_id SERIAL PRIMARY KEY,
    organization_code VARCHAR(50) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50),  -- 'HOSPITAL', 'HEALTH_SYSTEM', 'CLINIC'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================================
-- Purpose: 10 clinical departments (Option C: Clinical departments)
-- Cardinality: Typically 10 rows

CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(organization_id),
    department_code VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(255) NOT NULL,
    specialty_type VARCHAR(100),  -- 'CARDIAC', 'RENAL', 'ENDOCRINE', etc.
    description TEXT,
    head_of_department VARCHAR(255),
    contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 3. PATIENTS TABLE
-- ============================================================================
-- Purpose: Master patient registry (baseline + new patients)
-- Cardinality: 3,000 baseline + N new patients (grows over time)
-- Key Feature: Links to department (Option C)

CREATE TABLE IF NOT EXISTS patients (
    patient_id BIGSERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(organization_id),
    department_id INTEGER NOT NULL REFERENCES departments(department_id),
    
    -- External identifiers
    external_id VARCHAR(50),  -- DESYNPUF_ID (hex string), MRN, or SSN_LAST4
    external_id_type VARCHAR(50),  -- 'DESYNPUF_ID', 'MRN', 'SSN_LAST4'
    
    -- Demographics
    age INTEGER,
    gender VARCHAR(10),  -- 'M', 'F', 'Other'
    race VARCHAR(50),  -- 'White', 'Black', 'Hispanic', 'Asian', 'Other'
    
    -- Financial baseline
    annual_cost DECIMAL(12, 2),
    cost_percentile DECIMAL(5, 3),  -- 0.0-1.0
    is_high_cost BOOLEAN,  -- annual_cost > 75th percentile
    
    -- Data source tracking
    data_source VARCHAR(50) NOT NULL,  -- 'X_TEST' or 'NEW_PATIENT'
    source_date DATE,  -- When patient entered system
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deactivation_reason VARCHAR(255),
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- ============================================================================
-- 4. PATIENT_FEATURES TABLE
-- ============================================================================
-- Purpose: Store 27 engineered features per patient
-- Cardinality: 1:1 with patients table
-- Key Feature: All 27 features as individual COLUMNS (queryable, indexable)

CREATE TABLE IF NOT EXISTS patient_features (
    feature_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL UNIQUE REFERENCES patients(patient_id) ON DELETE CASCADE,
    
    -- ─ DEMOGRAPHICS (5 features)
    is_elderly BOOLEAN,  -- age > 65
    is_female BOOLEAN,   -- gender = 'F'
    
    -- ─ CHRONIC CONDITIONS (10 features, binary: 0/1/2 where 2=missing)
    has_esrd SMALLINT,
    has_alzheimers SMALLINT,
    has_chf SMALLINT,
    has_ckd SMALLINT,
    has_cancer SMALLINT,
    has_copd SMALLINT,
    has_depression SMALLINT,
    has_diabetes SMALLINT,
    has_ischemic_heart SMALLINT,
    has_ra_oa SMALLINT,
    has_stroke SMALLINT,
    
    -- ─ UTILIZATION METRICS (6 features)
    total_admissions_2008 DECIMAL(10, 2),
    total_hospital_days_2008 DECIMAL(10, 2),
    days_since_last_admission DECIMAL(10, 2),
    recent_admission SMALLINT,  -- 0 or 1
    total_outpatient_visits_2008 DECIMAL(10, 2),
    high_outpatient_user SMALLINT,  -- 0 or 1
    
    -- ─ COST METRICS (4 features)
    total_annual_cost DECIMAL(12, 2),
    cost_percentile DECIMAL(5, 3),
    high_cost SMALLINT,  -- 0 or 1
    total_inpatient_cost DECIMAL(12, 2),
    
    -- ─ DERIVED RISK METRICS (2 features)
    frailty_score DECIMAL(8, 4),  -- 0.0-2.0
    complexity_index DECIMAL(8, 4),  -- 0.0-50.0
    
    -- Metadata
    feature_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. PREDICTIONS TABLE
-- ============================================================================
-- Purpose: Risk predictions for each patient × each time window
-- Cardinality: 3 per patient (30/60/90 day windows) = 9,000+ records
-- Key Feature: Converts risk_score (0-1) to risk_tier (1-5)

CREATE TABLE IF NOT EXISTS predictions (
    prediction_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    
    -- Prediction window (3 per patient)
    prediction_window VARCHAR(20) NOT NULL,  -- '30_day', '60_day', '90_day'
    
    -- Risk output
    risk_score DECIMAL(5, 3),  -- 0.0-1.0 from ML model
    risk_tier INTEGER,  -- 1-5 derived from risk_score
    tier_label VARCHAR(50),  -- 'Normal', 'Low Risk', 'Moderate', 'High Risk', 'Critical'
    
    -- Model metadata
    model_name VARCHAR(100),  -- 'ExtraTreesClassifier', 'RandomForestClassifier', 'LightGBM'
    model_version VARCHAR(50),  -- '1.0', '1.1', etc.
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,  -- Can mark predictions as superseded
    
    -- Audit
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prediction_date DATE DEFAULT CURRENT_DATE
);

-- ============================================================================
-- 6. FINANCIAL_PROJECTIONS TABLE
-- ============================================================================
-- Purpose: ROI calculations per prediction
-- Cardinality: 1:1 with predictions (9,000+ records)
-- Key Feature: Store all calculations explicitly for audit trail

CREATE TABLE IF NOT EXISTS financial_projections (
    projection_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    prediction_id BIGINT NOT NULL UNIQUE REFERENCES predictions(prediction_id) ON DELETE CASCADE,
    
    -- Link to prediction context
    prediction_window VARCHAR(20) NOT NULL,  -- '30_day', '60_day', '90_day'
    risk_tier INTEGER NOT NULL,  -- 1-5 from prediction
    
    -- Cost data (calculated)
    annual_cost DECIMAL(12, 2),  -- Reference cost
    window_cost DECIMAL(10, 2),  -- annual_cost / 365 * days_in_window
    addressable_cost DECIMAL(10, 2),  -- window_cost * 0.60 (60% preventable)
    daily_cost DECIMAL(10, 2),  -- annual_cost / 365
    
    -- Intervention data
    intervention_cost DECIMAL(10, 2),  -- Cost per tier per window
    success_rate DECIMAL(5, 3),  -- 0.0-1.0 probability of success
    
    -- Savings calculation
    expected_savings DECIMAL(10, 2),  -- addressable_cost * success_rate
    net_benefit DECIMAL(10, 2),  -- expected_savings - intervention_cost
    
    -- ROI calculation (main output)
    roi_percent DECIMAL(8, 2),  -- 0-100% (capped)
    roi_category VARCHAR(50),  -- 'EXCELLENT' (>75%), 'STRONG' (50-75%), 'POSITIVE' (>0%), 'NO_ROI' (≤0%)
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_notes TEXT
);

-- ============================================================================
-- 7. NEW_PATIENT_RAW_INPUT TABLE (Optional - for audit trail)
-- ============================================================================
-- Purpose: Store raw input exactly as received from frontend
-- Cardinality: 0+N (optional, one per new patient if enabled)
-- Key Feature: Enables audit trail and can re-engineer if logic changes

CREATE TABLE IF NOT EXISTS new_patient_raw_input (
    raw_input_id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT UNIQUE REFERENCES patients(patient_id) ON DELETE CASCADE,
    
    -- Raw data
    input_json JSONB,  -- Original input as JSON
    
    -- Source information
    source_system VARCHAR(50),  -- 'FRONTEND_FORM', 'API', 'IMPORTED', 'BULK_LOAD'
    source_endpoint VARCHAR(255),  -- Which API endpoint or form
    
    -- Processing status
    received_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feature_engineered_at TIMESTAMP,  -- When features were calculated
    engineering_version VARCHAR(50),  -- Which feature engineering version
    
    -- Audit
    received_by VARCHAR(50),
    engineering_notes TEXT
);

-- ============================================================================
-- COMMIT
-- ============================================================================

-- Tables created successfully!
-- Next: Create indexes (02_create_indexes.sql)
-- Then: Create materialized views (03_create_views.sql)
