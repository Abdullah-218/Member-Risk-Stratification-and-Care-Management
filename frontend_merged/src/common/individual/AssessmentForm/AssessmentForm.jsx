import React from 'react';
import Input from '../../common/Input/Input';
import styles from './AssessmentForm.module.css';

const AssessmentForm = ({ step, formData, onUpdate, onToggleCondition }) => {
  const conditions = [
    'Diabetes',
    'Heart Disease',
    'High Blood Pressure',
    'High Cholesterol',
    'COPD/Asthma',
    'Cancer',
    'Kidney Disease'
  ];

  if (step === 1) {
    return (
      <div className={styles.step}>
        <h3 className={styles.stepTitle}>Step 1 of 5: Basic Information</h3>
        <div className={styles.form}>
          <Input
            label="Age"
            type="number"
            value={formData.age}
            onChange={(e) => onUpdate('age', e.target.value)}
            placeholder="Enter your age"
            required
          />
          
          <div className={styles.radioGroup}>
            <label className={styles.label}>Gender:</label>
            <div className={styles.radios}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => onUpdate('gender', e.target.value)}
                />
                <span>Male</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => onUpdate('gender', e.target.value)}
                />
                <span>Female</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={(e) => onUpdate('gender', e.target.value)}
                />
                <span>Other</span>
              </label>
            </div>
          </div>

          <Input
            label="Height (cm)"
            type="number"
            value={formData.height}
            onChange={(e) => onUpdate('height', e.target.value)}
            placeholder="Enter height in cm"
            required
          />

          <Input
            label="Weight (kg)"
            type="number"
            value={formData.weight}
            onChange={(e) => onUpdate('weight', e.target.value)}
            placeholder="Enter weight in kg"
            required
          />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className={styles.step}>
        <h3 className={styles.stepTitle}>Step 2 of 5: Medical History</h3>
        <div className={styles.form}>
          <div className={styles.label}>Do you have any of these conditions?</div>
          <div className={styles.checkboxGroup}>
            {conditions.map(condition => (
              <label key={condition} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.conditions.includes(condition)}
                  onChange={() => onToggleCondition(condition)}
                />
                <span>{condition}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className={styles.step}>
        <h3 className={styles.stepTitle}>Step 3 of 5: Recent Health Measurements</h3>
        <div className={styles.form}>
          <div className={styles.row}>
            <Input
              label="Blood Pressure (Systolic)"
              type="number"
              value={formData.bloodPressureSys}
              onChange={(e) => onUpdate('bloodPressureSys', e.target.value)}
              placeholder="120"
            />
            <Input
              label="Blood Pressure (Diastolic)"
              type="number"
              value={formData.bloodPressureDia}
              onChange={(e) => onUpdate('bloodPressureDia', e.target.value)}
              placeholder="80"
            />
          </div>

          <Input
            label="Blood Glucose (mg/dL) - if known"
            type="number"
            value={formData.glucose}
            onChange={(e) => onUpdate('glucose', e.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Cholesterol (mg/dL) - if known"
            type="number"
            value={formData.cholesterol}
            onChange={(e) => onUpdate('cholesterol', e.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Number of Medications"
            type="number"
            value={formData.medications}
            onChange={(e) => onUpdate('medications', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className={styles.step}>
        <h3 className={styles.stepTitle}>Step 4 of 5: Healthcare Utilization</h3>
        <div className={styles.form}>
          <div className={styles.label}>In the past 12 months:</div>
          
          <Input
            label="Hospital stays"
            type="number"
            value={formData.hospitalStays}
            onChange={(e) => onUpdate('hospitalStays', e.target.value)}
            placeholder="0"
          />

          <Input
            label="ER visits"
            type="number"
            value={formData.erVisits}
            onChange={(e) => onUpdate('erVisits', e.target.value)}
            placeholder="0"
          />

          <Input
            label="Doctor appointments"
            type="number"
            value={formData.doctorVisits}
            onChange={(e) => onUpdate('doctorVisits', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className={styles.step}>
        <h3 className={styles.stepTitle}>Step 5 of 5: Lifestyle</h3>
        <div className={styles.form}>
          <div className={styles.radioGroup}>
            <label className={styles.label}>Do you smoke?</label>
            <div className={styles.radios}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="smoking"
                  value="yes"
                  checked={formData.smoking === 'yes'}
                  onChange={(e) => onUpdate('smoking', e.target.value)}
                />
                <span>Yes</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="smoking"
                  value="no"
                  checked={formData.smoking === 'no'}
                  onChange={(e) => onUpdate('smoking', e.target.value)}
                />
                <span>No</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="smoking"
                  value="former"
                  checked={formData.smoking === 'former'}
                  onChange={(e) => onUpdate('smoking', e.target.value)}
                />
                 <span>Former</span>
          </label>
        </div>
      </div>

      <div className={styles.selectGroup}>
        <label className={styles.label}>Exercise frequency:</label>
        <select
          value={formData.exercise}
          onChange={(e) => onUpdate('exercise', e.target.value)}
          className={styles.select}
        >
          <option value="never">Never</option>
          <option value="rarely">Rarely (1-2 times/month)</option>
          <option value="sometimes">Sometimes (1-2 times/week)</option>
          <option value="regularly">Regularly (3-4 times/week)</option>
          <option value="daily">Daily</option>
        </select>
      </div>

      <div className={styles.radioGroup}>
        <label className={styles.label}>Have primary doctor?</label>
        <div className={styles.radios}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="primaryDoctor"
              value="yes"
              checked={formData.primaryDoctor === 'yes'}
              onChange={(e) => onUpdate('primaryDoctor', e.target.value)}
            />
            <span>Yes</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="primaryDoctor"
              value="no"
              checked={formData.primaryDoctor === 'no'}
              onChange={(e) => onUpdate('primaryDoctor', e.target.value)}
            />
            <span>No</span>
          </label>
        </div>
      </div>
    </div>
  </div>
);
}
return null;
};
export default AssessmentForm;
