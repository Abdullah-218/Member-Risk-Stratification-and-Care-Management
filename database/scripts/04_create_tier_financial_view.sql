-- Create materialized view for tier-level financial aggregations
-- This provides tier-by-tier breakdown of financial metrics matching ML model output

CREATE MATERIALIZED VIEW IF NOT EXISTS tier_financial_summary AS
SELECT 
  pred.prediction_window,
  fp.risk_tier,
  CASE fp.risk_tier
    WHEN 1 THEN 'Tier 1 - Low Risk'
    WHEN 2 THEN 'Tier 2 - Low-Moderate'
    WHEN 3 THEN 'Tier 3 - Moderate'
    WHEN 4 THEN 'Tier 4 - High'
    WHEN 5 THEN 'Tier 5 - Critical'
  END as tier_name,
  COUNT(*) as patient_count,
  ROUND(AVG(pred.risk_score)::numeric, 4) as avg_risk_score,
  SUM(fp.window_cost)::numeric as total_projected_cost,
  SUM(fp.intervention_cost)::numeric as total_intervention_cost,
  SUM(fp.expected_savings)::numeric as total_expected_savings,
  SUM(fp.net_benefit)::numeric as total_net_benefit,
  ROUND((SUM(fp.net_benefit) / NULLIF(SUM(fp.intervention_cost), 0) * 100)::numeric, 2) as tier_roi_percent,
  ROUND(AVG(fp.success_rate)::numeric, 4) as avg_success_rate
FROM predictions pred
JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
GROUP BY pred.prediction_window, fp.risk_tier
ORDER BY pred.prediction_window, fp.risk_tier;

-- Refresh the view with current data
REFRESH MATERIALIZED VIEW tier_financial_summary;
