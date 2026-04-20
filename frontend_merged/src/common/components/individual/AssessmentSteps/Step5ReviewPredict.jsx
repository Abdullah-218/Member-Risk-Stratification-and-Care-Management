import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import styles from './AssessmentSteps.module.css';

/**
 * Step 5: Review & Predict
 * Shows assessment summary and prediction results with dynamic follow-up recommendations
 */
const Step5ReviewPredict = ({ data, onPredict, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { demographics, conditions, utilization, metrics } = data;

  const getConditionLabel = (key) => {
    const labels = {
      diabetes: 'Diabetes',
      heartDisease: 'Heart Disease',
      copd: 'COPD',
      cancer: 'Cancer',
      kidneyDisease: 'Kidney Disease',
      stroke: 'Stroke',
      depression: 'Depression',
      alzheimers: "Alzheimer's",
      hypertension: 'Hypertension',
      arthritis: 'Arthritis',
      esrd: 'End-Stage Renal Disease (ESRD)',
      chf: 'Congestive Heart Failure (CHF)',
      ckd: 'Chronic Kidney Disease (CKD)',
      ischemicHeartDisease: 'Ischemic Heart Disease'
    };
    return labels[key] || key;
  };

  const selectedConditions = Object.keys(conditions).filter(key => conditions[key]);

  const handlePredict = async () => {
    setIsSubmitting(true);
    try {
      const result = await onPredict();

      if (result && result.success) {
        const reportData = {
          demographics,
          conditions,
          utilization,
          metrics,
          predictions: result.predictions
        };

        sessionStorage.setItem('assessmentReport', JSON.stringify(reportData));
        navigate('/report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 5 of 5: Review & Predict</h3>

      {/* Assessment Summary */}
      <div className={styles.reviewSection}>
        <h4 className={styles.sectionTitle}>📋 Assessment Summary</h4>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h5>👤 Demographics</h5>
            <p>Age: {demographics.age}</p>
            <p>Gender: {demographics.gender}</p>
            <p>Annual Healthcare Cost: ${demographics.annualHealthcareCost}</p>
          </div>

          <div className={styles.summaryCard}>
            <h5>🏥 Chronic Conditions</h5>
            {selectedConditions.length > 0 ? (
              selectedConditions.map(condition => (
                <p key={condition}>{getConditionLabel(condition)}</p>
              ))
            ) : (
              <p>No chronic conditions reported</p>
            )}
          </div>

          <div className={styles.summaryCard}>
            <h5>📊 Healthcare Utilization (12 months)</h5>
            <p>Hospital Admissions: {utilization.hospitalAdmissions}</p>
            <p>Total Hospital Days: {utilization.totalHospitalDays}</p>
            <p>Days Since Last Admission: {utilization.daysSinceLastAdmission}</p>
            <p>Recent Admission (Past 30 days): {utilization.recentAdmissionPast30Days}</p>
            <p>Outpatient Visits: {utilization.outpatientVisits}</p>
            <p>High Outpatient User (&gt;12 visits): {utilization.highOutpatientUser}</p>
            <p>ER/ED Visits: {utilization.erEdVisits}</p>
            <p>Specialist Visits: {utilization.specialistVisits}</p>
          </div>

          <div className={styles.summaryCard}>
            <h5>💓 Health Metrics</h5>
            <p>Total Inpatient Cost: ${metrics.totalInpatientCost}</p>
            <p>Cost Percentile: {metrics.costPercentile}</p>
            <p>High Cost Patient (Top 20%): {metrics.highCostPatientTop20}</p>
            <p>Frailty Score: {metrics.frailtyScore}</p>
            <p>Complexity Index: {metrics.complexityIndex}</p>
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

export default Step5ReviewPredict;
