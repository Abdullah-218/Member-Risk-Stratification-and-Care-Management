import React from 'react';
import Card from '../../common/Card/Card';
import styles from './FinancialImpact.module.css';

const FinancialImpact = () => {
  return (
    <Card>
      <h3 className={styles.title}>💰 Financial Impact</h3>
      
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.label}>Projected Costs (No Intervention)</div>
          <div className={styles.value}>$142.7M</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Actual Costs (With Intervention)</div>
          <div className={styles.value}>$134.5M</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Total Savings</div>
          <div className={styles.value} style={{ color: '#10b981' }}>
            $8.2M (5.7%)
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <div className={styles.detailLabel}>
            High-Risk Members Prevented Hospitalization:
          </div>
          <div className={styles.detailValue}>127</div>
        </div>

        <div className={styles.detail}>
          <div className={styles.detailLabel}>
            Average Savings per Prevented Event:
          </div>
          <div className={styles.detailValue}>$64,566</div>
        </div>
      </div>
    </Card>
  );
};

export default FinancialImpact;