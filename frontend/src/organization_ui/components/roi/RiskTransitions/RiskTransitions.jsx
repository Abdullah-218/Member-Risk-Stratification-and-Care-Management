import React, { useMemo } from 'react';
import Card from '../../common/Card/Card';
import styles from './RiskTransitions.module.css';

const RiskTransitions = ({ predictionWindow = 90 }) => {
  // Generate dynamic mock data based on prediction window
  const transitions = useMemo(() => {
    const baseTransitions = [
      { from: 'Very High', to: 'High', baseCount: 89, baseImprovement: 41, color: '#dcfce7' },
      { from: 'High', to: 'Medium', baseCount: 156, baseImprovement: 19, color: '#dbeafe' },
      { from: 'Medium', to: 'Low', baseCount: 243, baseImprovement: 12, color: '#f3e8ff' }
    ];

    // Adjust based on prediction window (longer window = more transitions)
    const countMultiplier = predictionWindow === 30 ? 0.7 : predictionWindow === 60 ? 1.0 : 1.4;
    const improvementAdjust = predictionWindow === 30 ? -5 : predictionWindow === 60 ? 0 : 8;

    return baseTransitions.map(transition => ({
      from: transition.from,
      to: transition.to,
      count: Math.round(transition.baseCount * countMultiplier),
      improvement: Math.max(5, transition.baseImprovement + improvementAdjust),
      color: transition.color
    }));
  }, [predictionWindow]);

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