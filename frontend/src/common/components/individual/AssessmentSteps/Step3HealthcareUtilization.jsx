import React from 'react';
import Input from '../../common/Input/Input';
import styles from './AssessmentSteps.module.css';

/**
 * Step 3: Healthcare Utilization
 * Collects healthcare utilization data for the past 12 months
 */
const Step3HealthcareUtilization = ({ data, onUpdate }) => {
  const { utilization } = data;

  const handleChange = (field, value) => {
    onUpdate('utilization', field, value);
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 3 of 4: Healthcare Utilization (Past 12 Months)</h3>
      <p className={styles.stepDescription}>
        Please provide your healthcare utilization data from the past 12 months. Enter 0 if none.
      </p>
      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Hospital Admissions"
            type="number"
            value={utilization.total_admissions}
            onChange={(e) => handleChange('total_admissions', e.target.value)}
            placeholder="0"
            min="0"
          />
          <Input
            label="Total Hospital Days"
            type="number"
            value={utilization.total_hospital_days}
            onChange={(e) => handleChange('total_hospital_days', e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Days Since Last Admission"
            type="number"
            value={utilization.days_since_last_admission}
            onChange={(e) => handleChange('days_since_last_admission', e.target.value)}
            placeholder="999 (if never admitted)"
            min="0"
          />
          <Input
            label="Outpatient Visits"
            type="number"
            value={utilization.total_outpatient_visits}
            onChange={(e) => handleChange('total_outpatient_visits', e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

export default Step3HealthcareUtilization;
