import express from 'express';
import Dashboard from '../models/dashboard.js';

const router = express.Router();

/**
 * GET /api/dashboard/summary
 * Get dashboard summary for a specific prediction window
 * 
 * Query: ?window=30_day|60_day|90_day
 * Response: { success, data: { total_members, risk_distribution, financials } }
 */
router.get('/summary', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    
    const summary = await Dashboard.getSummary(window);
    
    res.json({
      success: true,
      window,
      data: {
        totalMembers: parseInt(summary.total_members) || 0,
        riskDistribution: {
          tier5Critical: parseInt(summary.tier_5_critical) || 0,
          tier4High: parseInt(summary.tier_4_high) || 0,
          tier3Moderate: parseInt(summary.tier_3_moderate) || 0,
          tier2LowModerate: parseInt(summary.tier_2_low_moderate) || 0,
          tier1Low: parseInt(summary.tier_1_low) || 0,
        },
        financials: {
          projectedCost: parseFloat(summary.total_projected_cost) || 0,
          interventionCost: parseFloat(summary.total_intervention_cost) || 0,
          potentialSavings: parseFloat(summary.total_potential_savings) || 0,
          netBenefit: parseFloat(summary.total_net_benefit) || 0,
          avgRoi: parseFloat(summary.avg_roi_percent) || 0,
        },
        highRisk: {
          count: parseInt(summary.high_risk_count) || 0,
          percentage: parseFloat(summary.high_risk_percentage) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/members
 * Get members with risk scores for distribution chart
 * 
 * Query: ?window=30_day&limit=100&offset=0
 * Response: { success, data: [...members] }
 */
router.get('/members', async (req, res) => {
  try {
    const { window = '30_day', limit = 100, offset = 0 } = req.query;
    
    const members = await Dashboard.getRiskDistribution(
      window,
      parseInt(limit),
      parseInt(offset)
    );
    
    // Transform for frontend
    const transformedMembers = members.map(m => ({
      id: m.id,
      externalId: m.external_id,
      age: m.age,
      gender: m.gender,
      department: m.department,
      deptCode: m.dept_code,
      riskScore: parseFloat(m.risk_score),
      riskTier: m.risk_tier,
      tierLabel: m.tier_label,
      estimatedCost: parseFloat(m.estimated_cost) || 0,
      interventionCost: parseFloat(m.intervention_cost) || 0,
      expectedSavings: parseFloat(m.expected_savings) || 0,
      netBenefit: parseFloat(m.net_benefit) || 0,
      roiPercent: parseFloat(m.roi_percent) || 0,
      roiCategory: m.roi_category,
      conditions: m.conditions || [], // ✅ Add conditions
    }));
    
    res.json({
      success: true,
      window,
      count: transformedMembers.length,
      data: transformedMembers,
    });
  } catch (error) {
    console.error('Dashboard members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/tiers
 * Get statistics by risk tier
 * 
 * Query: ?window=30_day
 * Response: { success, data: [...tiers] }
 */
router.get('/tiers', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    
    const tiers = await Dashboard.getTierStatistics(window);
    
    const transformedTiers = tiers.map(t => ({
      tier: t.risk_tier,
      label: t.tier_label,
      count: parseInt(t.member_count),
      avgRiskScore: parseFloat(t.avg_risk_score),
      minRiskScore: parseFloat(t.min_risk_score),
      maxRiskScore: parseFloat(t.max_risk_score),
      totalCost: parseFloat(t.total_cost) || 0,
      totalInterventionCost: parseFloat(t.total_intervention_cost) || 0,
      totalSavings: parseFloat(t.total_savings) || 0,
      totalNetBenefit: parseFloat(t.total_net_benefit) || 0,
      avgRoi: parseFloat(t.avg_roi) || 0,
    }));
    
    res.json({
      success: true,
      window,
      data: transformedTiers,
    });
  } catch (error) {
    console.error('Dashboard tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tier statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/departments
 * Get department-wise summary
 * 
 * Query: ?window=30_day
 */
router.get('/departments', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    
    const departments = await Dashboard.getDepartmentSummary(window);
    
    const transformedDepts = departments.map(d => ({
      id: d.department_id,
      code: d.department_code,
      name: d.department_name,
      specialty: d.specialty_type,
      totalMembers: parseInt(d.total_members),
      avgRiskScore: parseFloat(d.avg_risk_score),
      highRiskCount: parseInt(d.high_risk_count),
      potentialSavings: parseFloat(d.total_potential_savings) || 0,
      avgRoi: parseFloat(d.avg_roi) || 0,
    }));
    
    res.json({
      success: true,
      window,
      data: transformedDepts,
    });
  } catch (error) {
    console.error('Dashboard departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department summary',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/priority
 * Get top priority patients (highest ROI)
 * 
 * Query: ?window=30_day&limit=10
 */
router.get('/priority', async (req, res) => {
  try {
    const { window = '30_day', limit = 10 } = req.query;
    
    const patients = await Dashboard.getPriorityPatients(window, parseInt(limit));
    
    const transformedPatients = patients.map(p => ({
      id: p.id,
      externalId: p.external_id,
      age: p.age,
      gender: p.gender,
      department: p.department,
      riskScore: parseFloat(p.risk_score),
      riskTier: p.risk_tier,
      tierLabel: p.tier_label,
      windowCost: parseFloat(p.window_cost),
      interventionCost: parseFloat(p.intervention_cost),
      expectedSavings: parseFloat(p.expected_savings),
      netBenefit: parseFloat(p.net_benefit),
      roiPercent: parseFloat(p.roi_percent),
      roiCategory: p.roi_category,
    }));
    
    res.json({
      success: true,
      window,
      count: transformedPatients.length,
      data: transformedPatients,
    });
  } catch (error) {
    console.error('Dashboard priority error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch priority patients',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/trends
 * Get trend data across all windows
 */
router.get('/trends', async (req, res) => {
  try {
    const trends = await Dashboard.getTrendData();
    
    const transformedTrends = trends.map(t => ({
      window: t.prediction_window,
      totalMembers: parseInt(t.total_members),
      avgRiskScore: parseFloat(t.avg_risk_score),
      highRiskCount: parseInt(t.high_risk_count),
      totalCost: parseFloat(t.total_cost),
      totalSavings: parseFloat(t.total_savings),
      avgRoi: parseFloat(t.avg_roi),
    }));
    
    res.json({
      success: true,
      data: transformedTrends,
    });
  } catch (error) {
    console.error('Dashboard trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/tier-financials
 * Get tier-level financial breakdown (matches ML model output)
 * 
 * Query: ?window=30_day|60_day|90_day
 * Response: { success, data: [...tier financials] }
 */
router.get('/tier-financials', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    
    const tierFinancials = await Dashboard.getTierFinancials(window);
    
    res.json({
      success: true,
      window,
      data: tierFinancials,
    });
  } catch (error) {
    console.error('Dashboard tier financials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tier financials',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/members-by-tier
 * Get members filtered by risk tier(s) and prediction window
 * 
 * Query params:
 *  - window: 30_day|60_day|90_day (default: 30_day)
 *  - tiers: comma-separated tier numbers (e.g., "4,5" for high+critical) or empty for all
 *  - limit: number of results (default: 100)
 *  - offset: pagination offset (default: 0)
 * 
 * Response: { success, data: [...members], total, window, tiers }
 */
router.get('/members-by-tier', async (req, res) => {
  try {
    const { 
      window = '30_day', 
      tiers = '', 
      limit = '100', 
      offset = '0' 
    } = req.query;
    
    // Parse tiers from comma-separated string to array of integers
    const tierArray = tiers 
      ? tiers.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t) && t >= 1 && t <= 5)
      : [];
    
    const members = await Dashboard.getMembersByTier(
      window,
      tierArray,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      window,
      tiers: tierArray.length > 0 ? tierArray : 'all',
      total: members.length,
      data: members,
    });
  } catch (error) {
    console.error('Dashboard members-by-tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members by tier',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/department-analytics
 * Get detailed department analytics with risk tier breakdown
 * 
 * Query params:
 *  - window: 30_day|60_day|90_day (default: 30_day)
 * 
 * Response: { success, data: [...departments with tier breakdown] }
 */
router.get('/department-analytics', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    
    const departments = await Dashboard.getDepartmentAnalytics(window);
    
    res.json({
      success: true,
      window,
      total: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error('Dashboard department-analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department analytics',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/department-members
 * Get members from a specific department filtered by risk tiers
 * Query params: departmentName, window, tiers (comma-separated)
 */
router.get('/department-members', async (req, res) => {
  try {
    const { 
      departmentName, 
      window = '30_day',
      tiers = '',
      limit = 1000,
      offset = 0
    } = req.query;
    
    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }
    
    // Parse tiers from comma-separated string to array of integers
    const tierArray = tiers 
      ? tiers.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t))
      : [];
    
    const members = await Dashboard.getMembersByDepartment(
      departmentName,
      window,
      tierArray,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      departmentName,
      window,
      tiers: tierArray,
      total: members.length,
      data: members,
    });
  } catch (error) {
    console.error('Dashboard department-members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department members',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/tier-counts
 * Get patient counts by risk tier
 * Query params: window (30_day|60_day|90_day)
 */
router.get('/tier-counts', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    console.log(`📊 Fetching tier counts for window: ${window}`);

    const tierCounts = await Dashboard.getTierCounts(window);
    console.log('📋 Raw tier counts from DB:', tierCounts);

    // Transform to object for easier access
    const counts = {};
    tierCounts.forEach(tier => {
      console.log('Processing tier:', tier);
      const tierNum = tier.riskTier || tier.risk_tier;
      const patientCount = tier.patientCount || tier.patient_count;
      const successRate = tier.avgSuccessRate || tier.avg_success_rate;
      counts[`tier${tierNum}`] = {
        count: parseInt(patientCount),
        successRate: parseFloat(successRate)
      };
    });

    console.log('✅ Transformed counts:', counts);

    res.json({
      success: true,
      window,
      data: counts
    });
  } catch (error) {
    console.error('❌ Error fetching tier counts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/roi-financial-impact
 * Get ROI financial impact metrics for a specific window
 * Query params: window (30_day|60_day|90_day)
 */
router.get('/roi-financial-impact', async (req, res) => {
  try {
    const { window = '30_day' } = req.query;
    
    const financialImpact = await Dashboard.getROIFinancialImpact(window);
    
    res.json({
      success: true,
      window,
      data: financialImpact,
    });
  } catch (error) {
    console.error('Dashboard roi-financial-impact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ROI financial impact',
      error: error.message,
    });
  }
});

export default router;
