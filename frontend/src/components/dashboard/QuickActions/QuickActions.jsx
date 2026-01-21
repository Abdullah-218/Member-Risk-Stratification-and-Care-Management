import React from 'react';
import { Upload, Activity, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import styles from './QuickActions.module.css';

const QuickActions = ({ onUploadData }) => {
  const navigate = useNavigate();

  const handleBulkRiskAssessment = () => {
    navigate('/upload');
  };

  const handleGenerateCarePlans = () => {
    navigate('/high-risk-members');
  };

  const handleExportReport = () => {
    navigate('/reports');
  };

  return (
    <Card>
      <h3 className={styles.title}>📋 Quick Actions</h3>
      <div className={styles.grid}>
        <Button variant="primary" onClick={onUploadData}>
          <Upload size={16} /> Upload New Member Data
        </Button>
        <Button variant="secondary" onClick={handleBulkRiskAssessment}>
          <Activity size={16} /> Bulk Risk Assessment
        </Button>
        <Button variant="secondary" onClick={handleGenerateCarePlans}>
          <FileText size={16} /> Generate Care Plans
        </Button>
        <Button variant="secondary" onClick={handleExportReport}>
          <Download size={16} /> Export High-Risk Report
        </Button>
      </div>
    </Card>
  );
};

export default QuickActions;