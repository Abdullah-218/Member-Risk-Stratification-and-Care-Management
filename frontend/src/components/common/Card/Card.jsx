import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, className = '', onClick, id }) => {
  return (
    <div 
      id={id}
      className={`${styles.card} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;