import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import Card from '../../common/Card/Card';
import styles from './PopulationOverview.module.css';

const PopulationOverview = ({ members }) => {
  const totalMembers = members.length;
  
  const riskDistribution = {
    veryHigh: members.filter(m => m.riskScore >= 0.8).length,
    high: members.filter(m => m.riskScore >= 0.6 && m.riskScore < 0.8).length,
    medium: members.filter(m => m.riskScore >= 0.4 && m.riskScore < 0.6).length,
    low: members.filter(m => m.riskScore >= 0.2 && m.riskScore < 0.4).length,
    veryLow: members.filter(m => m.riskScore < 0.2).length
  };

  const totalCost = members.reduce((sum, m) => sum + m.estimatedCost, 0);
  const potentialSavings = totalCost * 0.064;

  const getPercentage = (count) => ((count / totalMembers) * 100).toFixed(0);

  return (
    <Card>
      <div className={styles.header}>
        <h3 className={styles.title}>📊 Population Overview</h3>
        <span className={styles.subtitle}>Last Updated: Today</span>
      </div>

      <div className={styles.totalMembers}>
        Total Members: {totalMembers.toLocaleString()}
      </div>

      <div className={styles.distribution}>
        <h4 className={styles.sectionTitle}>Risk Distribution:</h4>
        
        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <span className={styles.icon}>⚫</span>
            Very High ({getPercentage(riskDistribution.veryHigh)}%)
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.veryHigh)}%`,
                backgroundColor: '#1a1a1a'
              }}
            />
          </div>
          <div className={styles.count}>
            {riskDistribution.veryHigh} members → URGENT
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <span className={styles.icon}>🔴</span>
            High ({getPercentage(riskDistribution.high)}%)
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.high)}%`,
                backgroundColor: '#dc2626'
              }}
            />
          </div>
          <div className={styles.count}>
            {riskDistribution.high} members
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <span className={styles.icon}>🟠</span>
            Medium ({getPercentage(riskDistribution.medium)}%)
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.medium)}%`,
                backgroundColor: '#f59e0b'
              }}
            />
          </div>
          <div className={styles.count}>
            {riskDistribution.medium} members
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <span className={styles.icon}>🟡</span>
            Low ({getPercentage(riskDistribution.low)}%)
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.low)}%`,
                backgroundColor: '#fbbf24'
              }}
            />
          </div>
          <div className={styles.count}>
            {riskDistribution.low} members
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <span className={styles.icon}>🟢</span>
            Very Low ({getPercentage(riskDistribution.veryLow)}%)
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.veryLow)}%`,
                backgroundColor: '#10b981'
              }}
            />
          </div>
          <div className={styles.count}>
            {riskDistribution.veryLow} members
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <DollarSign className={styles.metricIcon} />
          <div>
            <div className={styles.metricLabel}>Projected Annual Cost</div>
            <div className={styles.metricValue}>
              ${(totalCost / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>

        <div className={styles.metric}>
          <TrendingUp className={styles.metricIcon} />
          <div>
            <div className={styles.metricLabel}>Potential Savings with Intervention</div>
            <div className={styles.metricValue} style={{ color: '#10b981' }}>
              ${(potentialSavings / 1000000).toFixed(1)}M (6.4%)
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PopulationOverview;