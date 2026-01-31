import React from 'react';
import { Users, TrendingUp, AlertCircle, Activity, CheckCircle } from 'lucide-react';
import Card from '../../common/Card/Card';
import styles from './PopulationOverview.module.css';

const PopulationOverview = ({
  members,
  summaryData,
  projectedAnnualCost,
  potentialSavings,
  costChangePercent,
}) => {

  // Use API summary data if available, otherwise calculate from members
  const totalMembers = summaryData?.totalMembers || members.length;
  
  const riskDistribution = summaryData ? {
    // Map database tiers (5=Critical, 4=High, 3=Moderate, 2=Low-Moderate, 1=Low)
    // to UI categories (veryHigh, high, medium, low, veryLow)
    veryHigh: summaryData.riskDistribution.tier5Critical,
    high: summaryData.riskDistribution.tier4High,
    medium: summaryData.riskDistribution.tier3Moderate,
    low: summaryData.riskDistribution.tier2LowModerate,
    veryLow: summaryData.riskDistribution.tier1Low
  } : {
    veryHigh: members.filter(m => m.riskScore >= 0.8).length,
    high: members.filter(m => m.riskScore >= 0.6 && m.riskScore < 0.8).length,
    medium: members.filter(m => m.riskScore >= 0.4 && m.riskScore < 0.6).length,
    low: members.filter(m => m.riskScore >= 0.2 && m.riskScore < 0.4).length,
    veryLow: members.filter(m => m.riskScore < 0.2).length
  };

 
  const getPercentage = (count) => ((count / totalMembers) * 100).toFixed(1);

  return (
    <Card>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <Users size={24} className={styles.headerIcon} />
          </div>
          <div>
            <h3 className={styles.title}>Population Overview</h3>
            <span className={styles.subtitle}>Risk distribution and member analytics</span>
          </div>
        </div>
        <div className={styles.totalBadge}>
          <Users size={16} />
          <span>{totalMembers.toLocaleString()} Members</span>
        </div>
      </div>

      <div className={styles.distribution}>
        
        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <div className={styles.riskIconWrapper} style={{ backgroundColor: '#fef2f2' }}>
              <AlertCircle size={16} style={{ color: '#dc2626' }} />
            </div>
            <div className={styles.riskInfo}>
              <span className={styles.riskName}>Critical</span>
              <span className={styles.riskPercentage}>{getPercentage(riskDistribution.veryHigh)}%</span>
            </div>
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.veryHigh)}%`,
                backgroundColor: '#dc2626'
              }}
            />
          </div>
          <div className={styles.count}>
            <span className={styles.countNumber}>{riskDistribution.veryHigh}</span>
            <span className={styles.countLabel}>URGENT</span>
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <div className={styles.riskIconWrapper} style={{ backgroundColor: '#fff7ed' }}>
              <TrendingUp size={16} style={{ color: '#ea580c' }} />
            </div>
            <div className={styles.riskInfo}>
              <span className={styles.riskName}>High</span>
              <span className={styles.riskPercentage}>{getPercentage(riskDistribution.high)}%</span>
            </div>
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.high)}%`,
                backgroundColor: '#ea580c'
              }}
            />
          </div>
          <div className={styles.count}>
            <span className={styles.countNumber}>{riskDistribution.high}</span>
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <div className={styles.riskIconWrapper} style={{ backgroundColor: '#fef9c3' }}>
              <Activity size={16} style={{ color: '#ca8a04' }} />
            </div>
            <div className={styles.riskInfo}>
              <span className={styles.riskName}>Medium</span>
              <span className={styles.riskPercentage}>{getPercentage(riskDistribution.medium)}%</span>
            </div>
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.medium)}%`,
                backgroundColor: '#ca8a04'
              }}
            />
          </div>
          <div className={styles.count}>
            <span className={styles.countNumber}>{riskDistribution.medium}</span>
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <div className={styles.riskIconWrapper} style={{ backgroundColor: '#fef3c7' }}>
              <Activity size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div className={styles.riskInfo}>
              <span className={styles.riskName}>Low</span>
              <span className={styles.riskPercentage}>{getPercentage(riskDistribution.low)}%</span>
            </div>
          </div>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ 
                width: `${getPercentage(riskDistribution.low)}%`,
                backgroundColor: '#f59e0b'
              }}
            />
          </div>
          <div className={styles.count}>
            <span className={styles.countNumber}>{riskDistribution.low}</span>
          </div>
        </div>

        <div className={styles.riskItem}>
          <div className={styles.riskLabel}>
            <div className={styles.riskIconWrapper} style={{ backgroundColor: '#f0fdf4' }}>
              <CheckCircle size={16} style={{ color: '#10b981' }} />
            </div>
            <div className={styles.riskInfo}>
              <span className={styles.riskName}>Very Low</span>
              <span className={styles.riskPercentage}>{getPercentage(riskDistribution.veryLow)}%</span>
            </div>
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
            <span className={styles.countNumber}>{riskDistribution.veryLow}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PopulationOverview;