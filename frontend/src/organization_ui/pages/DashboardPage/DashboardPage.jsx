import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, LayoutDashboard, Users, TrendingUp, DollarSign, AlertCircle, Activity, BarChart3 } from "lucide-react";

import { useMembers } from "../../context/MemberContext";
import Button from "../../components/common/Button/Button";

import PopulationOverview from "../../components/dashboard/PopulationOverview/PopulationOverview";
import PriorityActions from "../../components/dashboard/PriorityActions/PriorityActions";
import RiskDistributionChart from "../../components/dashboard/RiskDistributionChart/RiskDistributionChart";
import TrendAnalysis from "../../components/dashboard/TrendAnalysis/TrendAnalysis";
import FinancialMetrics from "../../components/dashboard/FinancialMetrics/FinancialMetrics";
import { usePredictionWindow } from "../../context/PredictionWindowContext";
import PredictionWindowSelector from "../../components/common/PredictionWindowSelector";
import { getDashboardMembers, getDashboardSummary, getTierStatistics, getTrendData } from "../../services/api/dashboardApi";

import styles from "./DashboardPage.module.css";

const DashboardPage = () => {
  const { members: mockMembers } = useMembers();
  const navigate = useNavigate();

  const { predictionWindow } = usePredictionWindow();
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);
  
  // Real API data state
  const [dashboardData, setDashboardData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      // For initial load, show full loading
      // For window changes, show transitioning state
      if (dashboardData) {
        setTransitioning(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      try {
        const windowParam = `${predictionWindow}_day`;
        
        const [summary, members, tiers] = await Promise.all([
          getDashboardSummary(windowParam),
          getDashboardMembers(windowParam, 3500), // Get all members (database has 3002)
          getTierStatistics(windowParam)
        ]);
        
        setDashboardData({
          summary,
          members,
          tiers
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setTransitioning(false);
      }
    };
    
    fetchDashboardData();
  }, [predictionWindow]);

  // Fetch trend data (only once, not dependent on window)
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const trends = await getTrendData();
        setTrendData(trends);
      } catch (err) {
        console.error('Error fetching trend data:', err);
      }
    };
    
    fetchTrends();
  }, []);

  // Use real data or fallback to mock data
  const members = dashboardData?.members || mockMembers;


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
    if (!dashboardData?.members) {
      // Fallback to original mock distribution if API data not available
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
          const risk = min + Math.random() * (max - min);

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
    }
    
    // Transform real API data to component format
    return dashboardData.members.map(member => ({
      id: member.id,
      name: `Patient ${member.externalId}`,
      age: member.age,
      gender: member.gender,
      department: member.department,
      riskScore: member.riskScore,
      riskTier: member.riskTier,
      estimatedCost: member.estimatedCost,
      interventionCost: member.interventionCost,
      expectedSavings: member.expectedSavings,
      netBenefit: member.netBenefit,
      roiPercent: member.roiPercent
    }));
  }, [dashboardData, members, predictionWindow]);
  
  const projectedAnnualCost = useMemo(() => {
    if (dashboardData?.summary) {
      return dashboardData.summary.financials.projectedCost;
    }
    return adjustedMembers.reduce((sum, m) => {
      if (m.riskScore >= 0.8) return sum + 80000;
      if (m.riskScore >= 0.6) return sum + 50000;
      if (m.riskScore >= 0.4) return sum + 25000;
      if (m.riskScore >= 0.2) return sum + 10000;
      return sum + 3000;
    }, 0);
  }, [dashboardData, adjustedMembers]);

  const totalCost = useMemo(() => {
    if (dashboardData?.summary) {
      return dashboardData.summary.financials.projectedCost;
    }
    return adjustedMembers.reduce((sum, m) => {
      if (m.riskScore >= 0.8) return sum + 80000;
      if (m.riskScore >= 0.6) return sum + 50000;
      if (m.riskScore >= 0.4) return sum + 25000;
      if (m.riskScore >= 0.2) return sum + 12000;
      return sum + 5000;
    }, 0);
  }, [dashboardData, adjustedMembers]);

  const potentialSavings = useMemo(() => {
    if (dashboardData?.summary) {
      return dashboardData.summary.financials.potentialSavings;
    }
    return totalCost * analyticsByWindow[predictionWindow].savingsRate;
  }, [dashboardData, totalCost, analyticsByWindow, predictionWindow]);

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






  const highRiskCount = useMemo(() => {
    if (dashboardData?.summary) {
      return dashboardData.summary.highRisk.count;
    }
    return adjustedMembers.filter((m) => m.riskScore >= 0.6).length;
  }, [dashboardData, adjustedMembers]);

  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Activity size={48} className={styles.loadingIcon} />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <p>Error loading dashboard: {error}</p>
          <p className={styles.errorSubtext}>
            Using fallback mock data instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* PREDICTION WINDOW SELECTOR - AT TOP */}
      <PredictionWindowSelector />

      {/* MODERN HEADER WITH STATS */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <LayoutDashboard size={32} className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Organization Dashboard</h1>
              <p className={styles.subtitle}>
                Real-time health risk analytics and population insights
              </p>
            </div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statCard}>
              <Users size={20} className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>{adjustedMembers.length.toLocaleString()}</div>
                <div className={styles.statLabel}>Total Patients</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <AlertCircle size={20} className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>{highRiskCount}</div>
                <div className={styles.statLabel}>High Risk</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <DollarSign size={20} className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>${(potentialSavings / 1000000).toFixed(1)}M</div>
                <div className={styles.statLabel}>Potential Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`${styles.content} ${transitioning ? styles.transitioning : ''}`}>
        {/* ✅ USE real API data */}
        <PopulationOverview
          members={adjustedMembers}
          summaryData={dashboardData?.summary}
          projectedAnnualCost={projectedAnnualCost}
          potentialSavings={potentialSavings}
          costChangePercent={costChangePercent}
        />

        {/* Financial Metrics Grid */}
        <FinancialMetrics summaryData={dashboardData?.summary} />

        <RiskDistributionChart members={adjustedMembers} predictionWindow={predictionWindow} />

        <PriorityActions
          highRiskCount={highRiskCount}
          diabetesRiskIncrease={
            analyticsByWindow[predictionWindow].diabetesRiskIncrease
          }
          onViewHighRisk={() => navigate(`/org/high-risk-members?window=${predictionWindow}`)}
          onViewTrendAnalysis={() => setShowTrendAnalysis(true)}
        />


        {showTrendAnalysis && (
          <TrendAnalysis 
            predictionWindow={predictionWindow} 
            trendData={trendData}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
