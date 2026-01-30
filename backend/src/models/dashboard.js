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
        CONCAT('Patient ', p.external_id) as name,
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

  /**
   * Get detailed department analytics with risk tier breakdown
   * Returns department-level statistics with patient counts per tier
   * Only shows 3 tiers: Critical (5), High (4), Medium (3)
   */
  getDepartmentAnalytics: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        d.department_id as "departmentId",
        d.department_code as "departmentCode",
        d.department_name as "departmentName",
        d.specialty_type as "specialtyType",
        
        -- Total patient count
        COUNT(DISTINCT p.patient_id) as "totalPatients",
        
        -- Risk tier breakdown (all 5 tiers)
        SUM(CASE WHEN pred.risk_tier = 5 THEN 1 ELSE 0 END) as "tier5Count",
        SUM(CASE WHEN pred.risk_tier = 4 THEN 1 ELSE 0 END) as "tier4Count",
        SUM(CASE WHEN pred.risk_tier = 3 THEN 1 ELSE 0 END) as "tier3Count",
        SUM(CASE WHEN pred.risk_tier = 2 THEN 1 ELSE 0 END) as "tier2Count",
        SUM(CASE WHEN pred.risk_tier = 1 THEN 1 ELSE 0 END) as "tier1Count",
        
        -- Also keep grouped counts for display (Critical, High, Medium)
        SUM(CASE WHEN pred.risk_tier = 5 THEN 1 ELSE 0 END) as "criticalCount",
        SUM(CASE WHEN pred.risk_tier = 4 THEN 1 ELSE 0 END) as "highCount",
        SUM(CASE WHEN pred.risk_tier = 3 THEN 1 ELSE 0 END) as "mediumCount",
        SUM(CASE WHEN pred.risk_tier <= 2 THEN 1 ELSE 0 END) as "lowCount",
        
        -- Risk metrics
        ROUND(AVG(pred.risk_score), 3) as "avgRiskScore",
        MAX(pred.risk_score) as "maxRiskScore",
        
        -- Financial metrics
        SUM(fp.window_cost) as "totalEstimatedCost",
        SUM(fp.intervention_cost) as "totalInterventionCost",
        SUM(fp.expected_savings) as "totalPotentialSavings",
        SUM(fp.net_benefit) as "totalNetBenefit",
        ROUND(
          (SUM(fp.net_benefit) / NULLIF(SUM(fp.intervention_cost), 0) * 100),
          2
        ) as "avgRoiPercent"
        
      FROM departments d
      LEFT JOIN patients p ON d.department_id = p.department_id
      LEFT JOIN predictions pred ON p.patient_id = pred.patient_id
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true
      GROUP BY d.department_id, d.department_code, d.department_name, d.specialty_type
      HAVING COUNT(DISTINCT p.patient_id) > 0
      ORDER BY "totalPatients" DESC`,
      [predictionWindow]
    );

    return result.rows;
  },

  /**
   * Get members by department and risk tier(s)
   * Returns: Detailed member information for specific department and tiers
   */
  getMembersByDepartment: async (departmentName, predictionWindow = '30_day', tiers = [], limit = 1000, offset = 0) => {
    // If no tiers specified, return all members from department
    const tierFilter = tiers && tiers.length > 0
      ? `AND pred.risk_tier = ANY($3::int[])`
      : '';
    
    const params = tiers && tiers.length > 0
      ? [departmentName, predictionWindow, tiers, limit, offset]
      : [departmentName, predictionWindow, limit, offset];
    
    const limitOffset = tiers && tiers.length > 0 ? '$4 OFFSET $5' : '$3 OFFSET $4';

    const result = await query(
      `SELECT
        p.patient_id as id,
        p.external_id as "externalId",
        CONCAT('Patient ', p.external_id) as name,
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
      INNER JOIN departments d ON p.department_id = d.department_id
      INNER JOIN predictions pred ON p.patient_id = pred.patient_id
      LEFT JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE d.department_name = $1
        AND pred.prediction_window = $2
        ${tierFilter}
        AND p.is_active = true
        AND pred.is_active = true
      ORDER BY pred.risk_score DESC
      LIMIT ${limitOffset}`,
      params
    );

    return result.rows;
  },

  /**
   * Get patient counts by tier for intervention planning
   */
  getTierCounts: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        pred.risk_tier,
        COUNT(DISTINCT p.patient_id) as patient_count,
        ROUND(AVG(fp.success_rate) * 100, 1) as avg_success_rate
      FROM patients p
      JOIN predictions pred ON p.patient_id = pred.patient_id
      JOIN financial_projections fp ON pred.prediction_id = fp.prediction_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true
      GROUP BY pred.risk_tier
      ORDER BY pred.risk_tier DESC`,
      [predictionWindow]
    );
    return result.rows;
  },

  /**
   * Get ROI financial impact metrics
   * Returns: Projected costs, actual costs with intervention, savings, prevented hospitalizations
   */
  getROIFinancialImpact: async (predictionWindow = '30_day') => {
    const result = await query(
      `SELECT
        -- Total projected costs (without intervention)
        SUM(fp.window_cost) as "projectedCosts",
        
        -- Total intervention costs
        SUM(fp.intervention_cost) as "interventionCosts",
        
        -- Expected savings
        SUM(fp.expected_savings) as "totalSavings",
        
        -- Actual costs (with intervention) = window_cost - expected_savings
        SUM(fp.window_cost - fp.expected_savings) as "actualCosts",
        
        -- Savings percentage
        ROUND(
          (SUM(fp.expected_savings) / NULLIF(SUM(fp.window_cost), 0) * 100),
          2
        ) as "savingsPercentage",
        
        -- High-risk members count (tiers 4+5) - these are the ones we're preventing hospitalization for
        SUM(CASE WHEN pred.risk_tier >= 4 THEN 1 ELSE 0 END) as "preventedHospitalizations",
        
        -- Also return total high-risk members for reference
        SUM(CASE WHEN pred.risk_tier >= 4 THEN 1 ELSE 0 END) as "highRiskMembers"
        
      FROM financial_projections fp
      INNER JOIN predictions pred ON fp.prediction_id = pred.prediction_id
      INNER JOIN patients p ON pred.patient_id = p.patient_id
      WHERE pred.prediction_window = $1
        AND p.is_active = true
        AND pred.is_active = true`,
      [predictionWindow]
    );

    return result.rows[0];
  },
};

export default Dashboard;
