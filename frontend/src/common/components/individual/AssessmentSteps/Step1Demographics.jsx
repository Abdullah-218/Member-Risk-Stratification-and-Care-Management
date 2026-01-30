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
      <h3 className={styles.stepTitle}>Step 1 of 4: Demographics</h3>
      <p className={styles.stepDescription}>
        Please provide your basic demographic information. All fields are required.
      </p>
      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Age (years) *"
            type="number"
            value={demographics.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="Enter your age"
            min="0"
            max="120"
          />

          <div className={styles.selectGroup}>
            <label className={styles.label}>Gender *</label>
            <select
              value={demographics.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className={styles.select}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.selectGroup}>
            <label className={styles.label}>Race/Ethnicity *</label>
            <select
              value={demographics.race}
              onChange={(e) => handleChange('race', e.target.value)}
              className={styles.select}
            >
              <option value="">Select Race/Ethnicity</option>
              <option value="1">White</option>
              <option value="2">Black/African American</option>
              <option value="3">Other</option>
              <option value="5">Hispanic/Latino</option>
            </select>
          </div>

          <Input
            label="Annual Healthcare Cost ($) *"
            type="number"
            value={demographics.total_annual_cost}
            onChange={(e) => handleChange('total_annual_cost', e.target.value)}
            placeholder="Enter your annual cost"
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1Demographics;
