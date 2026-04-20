import React from 'react';
import styles from './DataSourceSelector.module.css';

const DataSourceSelector = ({ selectedSource, onSourceChange }) => {
  const sources = [
    { id: 'csv', label: 'Upload CSV File (Recommended)', disabled: false },
    { id: 'ehr', label: 'Connect to EHR System (Coming Soon)', disabled: true },
    { id: 'manual', label: 'Manual Entry', disabled: false }
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Step 1: Select Data Source</h3>
      <div className={styles.options}>
        {sources.map(source => (
          <label 
            key={source.id}
            className={`${styles.option} ${source.disabled ? styles.disabled : ''}`}
          >
            <input
              type="radio"
              name="source"
              value={source.id}
              checked={selectedSource === source.id}
              onChange={(e) => onSourceChange(e.target.value)}
              disabled={source.disabled}
            />
            <span>{source.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default DataSourceSelector;