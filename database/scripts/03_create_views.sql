-- ============================================================================
-- HEALTHCARE RISK ML PLATFORM - MATERIALIZED VIEWS
-- Pre-aggregated data for fast dashboard queries
-- Date: January 29, 2026
-- ============================================================================

-- ============================================================================
-- VIEW 1: org_tier_summary
-- What: Summary of risk tier distribution per prediction window
-- Rows: ~3 rows (1 per prediction window: 30, 60, 90-day)
-- Use: Dashboard top-level metrics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS org_tier_summary AS
SELECT
    p.prediction_window,
    COUNT(DISTINCT p.patient_id) as patient_count,
    COUNT(DISTINCT p.risk_tier) as tier_count,
    MAX(CASE WHEN p.risk_tier = 5 THEN 1 ELSE 0 END) as has_critical,
    SUM(CASE WHEN p.risk_tier >= 4 THEN 1 ELSE 0 END) as high_risk_count,
    ROUND(
        100.0 * SUM(CASE WHEN p.risk_tier >= 4 THEN 1 ELSE 0 END) / 
        COUNT(DISTINCT p.patient_id)
    , 2) as high_risk_percentage,
    SUM(fp.expected_savings) as total_addressable_opportunity,
    ROUND(AVG(fp.roi_percent), 2) as avg_roi_percent,
    MIN(p.prediction_timestamp) as first_prediction_date,
    MAX(p.prediction_timestamp) as last_prediction_date
FROM predictions p
LEFT JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
WHERE p.is_active = true
GROUP BY p.prediction_window
ORDER BY 
    CASE 
        WHEN p.prediction_window = '30_day' THEN 1
        WHEN p.prediction_window = '60_day' THEN 2
        WHEN p.prediction_window = '90_day' THEN 3
    END;

-- Create index on materialized view for fast queries
CREATE INDEX IF NOT EXISTS idx_org_tier_summary_window 
    ON org_tier_summary(prediction_window);

-- ============================================================================
-- VIEW 2: roi_aggregations
-- What: ROI metrics aggregated per prediction window
-- Rows: ~3 rows (1 per prediction window)
-- Use: Financial summary dashboard
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS roi_aggregations AS
SELECT
    fp.prediction_window,
    COUNT(DISTINCT fp.patient_id) as intervention_eligible_count,
    SUM(fp.window_cost) as total_cost,
    SUM(fp.addressable_cost) as total_addressable_cost,
    SUM(fp.intervention_cost) as total_intervention_cost,
    SUM(fp.expected_savings) as total_expected_savings,
    SUM(fp.net_benefit) as total_net_benefit,
    ROUND(AVG(fp.roi_percent), 2) as avg_roi_percent,
    ROUND(MAX(fp.roi_percent), 2) as max_roi_percent,
    ROUND(MIN(fp.roi_percent), 2) as min_roi_percent,
    COUNT(CASE WHEN fp.roi_category = 'EXCELLENT' THEN 1 END) as excellent_roi_count,
    COUNT(CASE WHEN fp.roi_category = 'STRONG' THEN 1 END) as strong_roi_count,
    COUNT(CASE WHEN fp.roi_category = 'POSITIVE' THEN 1 END) as positive_roi_count,
    COUNT(CASE WHEN fp.roi_category = 'NO_ROI' THEN 1 END) as no_roi_count
FROM financial_projections fp
WHERE fp.is_active = true
GROUP BY fp.prediction_window
ORDER BY 
    CASE 
        WHEN fp.prediction_window = '30_day' THEN 1
        WHEN fp.prediction_window = '60_day' THEN 2
        WHEN fp.prediction_window = '90_day' THEN 3
    END;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_roi_aggregations_window 
    ON roi_aggregations(prediction_window);

-- ============================================================================
-- VIEW 3: positive_roi_patients
-- What: All patients with positive ROI (high-priority for intervention)
-- Rows: ~1,500-1,800 rows (60% of 3,000 patients should have positive ROI)
-- Use: Intervention target list, drill-down analysis
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS positive_roi_patients AS
SELECT
    pt.patient_id,
    pt.external_id,
    org.organization_code,
    org.organization_name,
    d.department_code,
    d.department_name,
    p.prediction_window,
    p.risk_tier,
    pt.age,
    pt.gender,
    pt.race,
    pt.annual_cost,
    pf.complexity_index,
    pf.frailty_score,
    fp.window_cost,
    fp.addressable_cost,
    fp.intervention_cost,
    fp.expected_savings,
    fp.net_benefit,
    fp.roi_percent,
    fp.roi_category,
    p.prediction_timestamp as prediction_date
FROM patients pt
INNER JOIN organizations org ON pt.organization_id = org.organization_id
INNER JOIN departments d ON pt.department_id = d.department_id
INNER JOIN predictions p ON pt.patient_id = p.patient_id
INNER JOIN patient_features pf ON pt.patient_id = pf.patient_id
INNER JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
WHERE p.is_active = true
    AND fp.is_active = true
    AND fp.roi_percent > 0
ORDER BY fp.roi_percent DESC, pt.annual_cost DESC;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_positive_roi_patients_org 
    ON positive_roi_patients(organization_code);

CREATE INDEX IF NOT EXISTS idx_positive_roi_patients_dept 
    ON positive_roi_patients(department_code);

CREATE INDEX IF NOT EXISTS idx_positive_roi_patients_tier 
    ON positive_roi_patients(risk_tier);

CREATE INDEX IF NOT EXISTS idx_positive_roi_patients_window 
    ON positive_roi_patients(prediction_window);

-- ============================================================================
-- VIEW 4: dept_risk_distribution
-- What: Risk tier distribution by department (Option C: Hybrid approach)
-- Rows: ~50 rows (10 departments × 5 risk tiers)
-- Use: Department comparison, risk stratification by clinical area
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dept_risk_distribution AS
SELECT
    d.department_id,
    d.department_code,
    d.department_name,
    d.specialty_type,
    p.prediction_window,
    p.risk_tier,
    COUNT(DISTINCT p.patient_id) as patient_count,
    CASE 
        WHEN SUM(COUNT(DISTINCT p.patient_id)) OVER (PARTITION BY d.department_id, p.prediction_window) > 0 THEN
            ROUND(
                100.0 * COUNT(DISTINCT p.patient_id) / 
                SUM(COUNT(DISTINCT p.patient_id)) OVER (PARTITION BY d.department_id, p.prediction_window)
            , 2)
        ELSE 0
    END as percentage_in_dept_window,
    ROUND(AVG(pt.annual_cost), 2) as avg_annual_cost,
    SUM(pf.complexity_index) as total_complexity,
    ROUND(AVG(pf.complexity_index), 2) as avg_complexity,
    ROUND(AVG(fp.roi_percent), 2) as avg_roi_percent,
    COUNT(CASE WHEN fp.roi_percent > 0 THEN 1 END) as positive_roi_count,
    MIN(p.prediction_timestamp) as first_prediction_date
FROM departments d
LEFT JOIN patients pt ON d.department_id = pt.department_id
LEFT JOIN predictions p ON pt.patient_id = p.patient_id
LEFT JOIN patient_features pf ON pt.patient_id = pf.patient_id
LEFT JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
WHERE p.is_active = true OR p.prediction_id IS NULL
    AND pt.is_active = true OR pt.patient_id IS NULL
GROUP BY 
    d.department_id,
    d.department_code,
    d.department_name,
    d.specialty_type,
    p.prediction_window,
    p.risk_tier
ORDER BY 
    d.department_name,
    p.prediction_window,
    p.risk_tier DESC;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_dept_risk_dept_id 
    ON dept_risk_distribution(department_id);

CREATE INDEX IF NOT EXISTS idx_dept_risk_window_tier 
    ON dept_risk_distribution(prediction_window, risk_tier);

-- ============================================================================
-- VIEW 5: high_risk_by_department
-- What: High-risk (tiers 4-5) patients by clinical department
-- Rows: ~20-40 rows (10 departments × 2 high tiers × 1-2 windows)
-- Use: Priority intervention list by department
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS high_risk_by_department AS
SELECT
    d.department_id,
    d.department_code,
    d.department_name,
    d.specialty_type,
    p.prediction_window,
    p.risk_tier,
    COUNT(DISTINCT p.patient_id) as high_risk_patient_count,
    ROUND(AVG(pt.annual_cost), 2) as avg_cost_per_patient,
    SUM(pt.annual_cost) as total_cost_at_risk,
    ROUND(AVG(pf.complexity_index), 2) as avg_complexity,
    ROUND(AVG(pf.frailty_score), 2) as avg_frailty,
    ROUND(AVG(fp.roi_percent), 2) as avg_roi_percent,
    SUM(fp.expected_savings) as total_potential_savings,
    MAX(p.prediction_timestamp) as last_prediction_date
FROM departments d
INNER JOIN patients pt ON d.department_id = pt.department_id
INNER JOIN predictions p ON pt.patient_id = p.patient_id
INNER JOIN patient_features pf ON pt.patient_id = pf.patient_id
INNER JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
WHERE p.is_active = true
    AND fp.is_active = true
    AND p.risk_tier >= 4
GROUP BY 
    d.department_id,
    d.department_code,
    d.department_name,
    d.specialty_type,
    p.prediction_window,
    p.risk_tier
ORDER BY 
    total_cost_at_risk DESC,
    d.department_name,
    p.prediction_window,
    p.risk_tier DESC;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_high_risk_dept_name 
    ON high_risk_by_department(department_name);

CREATE INDEX IF NOT EXISTS idx_high_risk_cost_at_risk 
    ON high_risk_by_department(total_cost_at_risk DESC);

-- ============================================================================
-- VIEW 6: dept_performance
-- What: Overall performance metrics per clinical department
-- Rows: ~10 rows (1 per department)
-- Use: Department-level scorecard, performance comparison
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dept_performance AS
SELECT
    d.department_id,
    d.department_code,
    d.department_name,
    d.specialty_type,
    COUNT(DISTINCT pt.patient_id) as total_patients,
    COUNT(DISTINCT CASE WHEN p.risk_tier >= 4 THEN p.patient_id END) as high_risk_patients,
    CASE 
        WHEN COUNT(DISTINCT pt.patient_id) > 0 THEN
            ROUND(
                100.0 * COUNT(DISTINCT CASE WHEN p.risk_tier >= 4 THEN p.patient_id END) / 
                COUNT(DISTINCT pt.patient_id)
            , 2)
        ELSE 0
    END as high_risk_percentage,
    ROUND(AVG(pt.annual_cost), 2) as avg_patient_cost,
    SUM(pt.annual_cost) as total_dept_cost,
    ROUND(AVG(pf.complexity_index), 2) as avg_complexity_index,
    ROUND(AVG(pf.frailty_score), 2) as avg_frailty_score,
    ROUND(AVG(fp.roi_percent), 2) as avg_roi_percent,
    COUNT(CASE WHEN fp.roi_percent > 0 THEN 1 END) as positive_roi_predictions,
    COUNT(CASE WHEN fp.roi_percent > 25 THEN 1 END) as strong_roi_predictions,
    SUM(fp.expected_savings) as total_potential_savings,
    COUNT(DISTINCT p.prediction_window) as prediction_windows_covered,
    MAX(p.prediction_timestamp) as last_update_date
FROM departments d
LEFT JOIN patients pt ON d.department_id = pt.department_id
LEFT JOIN predictions p ON pt.patient_id = p.patient_id
LEFT JOIN patient_features pf ON pt.patient_id = pf.patient_id
LEFT JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
WHERE pt.is_active = true OR pt.patient_id IS NULL
    AND p.is_active = true OR p.prediction_id IS NULL
GROUP BY 
    d.department_id,
    d.department_code,
    d.department_name,
    d.specialty_type
ORDER BY 
    total_potential_savings DESC,
    d.department_name;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_dept_performance_dept_name 
    ON dept_performance(department_name);

CREATE INDEX IF NOT EXISTS idx_dept_performance_roi 
    ON dept_performance(avg_roi_percent DESC);

CREATE INDEX IF NOT EXISTS idx_dept_performance_savings 
    ON dept_performance(total_potential_savings DESC);

-- ============================================================================
-- SUMMARY: Total Views Created
-- ============================================================================

-- Total: 6 materialized views
-- Total rows: ~1,500-2,000 rows (much smaller than base tables)
-- Refresh strategy: Refresh daily or on-demand after data updates
--
-- Query performance improvement: 100-1000x faster than computing on-the-fly
--
-- Refresh commands (run after data loads):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY org_tier_summary;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY roi_aggregations;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY positive_roi_patients;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY dept_risk_distribution;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY high_risk_by_department;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY dept_performance;

-- Views created successfully!
