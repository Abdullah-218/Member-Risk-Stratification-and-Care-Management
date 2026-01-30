import React from 'react';
import styles from './AssessmentSteps.module.css';

/**
 * Step 2: Chronic Conditions
 * Collects information about existing chronic conditions
 */
const Step2ChronicConditions = ({ data, onUpdate }) => {
  const { conditions } = data;

  // Exact ML model chronic conditions (11 fields)
  const conditionsList = [
    { key: 'has_alzheimers', label: "Alzheimer's Disease" },
    { key: 'has_chf', label: 'Congestive Heart Failure (CHF)' },
    { key: 'has_ckd', label: 'Chronic Kidney Disease (CKD)' },
    { key: 'has_cancer', label: 'Cancer' },
    { key: 'has_copd', label: 'COPD (Chronic Obstructive Pulmonary Disease)' },
    { key: 'has_depression', label: 'Depression' },
    { key: 'has_diabetes', label: 'Diabetes Mellitus' },
    { key: 'has_ischemic_heart', label: 'Ischemic Heart Disease' },
    { key: 'has_ra_oa', label: 'Rheumatoid Arthritis / Osteoarthritis' },
    { key: 'has_stroke', label: 'Stroke / TIA (Transient Ischemic Attack)' },
    { key: 'has_esrd', label: 'End-Stage Renal Disease (ESRD)' }
  ];

  const handleConditionChange = (conditionKey, checked) => {
    onUpdate('conditions', conditionKey, checked);
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 2 of 4: Chronic Conditions</h3>
      <p className={styles.stepDescription}>
        Select any chronic conditions you currently have. These help us assess your health risk accurately.
      </p>
      <div className={styles.form}>
        <div className={styles.label}>Do you have any of these conditions?</div>
        <div className={styles.checkboxGroup}>
          {conditionsList.map(condition => (
            <label key={condition.key} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={conditions[condition.key] || false}
                onChange={(e) => handleConditionChange(condition.key, e.target.checked)}
              />
              <span>{condition.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step2ChronicConditions;
