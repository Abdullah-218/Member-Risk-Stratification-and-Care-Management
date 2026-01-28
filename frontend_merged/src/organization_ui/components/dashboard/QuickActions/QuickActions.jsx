import React from 'react';
import { Upload, Activity, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import styles from './QuickActions.module.css';

const QuickActions = () => {
  const navigate = useNavigate();

  const handleUploadData = () => {
    navigate('/org/upload');
  };

  const handleBulkRiskAssessment = () => {
    navigate('/org/upload');
  };

  const handleGenerateCarePlans = () => {
    navigate('/org/high-risk-members');
  };

  const handleExportReport = () => {
    // Export functionality - download high-risk members data
    const data = {
      timestamp: new Date().toISOString(),
      reportType: 'high-risk-members',
      message: 'High-risk members report export'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `high-risk-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <h3 className={styles.title}>📋 Quick Actions</h3>
      <div className={styles.grid}>
        <Button variant="primary" onClick={handleUploadData}>
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