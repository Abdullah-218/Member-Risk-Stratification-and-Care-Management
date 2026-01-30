import React from 'react';
import Card from '../../common/Card/Card';
import styles from './RiskTransitions.module.css';

const RiskTransitions = () => {
  const transitions = [
    { from: 'Very High', to: 'High', count: 89, improvement: 41, color: '#dcfce7' },
    { from: 'High', to: 'Medium', count: 156, improvement: 19, color: '#dbeafe' },
    { from: 'Medium', to: 'Low', count: 243, improvement: 12, color: '#f3e8ff' }
  ];

  return (
    <Card>
      <h3 className={styles.title}>🎯 Risk Tier Transitions</h3>
      
      <div className={styles.transitions}>
        {transitions.map((transition, idx) => (
          <div 
            key={idx} 
            className={styles.transition}
            style={{ backgroundColor: transition.color, borderColor: transition.color }}
          >
            <div className={styles.transitionTitle}>
              {transition.from} → {transition.to}
            </div>
            <div className={styles.transitionDetails}>
              {transition.count} members ({transition.improvement}% improvement)
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RiskTransitions;