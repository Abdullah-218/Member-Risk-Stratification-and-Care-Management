import React from "react";
import Card from "../../common/Card/Card";
import styles from "./FinancialImpact.module.css";

const FinancialImpact = ({ data }) => {
  // ✅ safety check to avoid blank screen
  if (!data) return null;

  const totalSavings = data.projectedCosts - data.actualCosts;
  const avgSavingsPerEvent =
    totalSavings / data.preventedHospitalizations;

  return (
    <Card>
      <h3 className={styles.title}>💰 Financial Impact</h3>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.label}>
            Projected Costs (No Intervention)
          </div>
          <div className={styles.value}>
            ${(data.projectedCosts / 1_000_000).toFixed(1)}M
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>
            Actual Costs (With Intervention)
          </div>
          <div className={styles.value}>
            ${(data.actualCosts / 1_000_000).toFixed(1)}M
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Total Savings</div>
          <div
            className={styles.value}
            style={{ color: "#10b981" }}
          >
            ${(totalSavings / 1_000_000).toFixed(1)}M (
            {data.savingsPercentage}%)
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <div className={styles.detailLabel}>
            High-Risk Members Prevented Hospitalization:
          </div>
          <div className={styles.detailValue}>
            {data.preventedHospitalizations}
          </div>
        </div>

        <div className={styles.detail}>
          <div className={styles.detailLabel}>
            Average Savings per Prevented Event:
          </div>
          <div className={styles.detailValue}>
            ${avgSavingsPerEvent.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FinancialImpact;
