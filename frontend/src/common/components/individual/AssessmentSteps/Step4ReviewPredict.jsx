import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import styles from './AssessmentSteps.module.css';

/**
 * Step 4: Review & Predict
 * Shows assessment summary and triggers ML prediction
 * Updated to match ML model's 19 raw input fields
 */
const Step4ReviewPredict = ({ data, onPredict, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { demographics, conditions, utilization } = data;

  const getConditionLabel = (key) => {
    const labels = {
      has_alzheimers: "Alzheimer's Disease",
      has_chf: 'Congestive Heart Failure (CHF)',
      has_ckd: 'Chronic Kidney Disease (CKD)',
      has_cancer: 'Cancer',
      has_copd: 'COPD',
      has_depression: 'Depression',
      has_diabetes: 'Diabetes Mellitus',
      has_ischemic_heart: 'Ischemic Heart Disease',
      has_ra_oa: 'Rheumatoid Arthritis / Osteoarthritis',
      has_stroke: 'Stroke / TIA',
      has_esrd: 'End-Stage Renal Disease (ESRD)'
    };
    return labels[key] || key;
  };

  const getRaceLabel = (raceCode) => {
    const races = {
      '1': 'White',
      '2': 'Black/African American',
      '3': 'Other',
      '5': 'Hispanic/Latino'
    };
    return races[raceCode] || 'Unknown';
  };

  const selectedConditions = Object.keys(conditions).filter(key => conditions[key]);

  const handlePredict = async () => {
    setIsSubmitting(true);
    try {
      // Call ML prediction API with complete assessment data
      const result = await onPredict(data);

      if (result && result.success) {
        // Store report data including ML predictions and patient_id
        const reportData = {
          demographics,
          conditions,
          utilization,
          predictions: result.predictions,
          explanations: result.explanations, // Add SHAP explanations
          patient_id_db: result.patient_id_db, // Database ID for linking to org side
          timestamp: new Date().toISOString()
        };

        sessionStorage.setItem('assessmentReport', JSON.stringify(reportData));
        navigate('/report');
      } else {
        alert(`Prediction failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 4 of 4: Review & Predict</h3>

      {/* Assessment Summary */}
      <div className={styles.reviewSection}>
        <h4 className={styles.sectionTitle}>📋 Assessment Summary</h4>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h5>👤 Demographics</h5>
            <p><strong>Age:</strong> {demographics.age} years</p>
            <p><strong>Gender:</strong> {demographics.gender === 'male' ? 'Male' : 'Female'}</p>
            <p><strong>Race/Ethnicity:</strong> {getRaceLabel(demographics.race)}</p>
            <p><strong>Annual Healthcare Cost:</strong> ${Number(demographics.total_annual_cost).toLocaleString()}</p>
          </div>

          <div className={styles.summaryCard}>
            <h5>🏥 Chronic Conditions</h5>
            {selectedConditions.length > 0 ? (
              selectedConditions.map(condition => (
                <p key={condition}>• {getConditionLabel(condition)}</p>
              ))
            ) : (
              <p>No chronic conditions reported</p>
            )}
          </div>

          <div className={styles.summaryCard}>
            <h5>📊 Healthcare Utilization (Past 12 Months)</h5>
            <p><strong>Hospital Admissions:</strong> {utilization.total_admissions || 0}</p>
            <p><strong>Total Hospital Days:</strong> {utilization.total_hospital_days || 0}</p>
            <p><strong>Days Since Last Admission:</strong> {utilization.days_since_last_admission || 'Never'}</p>
            <p><strong>Outpatient Visits:</strong> {utilization.total_outpatient_visits || 0}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handlePredict}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Predicting...' : '🎯 Predict Risk & ROI'}
        </button>
      </div>
    </div>
  );
};

export default Step4ReviewPredict;
