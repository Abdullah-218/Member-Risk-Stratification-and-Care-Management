import React from "react";
import Card from "../../common/Card/Card";
import styles from "./FinancialImpact.module.css";

const FinancialImpact = ({ data }) => {
  // ✅ safety check to avoid blank screen
  if (!data) return null;

  const projectedCosts = parseFloat(data.projectedCosts || 0);
  const actualCosts = parseFloat(data.actualCosts || 0);
  const totalSavings = parseFloat(data.totalSavings || 0);
  const savingsPercentage = parseFloat(data.savingsPercentage || 0);
  const preventedHospitalizations = parseInt(data.preventedHospitalizations || 0);
  
  const avgSavingsPerEvent = preventedHospitalizations > 0 
    ? totalSavings / preventedHospitalizations 
    : 0;

  return (
    <Card>
      <h3 className={styles.title}>💰 Financial Impact</h3>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.label}>
            Projected Costs (No Intervention)
          </div>
          <div className={styles.value}>
            ${(projectedCosts / 1_000_000).toFixed(1)}M
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>
            Actual Costs (With Intervention)
          </div>
          <div className={styles.value}>
            ${(actualCosts / 1_000_000).toFixed(1)}M
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Total Savings</div>
          <div
            className={styles.value}
            style={{ color: "#10b981" }}
          >
            ${(totalSavings / 1_000_000).toFixed(1)}M (
            {savingsPercentage.toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <div className={styles.detailLabel}>
            High-Risk Members Prevented Hospitalization:
          </div>
          <div className={styles.detailValue}>
            {preventedHospitalizations}
          </div>
        </div>

        <div className={styles.detail}>
          <div className={styles.detailLabel}>
            Average Savings per Prevented Event:
          </div>
          <div className={styles.detailValue}>
            ${avgSavingsPerEvent.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FinancialImpact;
