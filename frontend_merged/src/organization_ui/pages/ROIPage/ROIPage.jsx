import React from "react";
import { Download } from "lucide-react";

import PredictionWindowSelector
  from "../../components/common/PredictionWindowSelector";
import { usePredictionWindow }
  from "../../context/PredictionWindowContext";

// utils
import { exportUtils } from "../../utils/exportUtils";

// components
import Button from "../../components/common/Button/Button";
import FinancialImpact from "../../components/roi/FinancialImpact/FinancialImpact";
import InterventionROI from "../../components/roi/InterventionROI/InterventionROI";
import RiskTransitions from "../../components/roi/RiskTransitions/RiskTransitions";

// styles
import styles from "./ROIPage.module.css";

const roiAnalyticsByWindow = {
  30: {
    projectedCosts: 142_700_000,
    actualCosts: 136_900_000,
    savingsPercentage: 4.1,
    preventedHospitalizations: 84,
  },
  60: {
    projectedCosts: 142_700_000,
    actualCosts: 134_500_000,
    savingsPercentage: 5.7,
    preventedHospitalizations: 127,
  },
  90: {
    projectedCosts: 142_700_000,
    actualCosts: 130_200_000,
    savingsPercentage: 8.8,
    preventedHospitalizations: 198,
  },
};

const ROIPage = () => {
  const { predictionWindow } = usePredictionWindow();

  const roiData = roiAnalyticsByWindow[predictionWindow];

  const handleExportReport = () => {
    exportUtils.exportROIReport({
      projectedCosts: roiData.projectedCosts,
      actualCosts: roiData.actualCosts,
      totalSavings: roiData.projectedCosts - roiData.actualCosts,
      savingsPercentage: roiData.savingsPercentage,
      preventedHospitalizations: roiData.preventedHospitalizations,
      avgSavingsPerEvent:
        (roiData.projectedCosts - roiData.actualCosts) /
        roiData.preventedHospitalizations,
    });
  };

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
        <InterventionROI data={roiData} />
        <RiskTransitions predictionWindow={predictionWindow} />
      </div>
    </div>
  );
};

export default ROIPage;
