import { query } from '../config/database.js';

/**
 * =====================================
 * DASHBOARD ANALYTICS QUERIES
 * =====================================
 */

export const Dashboard = {
  /**
   * Get dashboard summary for a specific prediction window
   * Returns: Total members, risk distribution, cost projections, ROI metrics
   */
  getSummary: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        COUNT(DISTINCT p.patient_id) as total_members,
        
        -- Risk tier distribution
        SUM(CASE WHEN pred.risk_tier = 5 THEN 1 ELSE 0 END) as tier_5_critical,
        SUM(CASE WHEN pred.risk_tier = 4 THEN 1 ELSE 0 END) as tier_4_high,
        SUM(CASE WHEN pred.risk_tier = 3 THEN 1 ELSE 0 END) as tier_3_moderate,
        SUM(CASE WHEN pred.risk_tier = 2 THEN 1 ELSE 0 END) as tier_2_low_moderate,
        SUM(CASE WHEN pred.risk_tier = 1 THEN 1 ELSE 0 END) as tier_1_low,
        
        -- Financial metrics
        SUM(fp.window_cost) as total_projected_cost,
        SUM(fp.intervention_cost) as total_intervention_cost,
        SUM(fp.expected_savings) as total_potential_savings,
        SUM(fp.net_benefit) as total_net_benefit,
        ROUND(
          (SUM(fp.net_benefit) / NULLIF(SUM(fp.intervention_cost), 0) * 100),
          2
        ) as avg_roi_percent,
        
        -- High risk counts
        SUM(CASE WHEN pred.risk_tier >= 4 THEN 1 ELSE 0 END) as high_risk_count,
        ROUND(
          100.0 * SUM(CASE WHEN pred.risk_tier >= 4 THEN 1 ELSE 0 END) / 
          NULLIF(COUNT(DISTINCT p.patient_id), 0),
          2
        ) as high_risk_percentage
        
      FROM patients p
      LEFT JOIN predictions pred ON p.patient_id = pred.patient_id
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true`,
      [predictionWindow]
    );

    return result.rows[0];
  },

  /**
   * Get risk distribution with member details for a prediction window
   * Returns: Members grouped by risk tier with risk scores
   */
  getRiskDistribution: async (predictionWindow = '30_day', limit = 100, offset = 0) => {
    const result = await query(
      `SELECT
        p.patient_id as id,
        p.external_id,
        p.age,
        p.gender,
        p.annual_cost,
        d.department_name as department,
        d.department_code as dept_code,
        pred.risk_score,
        pred.risk_tier,
        pred.tier_label,
        fp.window_cost as estimated_cost,
        fp.intervention_cost,
        fp.expected_savings,
        fp.net_benefit,
        fp.roi_percent,
        fp.roi_category
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN predictions pred ON p.patient_id = pred.patient_id
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true
      ORDER BY pred.risk_score DESC
      LIMIT $2 OFFSET $3`,
      [predictionWindow, limit, offset]
    );

    return result.rows;
  },

  /**
   * Get tier-based statistics
   * Returns: Count and metrics per risk tier
   */
  getTierStatistics: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        pred.risk_tier,
        pred.tier_label,
        COUNT(*) as member_count,
        ROUND(AVG(pred.risk_score), 3) as avg_risk_score,
        MIN(pred.risk_score) as min_risk_score,
        MAX(pred.risk_score) as max_risk_score,
        SUM(fp.window_cost) as total_cost,
        SUM(fp.intervention_cost) as total_intervention_cost,
        SUM(fp.expected_savings) as total_savings,
        SUM(fp.net_benefit) as total_net_benefit,
        ROUND(AVG(fp.roi_percent), 2) as avg_roi
      FROM predictions pred
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND pred.is_active = true
      GROUP BY pred.risk_tier, pred.tier_label
      ORDER BY pred.risk_tier DESC`,
      [predictionWindow]
    );

    return result.rows;
  },

  /**
   * Get department-wise summary
   */
  getDepartmentSummary: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        d.department_id,
        d.department_code,
        d.department_name,
        d.specialty_type,
        COUNT(DISTINCT p.patient_id) as total_members,
        ROUND(AVG(pred.risk_score), 3) as avg_risk_score,
        SUM(CASE WHEN pred.risk_tier >= 4 THEN 1 ELSE 0 END) as high_risk_count,
        SUM(fp.expected_savings) as total_potential_savings,
        ROUND(AVG(fp.roi_percent), 2) as avg_roi
      FROM departments d
      LEFT JOIN patients p ON d.department_id = p.department_id
      LEFT JOIN predictions pred ON p.patient_id = pred.patient_id
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true
      GROUP BY d.department_id, d.department_code, d.department_name, d.specialty_type
      ORDER BY high_risk_count DESC`,
      [predictionWindow]
    );

    return result.rows;
  },

  /**
   * Get top priority patients (highest ROI opportunity)
   */
  getPriorityPatients: async (predictionWindow = '30_day', limit = 10) => {
    const result = await query(
      `SELECT
        p.patient_id as id,
        p.external_id,
        p.age,
        p.gender,
        d.department_name as department,
        pred.risk_score,
        pred.risk_tier,
        pred.tier_label,
        fp.window_cost,
        fp.intervention_cost,
        fp.expected_savings,
        fp.net_benefit,
        fp.roi_percent,
        fp.roi_category
      FROM patients p
      JOIN departments d ON p.dept_id = d.department_id
      JOIN predictions pred ON p.patient_id = pred.patient_id
      JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true
        AND fp.roi_percent > 0
        AND pred.risk_tier >= 4
      ORDER BY fp.net_benefit DESC
      LIMIT $2`,
      [predictionWindow, limit]
    );

    return result.rows;
  },

  /**
   * Get trend data (compare across windows)
   */
  getTrendData: async () => {
    const result = await query(
      `SELECT
        pred.prediction_window,
        COUNT(DISTINCT p.patient_id) as total_members,
        ROUND(AVG(pred.risk_score), 3) as avg_risk_score,
        SUM(CASE WHEN pred.risk_tier >= 4 THEN 1 ELSE 0 END) as high_risk_count,
        SUM(fp.window_cost) as total_cost,
        SUM(fp.expected_savings) as total_savings,
        ROUND(AVG(fp.roi_percent), 2) as avg_roi
      FROM patients p
      JOIN predictions pred ON p.patient_id = pred.patient_id
      JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE p.is_active = true
        AND pred.is_active = true
      GROUP BY pred.prediction_window
      ORDER BY 
        CASE 
          WHEN pred.prediction_window = '30_day' THEN 1
          WHEN pred.prediction_window = '60_day' THEN 2
          WHEN pred.prediction_window = '90_day' THEN 3
        END`
    );

    return result.rows;
  },

  /**
   * Get tier-level financial breakdown (matches ML model output)
   * Returns: Detailed financial metrics for each tier in each window
   */
  getTierFinancials: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        prediction_window as "predictionWindow",
        risk_tier as "riskTier",
        tier_name as "tierName",
        patient_count as "patientCount",
        avg_risk_score as "avgRiskScore",
        total_projected_cost as "totalProjectedCost",
        total_intervention_cost as "totalInterventionCost",
        total_expected_savings as "totalExpectedSavings",
        total_net_benefit as "totalNetBenefit",
        tier_roi_percent as "tierRoiPercent",
        avg_success_rate as "avgSuccessRate"
      FROM tier_financial_summary
      WHERE prediction_window = $1
      ORDER BY risk_tier`,
      [predictionWindow]
    );

    return result.rows;
  },

  /**
   * Get members filtered by risk tier(s)
   * Returns: Detailed member information for specific risk tiers
   */
  getMembersByTier: async (predictionWindow = '30_day', tiers = [], limit = 100, offset = 0) => {
    // If no tiers specified, return all members
    const tierFilter = tiers && tiers.length > 0
      ? `AND pred.risk_tier = ANY($2::int[])`
      : '';
    
    const params = tiers && tiers.length > 0
      ? [predictionWindow, tiers, limit, offset]
      : [predictionWindow, limit, offset];
    
    const limitOffset = tiers && tiers.length > 0 ? '$3 OFFSET $4' : '$2 OFFSET $3';

    const result = await query(
      `SELECT
        p.patient_id as id,
        p.external_id as "externalId",
        p.age,
        p.gender,
        p.annual_cost as "annualCost",
        d.department_name as department,
        d.department_code as "deptCode",
        pred.risk_score as "riskScore",
        pred.risk_tier as "riskTier",
        pred.tier_label as "tierLabel",
        fp.window_cost as "estimatedCost",
        fp.intervention_cost as "interventionCost",
        fp.expected_savings as "expectedSavings",
        fp.net_benefit as "netBenefit",
        fp.roi_percent as "roiPercent",
        fp.roi_category as "roiCategory"
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN predictions pred ON p.patient_id = pred.patient_id
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        ${tierFilter}
        AND p.is_active = true
        AND pred.is_active = true
      ORDER BY pred.risk_score DESC
      LIMIT ${limitOffset}`,
      params
    );

    return result.rows;
  },
};

export default Dashboard;
