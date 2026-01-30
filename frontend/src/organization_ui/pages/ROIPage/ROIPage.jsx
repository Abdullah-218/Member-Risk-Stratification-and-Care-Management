import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

import PredictionWindowSelector
  from "../../components/common/PredictionWindowSelector";
import { usePredictionWindow }
  from "../../context/PredictionWindowContext";
import { dashboardApi } from "../../services/api/dashboardApi";

// utils
import { exportUtils } from "../../utils/exportUtils";

// components
import Button from "../../components/common/Button/Button";
import FinancialImpact from "../../components/roi/FinancialImpact/FinancialImpact";
import WindowComparison from "../../components/roi/WindowComparison/WindowComparison";
import InterventionROI from "../../components/roi/InterventionROI/InterventionROI";
import RiskTransitions from "../../components/roi/RiskTransitions/RiskTransitions";

// styles
import styles from "./ROIPage.module.css";

const ROIPage = () => {
  const { predictionWindow } = usePredictionWindow();
  const [roiData, setRoiData] = useState(null);
  const [allWindowsData, setAllWindowsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real financial data from API for current window
  useEffect(() => {
    const fetchROIData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await dashboardApi.getROIFinancialImpact(predictionWindow);
        
        setRoiData(response.data);
      } catch (err) {
        console.error('Error fetching ROI data:', err);
        setError('Failed to load ROI data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchROIData();
  }, [predictionWindow]);

  // Fetch data for all 3 windows for comparison
  useEffect(() => {
    const fetchAllWindowsData = async () => {
      try {
        const [data30, data60, data90] = await Promise.all([
          dashboardApi.getROIFinancialImpact(30),
          dashboardApi.getROIFinancialImpact(60),
          dashboardApi.getROIFinancialImpact(90)
        ]);
        
        setAllWindowsData({
          30: data30.data,
          60: data60.data,
          90: data90.data
        });
      } catch (err) {
        console.error('Error fetching all windows data:', err);
      }
    };

    fetchAllWindowsData();
  }, []);

  const handleExportReport = () => {
    if (!roiData) return;
    
    const totalSavings = parseFloat(roiData.totalSavings || 0);
    const preventedHospitalizations = parseInt(roiData.preventedHospitalizations || 1);
    
    exportUtils.exportROIReport({
      projectedCosts: parseFloat(roiData.projectedCosts || 0),
      actualCosts: parseFloat(roiData.actualCosts || 0),
      totalSavings,
      savingsPercentage: parseFloat(roiData.savingsPercentage || 0),
      preventedHospitalizations,
      avgSavingsPerEvent: totalSavings / preventedHospitalizations,
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading ROI data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📈 Intervention ROI Dashboard</h2>
        <Button variant="secondary" onClick={handleExportReport}>
          <Download size={16} /> Export Report
        </Button>
      </div>

      {/* ✅ GLOBAL PREDICTION WINDOW */}
      <PredictionWindowSelector />

      <div className={styles.content}>
        <FinancialImpact data={roiData} />
        <InterventionROI predictionWindow={predictionWindow} />
        <RiskTransitions predictionWindow={predictionWindow} />
        <WindowComparison allWindowsData={allWindowsData} />
      </div>
    </div>
  );
};

export default ROIPage;
