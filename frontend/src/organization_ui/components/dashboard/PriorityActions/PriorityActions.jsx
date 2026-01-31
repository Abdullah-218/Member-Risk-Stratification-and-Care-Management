import React from 'react';
import { AlertTriangle, TrendingUp, ChevronRight, Bell } from 'lucide-react';
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
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <Bell size={24} className={styles.headerIcon} />
          </div>
          <div>
            <h3 className={styles.title}>Priority Actions</h3>
            <span className={styles.subtitle}>Immediate attention required</span>
          </div>
        </div>
      </div>
      
      <div className={styles.actions}>
        <div className={styles.actionCard}>
          <div className={styles.actionHeader}>
            <div className={styles.actionIconWrapper}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>
                {highRiskCount} members need immediate intervention
              </div>
              <div className={styles.actionDescription}>
                Critical risk members require urgent care coordination
              </div>
            </div>
          </div>
          <Button variant="danger" onClick={onViewHighRisk}>
            View High-Risk List <ChevronRight size={16} />
          </Button>
        </div>

        <div className={styles.actionCard}>
          <div className={styles.actionHeader}>
            <div className={styles.actionIconWrapper} style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fde047 100%)' }}>
              <TrendingUp size={24} style={{ color: '#ca8a04' }} />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>
                {diabetesRiskIncrease}% increase in diabetes risk
              </div>
              <div className={styles.actionDescription}>
                Population trends showing increased chronic disease burden
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