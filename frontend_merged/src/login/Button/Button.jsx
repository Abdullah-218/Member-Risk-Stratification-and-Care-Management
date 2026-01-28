import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  fullWidth = false
}) => {
  const buttonClasses = `
    ${styles.button} 
    ${styles[variant]} 
    ${fullWidth ? styles.fullWidth : ''}
    ${className}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
};

export default Button;
