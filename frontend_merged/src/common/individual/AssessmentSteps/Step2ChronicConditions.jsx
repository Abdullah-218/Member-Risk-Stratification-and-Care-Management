import React from 'react';
import styles from './AssessmentSteps.module.css';

/**
 * Step 2: Chronic Conditions
 * Collects information about existing chronic conditions
 */
const Step2ChronicConditions = ({ data, onUpdate }) => {
  const { conditions } = data;

  const conditionsList = [
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'heartDisease', label: 'Heart Disease' },
    { key: 'copd', label: 'COPD' },
    { key: 'kidneyDisease', label: 'Kidney Disease' },
    { key: 'cancer', label: 'Cancer' },
    { key: 'stroke', label: 'Stroke' },
    { key: 'depression', label: 'Depression' },
    { key: 'alzheimers', label: "Alzheimer's" },
    { key: 'hypertension', label: 'Hypertension' },
    { key: 'arthritis', label: 'Arthritis' },
    { key: 'esrd', label: 'End-Stage Renal Disease (ESRD)' },
    { key: 'chf', label: 'Congestive Heart Failure (CHF)' },
    { key: 'ckd', label: 'Chronic Kidney Disease (CKD)' },
    { key: 'ischemicHeartDisease', label: 'Ischemic Heart Disease' }
  ];

  const handleConditionChange = (conditionKey, checked) => {
    onUpdate('conditions', conditionKey, checked);
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 2 of 5: Chronic Conditions</h3>
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
