import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { query as dbQuery } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/members
 * Get all members with pagination and filtering
 * 
 * Query: ?page=1&limit=20&search=text&riskTier=1-5&department=CARDIOLOGY
 * Response: { success, data: [...], total, page, pages }
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, riskTier, department } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query with filters
    let whereClause = 'WHERE p.organization_id = 1';
    const params = [];
    let paramIndex = 1;

    if (department) {
      whereClause += ` AND d.department_name = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (riskTier) {
      whereClause += ` AND pred_30.risk_tier = $${paramIndex}`;
      params.push(parseInt(riskTier));
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (p.external_id ILIKE $${paramIndex} OR CAST(p.patient_id AS TEXT) ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Query patients with predictions
    const query = `
      SELECT 
        p.patient_id as id,
        p.external_id,
        p.age,
        p.gender,
        p.race,
        p.annual_cost,
        d.department_name as department,
        pred_30.risk_score as risk_score_30,
        pred_30.risk_tier as risk_tier_30,
        pred_30.tier_label as tier_label_30,
        pred_60.risk_score as risk_score_60,
        pred_60.risk_tier as risk_tier_60,
        pred_60.tier_label as tier_label_60,
        pred_90.risk_score as risk_score_90,
        pred_90.risk_tier as risk_tier_90,
        pred_90.tier_label as tier_label_90,
        p.created_at
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN predictions pred_30 ON p.patient_id = pred_30.patient_id AND pred_30.window = '30_day'
      LEFT JOIN predictions pred_60 ON p.patient_id = pred_60.patient_id AND pred_60.window = '60_day'
      LEFT JOIN predictions pred_90 ON p.patient_id = pred_90.patient_id AND pred_90.window = '90_day'
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), offset);

    const result = await dbQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN predictions pred_30 ON p.patient_id = pred_30.patient_id AND pred_30.window = '30_day'
      ${whereClause}
    `;
    const countResult = await dbQuery(countQuery, params.slice(0, params.length - 2));
    const total = parseInt(countResult.rows[0].total);

    // Format data
    const members = result.rows.map(row => ({
      id: row.id,
      externalId: row.external_id,
      age: row.age,
      gender: row.gender,
      race: row.race,
      annualCost: row.annual_cost,
      department: row.department,
      predictions: {
        '30day': {
          riskScore: parseFloat(row.risk_score_30 || 0),
          riskTier: row.risk_tier_30,
          tierLabel: row.tier_label_30,
        },
        '60day': {
          riskScore: parseFloat(row.risk_score_60 || 0),
          riskTier: row.risk_tier_60,
          tierLabel: row.tier_label_60,
        },
        '90day': {
          riskScore: parseFloat(row.risk_score_90 || 0),
          riskTier: row.risk_tier_90,
          tierLabel: row.tier_label_90,
        },
      },
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      data: members,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message,
    });
  }
});

/**
 * GET /api/members/:memberId
 * Get single member detail
 */
router.get('/:memberId', authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;

    // Query patient with all details
    const query = `
      SELECT 
        p.*,
        d.department_name,
        pf.*,
        pred_30.risk_score as risk_score_30,
        pred_30.risk_tier as risk_tier_30,
        pred_30.tier_label as tier_label_30,
        pred_30.tier_description as tier_desc_30,
        pred_60.risk_score as risk_score_60,
        pred_60.risk_tier as risk_tier_60,
        pred_60.tier_label as tier_label_60,
        pred_60.tier_description as tier_desc_60,
        pred_90.risk_score as risk_score_90,
        pred_90.risk_tier as risk_tier_90,
        pred_90.tier_label as tier_label_90,
        pred_90.tier_description as tier_desc_90,
        fp_30.projected_cost as proj_cost_30,
        fp_30.intervention_cost as int_cost_30,
        fp_30.expected_savings as savings_30,
        fp_30.net_benefit as net_30,
        fp_30.roi_percent as roi_30,
        fp_60.projected_cost as proj_cost_60,
        fp_60.intervention_cost as int_cost_60,
        fp_60.expected_savings as savings_60,
        fp_60.net_benefit as net_60,
        fp_60.roi_percent as roi_60,
        fp_90.projected_cost as proj_cost_90,
        fp_90.intervention_cost as int_cost_90,
        fp_90.expected_savings as savings_90,
        fp_90.net_benefit as net_90,
        fp_90.roi_percent as roi_90
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN patient_features pf ON p.patient_id = pf.patient_id
      LEFT JOIN predictions pred_30 ON p.patient_id = pred_30.patient_id AND pred_30.window = '30_day'
      LEFT JOIN predictions pred_60 ON p.patient_id = pred_60.patient_id AND pred_60.window = '60_day'
      LEFT JOIN predictions pred_90 ON p.patient_id = pred_90.patient_id AND pred_90.window = '90_day'
      LEFT JOIN financial_projections fp_30 ON p.patient_id = fp_30.patient_id AND fp_30.window = '30_day'
      LEFT JOIN financial_projections fp_60 ON p.patient_id = fp_60.patient_id AND fp_60.window = '60_day'
      LEFT JOIN financial_projections fp_90 ON p.patient_id = fp_90.patient_id AND fp_90.window = '90_day'
      WHERE p.patient_id = $1 AND p.organization_id = 1
    `;

    const result = await dbQuery(query, [parseInt(memberId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    const row = result.rows[0];

    const member = {
      id: row.patient_id,
      externalId: row.external_id,
      age: row.age,
      gender: row.gender,
      race: row.race,
      department: row.department_name,
      annualCost: row.annual_cost,
      isHighCost: row.is_high_cost,
      dataSource: row.data_source,
      createdAt: row.created_at,
      predictions: {
        '30day': {
          riskScore: parseFloat(row.risk_score_30 || 0),
          riskTier: row.risk_tier_30,
          tierLabel: row.tier_label_30,
          description: row.tier_desc_30,
        },
        '60day': {
          riskScore: parseFloat(row.risk_score_60 || 0),
          riskTier: row.risk_tier_60,
          tierLabel: row.tier_label_60,
          description: row.tier_desc_60,
        },
        '90day': {
          riskScore: parseFloat(row.risk_score_90 || 0),
          riskTier: row.risk_tier_90,
          tierLabel: row.tier_label_90,
          description: row.tier_desc_90,
        },
      },
      financialProjections: {
        '30day': {
          windowCost: parseFloat(row.proj_cost_30 || 0),
          interventionCost: parseFloat(row.int_cost_30 || 0),
          expectedSavings: parseFloat(row.savings_30 || 0),
          netBenefit: parseFloat(row.net_30 || 0),
          roiPercent: parseFloat(row.roi_30 || 0),
        },
        '60day': {
          windowCost: parseFloat(row.proj_cost_60 || 0),
          interventionCost: parseFloat(row.int_cost_60 || 0),
          expectedSavings: parseFloat(row.savings_60 || 0),
          netBenefit: parseFloat(row.net_60 || 0),
          roiPercent: parseFloat(row.roi_60 || 0),
        },
        '90day': {
          windowCost: parseFloat(row.proj_cost_90 || 0),
          interventionCost: parseFloat(row.int_cost_90 || 0),
          expectedSavings: parseFloat(row.savings_90 || 0),
          netBenefit: parseFloat(row.net_90 || 0),
          roiPercent: parseFloat(row.roi_90 || 0),
        },
      },
      features: {
        frailtyScore: row.frailty_score,
        complexityIndex: row.complexity_index,
        totalAdmissions: row.total_admissions_2008,
        totalHospitalDays: row.total_hospital_days_2008,
        totalOutpatientVisits: row.total_outpatient_visits_2008,
      },
    };

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member',
      error: error.message,
    });
  }
});

/**
 * POST /api/members
 * Create new member
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const memberData = req.body;

    // TODO: Validate and insert into database
    const newMember = {
      id: Math.random(),
      ...memberData,
    };

    res.status(201).json({
      success: true,
      message: 'Member created',
      data: newMember,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create member',
      error: error.message,
    });
  }
});

/**
 * PUT /api/members/:memberId
 * Update member information
 */
router.put('/:memberId', authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;
    const updateData = req.body;

    // TODO: Update member in database

    res.json({
      success: true,
      message: 'Member updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message,
    });
  }
});

/**
 * GET /api/members/search
 * Search members by name or ID
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;

    // TODO: Search database for members

    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

export default router;
