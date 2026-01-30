import React from 'react';
import styles from './Input.module.css';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  error = '',
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${styles.input} ${error ? styles.error : ''}`}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Input;
