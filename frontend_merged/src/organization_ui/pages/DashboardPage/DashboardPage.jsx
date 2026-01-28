import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download } from "lucide-react";

import { useMembers } from "../../context/MemberContext";
import Button from "../../components/common/Button/Button";

import PopulationOverview from "../../components/dashboard/PopulationOverview/PopulationOverview";
import PriorityActions from "../../components/dashboard/PriorityActions/PriorityActions";
import QuickActions from "../../components/dashboard/QuickActions/QuickActions";
import RiskDistributionChart from "../../components/dashboard/RiskDistributionChart/RiskDistributionChart";
import TrendAnalysis from "../../components/dashboard/TrendAnalysis/TrendAnalysis";
import { usePredictionWindow } from "../../context/PredictionWindowContext";
import PredictionWindowSelector from "../../components/common/PredictionWindowSelector";


import styles from "./DashboardPage.module.css";

const DashboardPage = () => {
  const { members } = useMembers();
  const navigate = useNavigate();

  const { predictionWindow } = usePredictionWindow();
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);


  const analyticsByWindow = {
    30: {
      savingsRate: 0.064,
      diabetesRiskIncrease: 8,
    },
    60: {
      savingsRate: 0.092,
      diabetesRiskIncrease: 15,
    },
    90: {
      savingsRate: 0.138,
      diabetesRiskIncrease: 22,
    },
  };

  const adjustedMembers = useMemo(() => {
    // 🔹 Target distribution per window
    const distributionMap = {
      30: [
        { min: 0.8, max: 0.95, percent: 0.25 }, // Very High
        { min: 0.6, max: 0.79, percent: 0.30 }, // High
        { min: 0.4, max: 0.59, percent: 0.25 }, // Medium
        { min: 0.2, max: 0.39, percent: 0.15 }, // Low
        { min: 0.05, max: 0.19, percent: 0.05 }, // Very Low
      ],
      60: [
        { min: 0.8, max: 0.95, percent: 0.35 },
        { min: 0.6, max: 0.79, percent: 0.30 },
        { min: 0.4, max: 0.59, percent: 0.20 },
        { min: 0.2, max: 0.39, percent: 0.10 },
        { min: 0.05, max: 0.19, percent: 0.05 },
      ],
      90: [
        { min: 0.8, max: 0.95, percent: 0.45 },
        { min: 0.6, max: 0.79, percent: 0.30 },
        { min: 0.4, max: 0.59, percent: 0.15 },
        { min: 0.2, max: 0.39, percent: 0.07 },
        { min: 0.05, max: 0.19, percent: 0.03 },
      ],
    };

    const distribution = distributionMap[predictionWindow];
    const total = members.length;

    let cursor = 0;
    let result = [];

    distribution.forEach(({ min, max, percent }) => {
      const count = Math.round(total * percent);

      for (let i = 0; i < count && cursor < total; i++) {
        const risk =
          min + Math.random() * (max - min);

        result.push({
          ...members[cursor],
          riskScore: Number(risk.toFixed(2)),
        });
        cursor++;
      }
    });

    // safety fallback
    while (result.length < total) {
      result.push({
        ...members[result.length],
        riskScore: 0.3,
      });
    }

    return result;
  }, [members, predictionWindow]);
  const projectedAnnualCost = adjustedMembers.reduce((sum, m) => {
    if (m.riskScore >= 0.8) return sum + 80000;
    if (m.riskScore >= 0.6) return sum + 50000;
    if (m.riskScore >= 0.4) return sum + 25000;
    if (m.riskScore >= 0.2) return sum + 10000;
    return sum + 3000;
  }, 0);

  const totalCost = adjustedMembers.reduce((sum, m) => {
    if (m.riskScore >= 0.8) return sum + 80000;
    if (m.riskScore >= 0.6) return sum + 50000;
    if (m.riskScore >= 0.4) return sum + 25000;
    if (m.riskScore >= 0.2) return sum + 12000;
    return sum + 5000;
  }, 0);

  const potentialSavings =
    totalCost * analyticsByWindow[predictionWindow].savingsRate;

  // baseline = 60-day window (constant reference)
  const baselineCost = useMemo(() => {
    return members.reduce((sum, m) => {
      if (m.riskScore >= 0.8) return sum + 80000;
      if (m.riskScore >= 0.6) return sum + 50000;
      if (m.riskScore >= 0.4) return sum + 25000;
      if (m.riskScore >= 0.2) return sum + 12000;
      return sum + 5000;
    }, 0);
  }, [members]);
  const costChangePercent =
    baselineCost > 0
      ? ((totalCost - baselineCost) / baselineCost) * 100
      : 0;






  const highRiskCount = adjustedMembers.filter(
    (m) => m.riskScore >= 0.6
  ).length;


  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Organization Dashboard</h2>
      </div>

      <PredictionWindowSelector />


      {/* MAIN CONTENT */}
      <div className={styles.content}>
        {/* ✅ USE adjustedMembers */}
        <PopulationOverview
          members={adjustedMembers}
          projectedAnnualCost={projectedAnnualCost}
          potentialSavings={potentialSavings}
          costChangePercent={costChangePercent}
        />


        <RiskDistributionChart members={adjustedMembers} />

        <PriorityActions
          highRiskCount={highRiskCount}
          diabetesRiskIncrease={
            analyticsByWindow[predictionWindow].diabetesRiskIncrease
          }
          onViewHighRisk={() => navigate("/org/high-risk-members")}
          onViewTrendAnalysis={() => setShowTrendAnalysis(true)}
        />


        {showTrendAnalysis && (
          <TrendAnalysis predictionWindow={predictionWindow} />
        )}

        <QuickActions />
      </div>
    </div>
  );
};

export default DashboardPage;
