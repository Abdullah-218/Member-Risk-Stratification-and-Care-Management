import express from 'express';
import { predictPatientRisk, transformPythonOutputToFrontend } from '../services/mlPredictionService.js';

const router = express.Router();

/**
 * POST /api/assessment/predict
 * Calculate risk prediction for individual assessment using ML model
 * 
 * Request: { 
 *   demographics: { age, gender, race, total_annual_cost },
 *   conditions: { has_alzheimers, has_chf, ... },
 *   utilization: { total_admissions, total_hospital_days, ... }
 * }
 * Response: { 
 *   success: true,
 *   patient_id_db: 3003,
 *   predictions: { '30-day': {...}, '60-day': {...}, '90-day': {...} }
 * }
 */
router.post('/predict', async (req, res) => {
  try {
    const assessmentData = req.body;

    console.log('📥 Received assessment prediction request');
    console.log(`   Age: ${assessmentData.demographics?.age}`);
    console.log(`   Conditions: ${Object.values(assessmentData.conditions || {}).filter(Boolean).length}`);

    // Validate required fields
    if (!assessmentData.demographics || !assessmentData.conditions || !assessmentData.utilization) {
      return res.status(400).json({
        success: false,
        message: 'Missing required assessment data (demographics, conditions, or utilization)',
      });
    }

    // Call Python ML model
    const mlResult = await predictPatientRisk(assessmentData, {
      save_to_db: true, // Save patient to database
      patient_id: `WEB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Transform Python output to frontend format
    const frontendResult = transformPythonOutputToFrontend(mlResult);

    console.log('✅ Prediction successful, returning to frontend');

    res.json(frontendResult);

  } catch (error) {
    console.error('❌ Prediction failed:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/assessment/save-report
 * Save assessment report
 */
router.post('/save-report', async (req, res) => {
  try {
    const { assessmentData, predictions, pdfData } = req.body;

    // TODO: Save report to database and file storage

    const reportId = Math.random().toString(36).substr(2, 9);

    res.status(201).json({
      success: true,
      message: 'Report saved',
      reportId,
      url: `/api/assessment/report/${reportId}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save report',
      error: error.message,
    });
  }
});

/**
 * GET /api/assessment/report/:reportId
 * Retrieve saved assessment report
 */
router.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    // TODO: Fetch report from database

    const mockReport = {
      reportId,
      assessmentData: { age: 65, gender: 'M' },
      predictions: {
        '30day': { riskScore: 0.35, riskTier: 2 },
        '60day': { riskScore: 0.45, riskTier: 3 },
        '90day': { riskScore: 0.65, riskTier: 4 },
      },
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockReport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message,
    });
  }
});

export default router;
