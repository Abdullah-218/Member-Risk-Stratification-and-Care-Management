import React from 'react';
import { DollarSign, TrendingUp, Target, AlertTriangle, Sparkles, PiggyBank } from 'lucide-react';
import Card from '../../common/Card/Card';
import styles from './FinancialMetrics.module.css';

const FinancialMetrics = ({ summaryData }) => {
  if (!summaryData) return null;

  const { financials, highRisk } = summaryData;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className={styles.container}>
      {/* Projected Cost Card */}
      <Card>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#fee2e2' }}>
            <DollarSign size={24} color="#dc2626" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.label}>Projected Annual Cost</div>
            <div className={styles.value}>{formatCurrency(financials.projectedCost)}</div>
            <div className={styles.subtext}>Total estimated healthcare costs</div>
          </div>
        </div>
      </Card>

      {/* Intervention Cost Card */}
      <Card>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#fef3c7' }}>
            <Target size={24} color="#f59e0b" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.label}>Intervention Cost</div>
            <div className={styles.value}>{formatCurrency(financials.interventionCost)}</div>
            <div className={styles.subtext}>Cost of preventive interventions</div>
          </div>
        </div>
      </Card>

      {/* Potential Savings Card */}
      <Card>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#d1fae5' }}>
            <PiggyBank size={24} color="#10b981" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.label}>Potential Savings</div>
            <div className={styles.value}>{formatCurrency(financials.potentialSavings)}</div>
            <div className={styles.subtext}>Expected cost reduction</div>
          </div>
        </div>
      </Card>

      {/* Net Benefit Card */}
      <Card>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#dbeafe' }}>
            <TrendingUp size={24} color="#3b82f6" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.label}>Net Benefit</div>
            <div className={styles.value}>{formatCurrency(financials.netBenefit)}</div>
            <div className={styles.subtext}>Savings minus intervention cost</div>
          </div>
        </div>
      </Card>

      {/* Average ROI Card */}
      <Card>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#e0e7ff' }}>
            <Target size={24} color="#6366f1" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.label}>Average ROI</div>
            <div className={styles.value}>{formatPercent(financials.avgRoi)}</div>
            <div className={styles.subtext}>Return on intervention investment</div>
          </div>
        </div>
      </Card>

      {/* High Risk Patients Card */}
      <Card>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#fce7f3' }}>
            <AlertTriangle size={24} color="#ec4899" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.label}>High Risk Patients</div>
            <div className={styles.value}>{highRisk.count}</div>
            <div className={styles.subtext}>{formatPercent(highRisk.percentage)} of total population</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialMetrics;
