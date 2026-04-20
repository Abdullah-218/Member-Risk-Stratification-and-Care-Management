import React from 'react';
import styles from './RiskGauge.module.css';

const RiskGauge = ({ riskScore }) => {
  const getRiskLevel = () => {
    if (riskScore >= 0.8) return { label: 'VERY HIGH', color: '#1a1a1a', icon: '⚫' };
    if (riskScore >= 0.6) return { label: 'HIGH', color: '#dc2626', icon: '🔴' };
    if (riskScore >= 0.4) return { label: 'MEDIUM', color: '#f59e0b', icon: '🟠' };
    if (riskScore >= 0.2) return { label: 'LOW', color: '#fbbf24', icon: '🟡' };
    return { label: 'VERY LOW', color: '#10b981', icon: '🟢' };
  };

  const risk = getRiskLevel();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>{risk.icon}</div>
        <div>
          <div className={styles.label}>YOUR RISK LEVEL:</div>
          <div className={styles.level} style={{ color: risk.color }}>
            {risk.label} ({Math.round(riskScore * 100)}%)
          </div>
        </div>
      </div>

      <p className={styles.description}>
        You have a {risk.label} risk of health complications in the next 90 days. 
        With the right actions, you can significantly reduce this risk.
      </p>

      <div className={styles.gauge}>
        <div className={styles.labels}>
          <span>Very Low</span>
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Very High</span>
        </div>
        <div className={styles.track}>
          <div 
            className={styles.marker}
            style={{ left: `calc(${riskScore * 100}% - 8px)` }}
          />
        </div>
        <div className={styles.percentages}>
          <span>10%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;