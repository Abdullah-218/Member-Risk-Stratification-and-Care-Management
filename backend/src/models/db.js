import { query } from '../config/database.js';

/**
 * =====================================
 * PATIENT/MEMBER QUERIES
 * =====================================
 */

export const Patient = {
  /**
   * Get all patients with pagination and filtering
   */
  getAll: async (limit = 20, offset = 0, filters = {}) => {
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (filters.search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex}% OR p.external_id ILIKE $${paramIndex}%)`;
      params.push(filters.search);
      paramIndex++;
    }

    if (filters.department) {
      whereClause += ` AND d.dept_code = $${paramIndex}`;
      params.push(filters.department);
      paramIndex++;
    }

    const result = await query(
      `SELECT p.*, d.dept_name, d.dept_code
       FROM patients p
       LEFT JOIN departments d ON p.dept_id = d.department_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return result.rows;
  },

  /**
   * Get patient by ID with predictions
   */
  getById: async (patientId) => {
    const result = await query(
      `SELECT p.*, d.dept_name, d.dept_code
       FROM patients p
       LEFT JOIN departments d ON p.dept_id = d.department_id
       WHERE p.patient_id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) return null;

    const patient = result.rows[0];

    // Get predictions
    const predictions = await query(
      `SELECT prediction_window, risk_score, risk_tier, tier_label
       FROM predictions
       WHERE patient_id = $1`,
      [patientId]
    );

    // Get financial projections
    const projections = await query(
      `SELECT prediction_window, risk_tier, window_cost, intervention_cost, 
              expected_savings, net_benefit, roi_percent, roi_category
       FROM financial_projections
       WHERE patient_id = $1`,
      [patientId]
    );

    return {
      ...patient,
      predictions: predictions.rows,
      financialProjections: projections.rows,
    };
  },

  /**
   * Create new patient
   */
  create: async (patientData) => {
    const {
      org_id,
      dept_id,
      external_id,
      name,
      age,
      gender,
      race,
      annual_cost,
    } = patientData;

    const result = await query(
      `INSERT INTO patients 
       (org_id, dept_id, external_id, name, age, gender, race, annual_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [org_id, dept_id, external_id, name, age, gender, race, annual_cost]
    );

    return result.rows[0];
  },

  /**
   * Update patient
   */
  update: async (patientId, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const result = await query(
      `UPDATE patients SET ${setClause}, updated_at = NOW()
       WHERE patient_id = $${keys.length + 1}
       RETURNING *`,
      [...values, patientId]
    );

    return result.rows[0];
  },

  /**
   * Count total patients
   */
  count: async (filters = {}) => {
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (filters.department) {
      whereClause += ` AND d.dept_code = $1`;
      params.push(filters.department);
    }

    const result = await query(
      `SELECT COUNT(*) as total FROM patients p
       LEFT JOIN departments d ON p.dept_id = d.department_id
       ${whereClause}`,
      params
    );

    return parseInt(result.rows[0].total);
  },
};

/**
 * =====================================
 * PREDICTION QUERIES
 * =====================================
 */

export const Prediction = {
  /**
   * Get predictions for a patient
   */
  getByPatientId: async (patientId) => {
    const result = await query(
      `SELECT * FROM predictions
       WHERE patient_id = $1
       ORDER BY prediction_window`,
      [patientId]
    );

    return result.rows;
  },

  /**
   * Save prediction
   */
  save: async (predictionData) => {
    const {
      patient_id,
      prediction_window,
      risk_score,
      risk_tier,
      tier_label,
      model_name,
      model_version,
    } = predictionData;

    const result = await query(
      `INSERT INTO predictions 
       (patient_id, prediction_window, risk_score, risk_tier, tier_label, model_name, model_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, prediction_window, risk_score, risk_tier, tier_label, model_name, model_version]
    );

    return result.rows[0];
  },

  /**
   * Get aggregate prediction stats
   */
  getStats: async (window) => {
    const result = await query(
      `SELECT 
        risk_tier,
        COUNT(*) as count,
        AVG(risk_score) as avg_risk_score
       FROM predictions
       WHERE prediction_window = $1
       GROUP BY risk_tier
       ORDER BY risk_tier`,
      [window]
    );

    return result.rows;
  },
};

/**
 * =====================================
 * FINANCIAL PROJECTION QUERIES
 * =====================================
 */

export const FinancialProjection = {
  /**
   * Get projections for a patient
   */
  getByPatientId: async (patientId) => {
    const result = await query(
      `SELECT * FROM financial_projections
       WHERE patient_id = $1
       ORDER BY prediction_window`,
      [patientId]
    );

    return result.rows;
  },

  /**
   * Save projection
   */
  save: async (projectionData) => {
    const {
      patient_id,
      prediction_id,
      prediction_window,
      risk_tier,
      window_cost,
      addressable_cost,
      intervention_cost,
      success_rate,
      expected_savings,
      net_benefit,
      roi_percent,
      roi_category,
    } = projectionData;

    const result = await query(
      `INSERT INTO financial_projections 
       (patient_id, prediction_id, prediction_window, risk_tier, window_cost, 
        addressable_cost, intervention_cost, success_rate, expected_savings, 
        net_benefit, roi_percent, roi_category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        patient_id,
        prediction_id,
        prediction_window,
        risk_tier,
        window_cost,
        addressable_cost,
        intervention_cost,
        success_rate,
        expected_savings,
        net_benefit,
        roi_percent,
        roi_category,
      ]
    );

    return result.rows[0];
  },

  /**
   * Get ROI summary
   */
  getSummary: async (window) => {
    const result = await query(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN roi_percent > 0 THEN 1 END) as positive_roi_count,
        AVG(roi_percent) as avg_roi,
        AVG(expected_savings) as avg_savings
       FROM financial_projections
       WHERE prediction_window = $1`,
      [window]
    );

    return result.rows[0];
  },
};

/**
 * =====================================
 * DEPARTMENT QUERIES
 * =====================================
 */

export const Department = {
  /**
   * Get all departments
   */
  getAll: async () => {
    const result = await query(
      `SELECT * FROM departments
       ORDER BY dept_code`
    );

    return result.rows;
  },

  /**
   * Get department by ID
   */
  getById: async (departmentId) => {
    const result = await query(
      `SELECT * FROM departments
       WHERE department_id = $1`,
      [departmentId]
    );

    return result.rows[0] || null;
  },

  /**
   * Get patient count by department
   */
  getPatientStats: async () => {
    const result = await query(
      `SELECT d.department_id, d.dept_code, d.dept_name, COUNT(p.patient_id) as patient_count
       FROM departments d
       LEFT JOIN patients p ON d.department_id = p.dept_id
       GROUP BY d.department_id, d.dept_code, d.dept_name
       ORDER BY d.dept_code`
    );

    return result.rows;
  },
};

/**
 * =====================================
 * USER/AUTH QUERIES
 * =====================================
 */

export const User = {
  /**
   * Get user by email
   */
  getByEmail: async (email) => {
    const result = await query(
      `SELECT * FROM users
       WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;
  },

  /**
   * Create new user
   */
  create: async (userData) => {
    const { email, password_hash, name, user_type, role } = userData;

    const result = await query(
      `INSERT INTO users (email, password_hash, name, user_type, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, user_type, role`,
      [email, password_hash, name, user_type, role]
    );

    return result.rows[0];
  },
};

export default {
  Patient,
  Prediction,
  FinancialProjection,
  Department,
  User,
};
