import React from 'react';
import Card from '../../common/Card/Card';
import styles from './InterventionROI.module.css';

const InterventionROI = () => {
  const interventions = [
    { name: 'Diabetes Management', members: 342, successRate: 78 },
    { name: 'Care Coordination', members: 215, successRate: 82 },
    { name: 'Medication Reconciliation', members: 189, successRate: 71 },
    { name: 'Home Health Visits', members: 127, successRate: 86 },
    { name: 'Telehealth Monitoring', members: 294, successRate: 68 }
  ];

  const getColor = (rate) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 70) return '#fbbf24';
    return '#f59e0b';
  };

  return (
    <Card>
      <h3 className={styles.title}>📊 Intervention Effectiveness</h3>
      
      <div className={styles.interventions}>
        {interventions.map((intervention, idx) => (
          <div key={idx} className={styles.intervention}>
            <div className={styles.interventionName}>{intervention.name}</div>
            <div className={styles.barContainer}>
              <div 
                className={styles.bar}
                style={{ 
                  width: `${intervention.successRate}%`,
                  backgroundColor: getColor(intervention.successRate)
                }}
              >
                <span className={styles.percentage}>{intervention.successRate}%</span>
              </div>
            </div>
            <div className={styles.members}>{intervention.members} members</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default InterventionROI;