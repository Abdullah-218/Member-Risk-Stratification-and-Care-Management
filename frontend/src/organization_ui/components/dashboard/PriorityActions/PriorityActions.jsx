import React from 'react';
import { AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import styles from './PriorityActions.module.css';

const PriorityActions = ({
  highRiskCount,
  diabetesRiskIncrease,
  onViewHighRisk,
  onViewTrendAnalysis,
}) => {

  const handleViewTrendAnalysis = () => {
    if (onViewTrendAnalysis) {
      onViewTrendAnalysis();
    }
  };

  return (
    <Card>
      <h3 className={styles.title}>⚠️ Priority Actions</h3>
      
      <div className={styles.actions}>
        <div className={styles.actionCard} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <div className={styles.actionHeader}>
            <AlertTriangle className={styles.actionIcon} style={{ color: '#dc2626' }} />
            <div>
              <div className={styles.actionTitle}>
                🚨 {highRiskCount} members need IMMEDIATE intervention
              </div>
              <div className={styles.actionDescription}>
                Very high-risk members require urgent care coordination
              </div>
            </div>
          </div>
          <Button variant="danger" onClick={onViewHighRisk}>
            View High-Risk List <ChevronRight size={16} />
          </Button>
        </div>

        <div className={styles.actionCard} style={{ backgroundColor: '#fef9c3', borderColor: '#fde047' }}>
          <div className={styles.actionHeader}>
            <TrendingUp className={styles.actionIcon} style={{ color: '#ca8a04' }} />
            <div>
              <div className={styles.actionTitle}>
  📈 {diabetesRiskIncrease}% increase in diabetes risk vs last quarter
</div>

              <div className={styles.actionDescription}>
                Population health trends showing increased chronic disease burden
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={handleViewTrendAnalysis}>
            View Trend Analysis <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PriorityActions;