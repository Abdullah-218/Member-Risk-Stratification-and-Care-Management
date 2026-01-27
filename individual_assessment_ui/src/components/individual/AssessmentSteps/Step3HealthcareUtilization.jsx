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
      <h3 className={styles.stepTitle}>Step 3 of 5: Healthcare Utilization (Past 12 Months)</h3>
      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Hospital Admissions"
            type="number"
            value={utilization.hospitalAdmissions}
            onChange={(e) => handleChange('hospitalAdmissions', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Total Hospital Days"
            type="number"
            value={utilization.totalHospitalDays}
            onChange={(e) => handleChange('totalHospitalDays', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Days Since Last Admission"
            type="number"
            value={utilization.daysSinceLastAdmission}
            onChange={(e) => handleChange('daysSinceLastAdmission', e.target.value)}
            placeholder="365"
          />
          <div className={styles.selectGroup}>
            <label className={styles.label}>Recent Admission (Past 30 days)</label>
            <select
              value={utilization.recentAdmissionPast30Days}
              onChange={(e) => handleChange('recentAdmissionPast30Days', e.target.value)}
              className={styles.select}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <Input
            label="Outpatient Visits"
            type="number"
            value={utilization.outpatientVisits}
            onChange={(e) => handleChange('outpatientVisits', e.target.value)}
            placeholder="0"
          />
          <div className={styles.selectGroup}>
            <label className={styles.label}>High Outpatient User (&gt;12 visits)</label>
            <select
              value={utilization.highOutpatientUser}
              onChange={(e) => handleChange('highOutpatientUser', e.target.value)}
              className={styles.select}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <Input
            label="ER/ED Visits"
            type="number"
            value={utilization.erEdVisits}
            onChange={(e) => handleChange('erEdVisits', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Specialist Visits"
            type="number"
            value={utilization.specialistVisits}
            onChange={(e) => handleChange('specialistVisits', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default Step3HealthcareUtilization;
