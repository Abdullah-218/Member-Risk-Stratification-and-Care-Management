import React from 'react';
import Input from '../../common/Input/Input';
import styles from './AssessmentSteps.module.css';

/**
 * Step 4: Additional Health Metrics
 * Collects additional health measurements and lifestyle information
 */
const Step4HealthMetrics = ({ data, onUpdate }) => {
  const { metrics } = data;

  const handleChange = (field, value) => {
    onUpdate('metrics', field, value);
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 4 of 5: Additional Health Metrics</h3>
      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Total Inpatient Cost ($)"
            type="number"
            value={metrics.totalInpatientCost}
            onChange={(e) => handleChange('totalInpatientCost', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Cost Percentile (0-100)"
            type="number"
            value={metrics.costPercentile}
            onChange={(e) => handleChange('costPercentile', e.target.value)}
            placeholder="50"
          />
          <div className={styles.selectGroup}>
            <label className={styles.label}>High Cost Patient (Top 20%)</label>
            <select
              value={metrics.highCostPatientTop20}
              onChange={(e) => handleChange('highCostPatientTop20', e.target.value)}
              className={styles.select}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <Input
            label="Frailty Score (0.0-1.0)"
            type="number"
            value={metrics.frailtyScore}
            onChange={(e) => handleChange('frailtyScore', e.target.value)}
            placeholder="0.1"
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Complexity Index (0.0-1.0)"
            type="number"
            value={metrics.complexityIndex}
            onChange={(e) => handleChange('complexityIndex', e.target.value)}
            placeholder="0.1"
          />
        </div>
      </div>
    </div>
  );
};

export default Step4HealthMetrics;
