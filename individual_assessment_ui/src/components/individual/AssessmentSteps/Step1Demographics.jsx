import React from 'react';
import Input from '../../common/Input/Input';
import styles from './AssessmentSteps.module.css';

/**
 * Step 1: Demographics
 * Collects basic demographic information
 */
const Step1Demographics = ({ data, onUpdate }) => {
  const { demographics } = data;

  const handleChange = (field, value) => {
    onUpdate('demographics', field, value);
  };

  return (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>Step 1 of 5: Demographics</h3>
      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Age (years)"
            type="number"
            value={demographics.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder=""
            required
          />

          <div className={styles.selectGroup}>
            <label className={styles.label}>Gender</label>
            <select
              value={demographics.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Annual Healthcare Cost ($)"
            type="number"
            value={demographics.annualHealthcareCost}
            onChange={(e) => handleChange('annualHealthcareCost', e.target.value)}
            placeholder=""
            required
          />
        </div>
      </div>
    </div>
  );
};

export default Step1Demographics;
