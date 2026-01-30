import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ML Prediction Service
 * Integrates Node.js backend with Python ML model
 * 
 * Transforms frontend assessment data → Python format
 * Calls Python script with JSON input
 * Returns predictions + patient_id + ROI calculations
 */

/**
 * Transform frontend assessment data to Python ML model format
 * 
 * Frontend structure:
 * {
 *   demographics: { age, gender, race, total_annual_cost },
 *   conditions: { has_alzheimers, has_chf, ... },
 *   utilization: { total_admissions, total_hospital_days, ... }
 * }
 * 
 * Python expects flat structure with 19 raw fields
 */
function transformToPythonFormat(assessmentData) {
  const { demographics, conditions, utilization } = assessmentData;

  // Convert gender: 'male' → 1, 'female' → 2
  const genderCode = demographics.gender === 'male' ? 1 : 2;

  // Convert race to integer
  const raceCode = parseInt(demographics.race) || 1; // Default to 1 (White)

  // Build Python-compatible input object (19 fields)
  const pythonInput = {
    // Demographics (4 fields)
    age: parseInt(demographics.age) || 65,
    gender: genderCode,
    race: raceCode,
    total_annual_cost: parseFloat(demographics.total_annual_cost) || 0,

    // Chronic Conditions (11 fields) - boolean → 0/1
    has_alzheimers: conditions.has_alzheimers ? 1 : 0,
    has_chf: conditions.has_chf ? 1 : 0,
    has_ckd: conditions.has_ckd ? 1 : 0,
    has_cancer: conditions.has_cancer ? 1 : 0,
    has_copd: conditions.has_copd ? 1 : 0,
    has_depression: conditions.has_depression ? 1 : 0,
    has_diabetes: conditions.has_diabetes ? 1 : 0,
    has_ischemic_heart: conditions.has_ischemic_heart ? 1 : 0,
    has_ra_oa: conditions.has_ra_oa ? 1 : 0,
    has_stroke: conditions.has_stroke ? 1 : 0,
    has_esrd: conditions.has_esrd ? 1 : 0,

    // Utilization (4 fields) - string → float
    total_admissions: parseFloat(utilization.total_admissions) || 0,
    total_hospital_days: parseFloat(utilization.total_hospital_days) || 0,
    days_since_last_admission: parseFloat(utilization.days_since_last_admission) || 999,
    total_outpatient_visits: parseFloat(utilization.total_outpatient_visits) || 0
  };

  return pythonInput;
}

/**
 * Call Python ML script with patient data
 * Returns predictions, ROI calculations, and patient_id from database
 * 
 * @param {Object} assessmentData - Frontend assessment data
 * @param {Object} options - Additional options (patient_id, save_to_db)
 * @returns {Promise<Object>} - ML predictions and metadata
 */
export async function predictPatientRisk(assessmentData, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Transform frontend data to Python format
      const pythonInput = transformToPythonFormat(assessmentData);

      // Path to Python script
      const pythonScriptPath = path.join(
        __dirname,
        '../../../healthcare-risk-ml/new_patient_risk_prediction.py'
      );

      // Generate unique patient ID if not provided
      const patientId = options.patient_id || `WEB_${Date.now()}`;

      // Prepare command arguments
      const args = [
        pythonScriptPath,
        '--json-input',
        JSON.stringify(pythonInput),
        '--patient-id',
        patientId,
        '--save-to-db',
        options.save_to_db !== false ? 'true' : 'false'
      ];

      console.log('🔮 Calling Python ML model...');
      console.log(`   Patient ID: ${patientId}`);
      console.log(`   Input fields: ${Object.keys(pythonInput).length}`);

      // Spawn Python process
      const python = spawn('python3', args, {
        cwd: path.join(__dirname, '../../../healthcare-risk-ml')
      });

      let dataString = '';
      let errorString = '';

      // Collect stdout (JSON output)
      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      // Collect stderr (logs and errors)
      python.stderr.on('data', (data) => {
        errorString += data.toString();
        // Log Python errors in real-time
        console.error('Python stderr:', data.toString());
      });

      // Handle process completion
      python.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ Python script failed');
          console.error('Error output:', errorString);
          reject(new Error(`Python script exited with code ${code}: ${errorString}`));
          return;
        }

        try {
          // Parse JSON output from Python
          const result = JSON.parse(dataString);
          
          console.log('✅ ML prediction successful');
          console.log(`   Patient DB ID: ${result.patient_id_db}`);
          console.log(`   Risk Tiers: 30d=${result.predictions['30_day'].tier}, 60d=${result.predictions['60_day'].tier}, 90d=${result.predictions['90_day'].tier}`);

          resolve(result);
        } catch (parseError) {
          console.error('❌ Failed to parse Python output');
          console.error('Raw output:', dataString);
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });

      // Handle spawn errors
      python.on('error', (err) => {
        console.error('❌ Failed to spawn Python process:', err);
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });

    } catch (error) {
      console.error('❌ Error in predictPatientRisk:', error);
      reject(error);
    }
  });
}

/**
 * Transform Python ML output to frontend format
 * 
 * Python returns:
 * {
 *   patient_id, patient_id_db, patient_data,
 *   predictions: { 30_day: {risk_score, tier, ...}, 60_day: {...}, 90_day: {...} },
 *   projection: { 30_day: {roi_percent, ...}, 60_day: {...}, 90_day: {...} },
 *   explanations: { 30_day: {top_drivers: [...], base_risk, predicted_risk}, ... }
 * }
 * 
 * Frontend expects:
 * {
 *   success: true,
 *   patient_id_db,
 *   predictions: { '30-day': {...}, '60-day': {...}, '90-day': {...} },
 *   explanations: { '30-day': {...}, '60-day': {...}, '90-day': {...} }
 * }
 */
export function transformPythonOutputToFrontend(pythonResult) {
  const { patient_id_db, predictions, projection, explanations } = pythonResult;

  // Transform window names: 30_day → '30-day'
  const frontendPredictions = {};

  for (const [window, predData] of Object.entries(predictions)) {
    const frontendWindow = window.replace('_', '-');
    const proj = projection[window];

    frontendPredictions[frontendWindow] = {
      // Risk assessment
      riskScore: (predData.risk_score * 100).toFixed(1), // 0-1 → 0-100%
      riskTier: predData.tier,
      tierLabel: predData.tier_label,
      description: predData.description,

      // Financial projections
      projectedCost: proj.projected_cost.toFixed(2),
      interventionCost: proj.intervention_cost.toFixed(2),
      expectedSavings: proj.expected_savings.toFixed(2),
      netBenefit: proj.net_benefit.toFixed(2),
      roiPercent: proj.roi_percent.toFixed(1),
      
      // Success rate
      successRate: (proj.success_rate * 100).toFixed(1),
      successRateRange: proj.success_rate_range,

      // Window metadata
      window: proj.label,
      days: proj.days
    };
  }

  // Transform explanations (if available)
  const frontendExplanations = {};
  if (explanations) {
    for (const [window, explData] of Object.entries(explanations)) {
      const frontendWindow = window.replace('_', '-');
      frontendExplanations[frontendWindow] = explData;
    }
  }

  return {
    success: true,
    patient_id_db,
    predictions: frontendPredictions,
    explanations: explanations ? frontendExplanations : null,
    message: 'Risk prediction completed successfully'
  };
}

export default {
  predictPatientRisk,
  transformPythonOutputToFrontend
};
