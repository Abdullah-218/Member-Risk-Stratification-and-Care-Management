import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ progress, label, showPercentage = true }) => {
  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.label}>
          {label}
          {showPercentage && <span className={styles.percentage}>{progress}%</span>}
        </div>
      )}
      <div className={styles.track}>
        <div 
          className={styles.fill}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;