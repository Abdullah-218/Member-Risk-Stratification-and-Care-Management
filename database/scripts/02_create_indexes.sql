-- ============================================================================
-- HEALTHCARE RISK ML PLATFORM - INDEXES
-- Optimizes query performance on key columns
-- Date: January 29, 2026
-- ============================================================================

-- ============================================================================
-- ORGANIZATIONS TABLE - Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_code 
    ON organizations(organization_code);

CREATE INDEX IF NOT EXISTS idx_organizations_active 
    ON organizations(is_active);

-- ============================================================================
-- DEPARTMENTS TABLE - Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_departments_org_id 
    ON departments(organization_id);

CREATE INDEX IF NOT EXISTS idx_departments_code 
    ON departments(department_code);

CREATE INDEX IF NOT EXISTS idx_departments_active 
    ON departments(is_active);

-- Composite index for org + active (common query pattern)
CREATE INDEX IF NOT EXISTS idx_departments_org_active 
    ON departments(organization_id, is_active);

-- ============================================================================
-- PATIENTS TABLE - Indexes (CRITICAL)
-- ============================================================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_patients_org_id 
    ON patients(organization_id);

CREATE INDEX IF NOT EXISTS idx_patients_department_id 
    ON patients(department_id);

CREATE INDEX IF NOT EXISTS idx_patients_external_id 
    ON patients(external_id);

CREATE INDEX IF NOT EXISTS idx_patients_data_source 
    ON patients(data_source);

CREATE INDEX IF NOT EXISTS idx_patients_annual_cost 
    ON patients(annual_cost);

CREATE INDEX IF NOT EXISTS idx_patients_age 
    ON patients(age);

CREATE INDEX IF NOT EXISTS idx_patients_created_at 
    ON patients(created_at);

CREATE INDEX IF NOT EXISTS idx_patients_active 
    ON patients(is_active);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_patients_org_dept 
    ON patients(organization_id, department_id);

CREATE INDEX IF NOT EXISTS idx_patients_dept_active 
    ON patients(department_id, is_active);

CREATE INDEX IF NOT EXISTS idx_patients_source_active 
    ON patients(data_source, is_active);

-- ============================================================================
-- PATIENT_FEATURES TABLE - Indexes
-- ============================================================================

-- Primary lookup
CREATE INDEX IF NOT EXISTS idx_patient_features_patient_id 
    ON patient_features(patient_id);

-- Risk metric indexes (used in queries like "WHERE complexity_index > 0.8")
CREATE INDEX IF NOT EXISTS idx_patient_features_complexity 
    ON patient_features(complexity_index);

CREATE INDEX IF NOT EXISTS idx_patient_features_frailty 
    ON patient_features(frailty_score);

-- Condition indexes (for filtering by specific conditions)
CREATE INDEX IF NOT EXISTS idx_patient_features_has_diabetes 
    ON patient_features(has_diabetes);

CREATE INDEX IF NOT EXISTS idx_patient_features_has_chf 
    ON patient_features(has_chf);

CREATE INDEX IF NOT EXISTS idx_patient_features_has_copd 
    ON patient_features(has_copd);

CREATE INDEX IF NOT EXISTS idx_patient_features_has_ckd 
    ON patient_features(has_ckd);

-- Cost indexes
CREATE INDEX IF NOT EXISTS idx_patient_features_high_cost 
    ON patient_features(high_cost);

-- Composite indexes for condition routing (department assignment)
CREATE INDEX IF NOT EXISTS idx_patient_features_chf_heart 
    ON patient_features(has_chf, has_ischemic_heart);

CREATE INDEX IF NOT EXISTS idx_patient_features_ckd_esrd 
    ON patient_features(has_ckd, has_esrd);

-- ============================================================================
-- PREDICTIONS TABLE - Indexes (CRITICAL)
-- ============================================================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_predictions_patient_id 
    ON predictions(patient_id);

CREATE INDEX IF NOT EXISTS idx_predictions_prediction_window 
    ON predictions(prediction_window);

CREATE INDEX IF NOT EXISTS idx_predictions_risk_tier 
    ON predictions(risk_tier);

CREATE INDEX IF NOT EXISTS idx_predictions_prediction_date 
    ON predictions(prediction_date);

CREATE INDEX IF NOT EXISTS idx_predictions_active 
    ON predictions(is_active);

-- Composite indexes for common query patterns
-- Used for: "Get tier distribution per window"
CREATE INDEX IF NOT EXISTS idx_predictions_window_tier 
    ON predictions(prediction_window, risk_tier);

-- Used for: "Get predictions for specific patient + window"
CREATE INDEX IF NOT EXISTS idx_predictions_patient_window 
    ON predictions(patient_id, prediction_window);

-- Used for: "Get active predictions for date range + window"
CREATE INDEX IF NOT EXISTS idx_predictions_active_date_window 
    ON predictions(is_active, prediction_date, prediction_window);

-- ============================================================================
-- FINANCIAL_PROJECTIONS TABLE - Indexes (CRITICAL)
-- ============================================================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_financial_projections_patient_id 
    ON financial_projections(patient_id);

CREATE INDEX IF NOT EXISTS idx_financial_projections_prediction_id 
    ON financial_projections(prediction_id);

CREATE INDEX IF NOT EXISTS idx_financial_projections_window 
    ON financial_projections(prediction_window);

CREATE INDEX IF NOT EXISTS idx_financial_projections_risk_tier 
    ON financial_projections(risk_tier);

CREATE INDEX IF NOT EXISTS idx_financial_projections_roi_category 
    ON financial_projections(roi_category);

CREATE INDEX IF NOT EXISTS idx_financial_projections_roi_percent 
    ON financial_projections(roi_percent);

-- Composite indexes for common query patterns
-- Used for: "Get positive ROI patients"
CREATE INDEX IF NOT EXISTS idx_financial_projections_positive_roi 
    ON financial_projections(roi_percent, patient_id) 
    WHERE roi_percent > 0;

-- Used for: "Get high-risk high-ROI patients"
CREATE INDEX IF NOT EXISTS idx_financial_projections_tier_roi 
    ON financial_projections(risk_tier, roi_percent);

-- ============================================================================
-- NEW_PATIENT_RAW_INPUT TABLE - Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_new_patient_raw_input_patient_id 
    ON new_patient_raw_input(patient_id);

CREATE INDEX IF NOT EXISTS idx_new_patient_raw_input_received 
    ON new_patient_raw_input(received_timestamp);

-- ============================================================================
-- SUMMARY: Total Indexes Created
-- ============================================================================

-- Total: ~30 indexes
-- Coverage:
--   - Primary lookups: patient_id, org_id, dept_id
--   - Filtering: data_source, risk_tier, roi_category
--   - Analytics: windows, tiers, costs
--   - Conditions: diabetes, CHF, COPD, etc.
--   - Composite: Common multi-column query patterns
--
-- These indexes should speed up queries by 10-100x
-- compared to full table scans

-- Indexes created successfully!
