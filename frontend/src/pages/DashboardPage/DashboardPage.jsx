import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Settings } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import Button from '../../components/common/Button/Button';
import PopulationOverview from '../../components/dashboard/PopulationOverview/PopulationOverview';
import PriorityActions from '../../components/dashboard/PriorityActions/PriorityActions';
import QuickActions from '../../components/dashboard/QuickActions/QuickActions';
import RiskDistributionChart from '../../components/dashboard/RiskDistributionChart/RiskDistributionChart';
import TrendAnalysis from '../../components/dashboard/TrendAnalysis/TrendAnalysis';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { members } = useMembers();
  const navigate = useNavigate();

  const highRiskCount = members.filter(m => m.riskScore >= 0.6).length;

  const handleViewHighRisk = () => {
    navigate('/high-risk-members');
  };

  const handleUploadData = () => {
    navigate('/upload');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Organization Dashboard</h2>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleUploadData}>
            <Upload size={16} /> Upload Data
          </Button>
          <Button variant="secondary">
            <Download size={16} /> Export
          </Button>
          <Button variant="secondary">
            <Settings size={16} /> Settings
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <PopulationOverview members={members} />
        <TrendAnalysis />
        <RiskDistributionChart />
        <PriorityActions 
          highRiskCount={highRiskCount} 
          onViewHighRisk={handleViewHighRisk}
        />
        <QuickActions onUploadData={handleUploadData} />
      </div>
    </div>
  );
};

export default DashboardPage;