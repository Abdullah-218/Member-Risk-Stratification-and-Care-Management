
import React from 'react';
import { Download } from 'lucide-react';
import Button from '../../components/common/Button/Button';
import FinancialImpact from '../../components/roi/FinancialImpact/FinancialImpact';
import InterventionROI from '../../components/roi/InterventionROI/InterventionROI';
import RiskTransitions from '../../components/roi/RiskTransitions/RiskTransitions';
import styles from './ROIPage.module.css';

const ROIPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📈 Intervention ROI Dashboard</h2>
        <Button variant="secondary">
          <Download size={16} /> Export Report
          </Button>
      </div>

      <div className={styles.content}>
        <FinancialImpact />
        <InterventionROI />
        <RiskTransitions />
      </div>
    </div>
  );
};

export default ROIPage;
