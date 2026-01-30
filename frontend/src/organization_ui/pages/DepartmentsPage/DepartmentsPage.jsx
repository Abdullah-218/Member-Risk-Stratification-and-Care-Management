import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartmentAnalytics } from "../../services/api/dashboardApi";

import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import styles from "./DepartmentsPage.module.css";

const DepartmentsPage = () => {
  const navigate = useNavigate();

  const [predictionWindow, setPredictionWindow] = useState(90);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch department analytics from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const windowParam = `${predictionWindow}_day`;
        console.log('Fetching departments for window:', windowParam);
        const result = await getDepartmentAnalytics(windowParam);
        
        console.log('Department analytics result:', result);
        setDepartments(result.data || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartments();
  }, [predictionWindow]);

  const handleViewMembers = (departmentName) => {
    // Navigate to department members page, filtered to show only high-risk patients (tiers 4+5)
    navigate(`/org/department-members/${encodeURIComponent(departmentName)}?window=${predictionWindow}&riskFilter=high`);
  };

  // Calculate total patients across all departments (convert string to number)
  const totalPatients = departments.reduce((sum, dept) => sum + parseInt(dept.totalPatients || 0), 0);

  return (
    <div className={styles.container}>

      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>🏥 Hospital Departments</h2>
        <p className={styles.subtitle}>
          {departments.length} departments • {totalPatients.toLocaleString()} patients
        </p>
      </div>

      {/* PREDICTION WINDOW SELECTOR */}
      <div className={styles.predictionBanner}>
        <h3>Select Prediction Window</h3>
        <div className={styles.windowButtons}>
          {[30, 60, 90].map(day => (
            <button
              key={day}
              className={`${styles.windowBtn} ${predictionWindow === day ? styles.active : ""}`}
              onClick={() => setPredictionWindow(day)}
            >
              {day}-Day Window
            </button>
          ))}
        </div>
      </div>

      {/* LOADING/ERROR STATES */}
      {loading ? (
        <div className={styles.loadingState}>
          <p>Loading departments...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>Error loading departments: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <>
          {/* DEPARTMENTS GRID */}
          <div className={styles.departmentsGrid}>
            {departments.map(dept => (
              <Card
                key={dept.departmentId}
                className={styles.departmentCard}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.deptName}>
                    {dept.departmentName}
                    <span className={styles.deptCode}>({dept.departmentCode})</span>
                  </h3>
                  <span className={styles.memberCount}>
                    {parseInt(dept.totalPatients || 0).toLocaleString()} patients
                  </span>
                </div>

                {/* RISK TIER BREAKDOWN - Only 3 tiers */}
                <div className={styles.riskDistribution}>
                  {parseInt(dept.criticalCount || 0) > 0 && (
                    <RiskTier 
                      label="Critical" 
                      count={dept.criticalCount} 
                      icon="🔴"
                      tier={5}
                    />
                  )}
                  {parseInt(dept.highCount || 0) > 0 && (
                    <RiskTier 
                      label="High" 
                      count={dept.highCount} 
                      icon="🟠"
                      tier={4}
                    />
                  )}
                  {parseInt(dept.mediumCount || 0) > 0 && (
                    <RiskTier 
                      label="Medium" 
                      count={dept.mediumCount} 
                      icon="🟡"
                      tier={3}
                    />
                  )}
                </div>

                {/* DEPARTMENT METRICS */}
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Avg Risk:</span>
                    <span className={styles.metricValue}>
                      {(parseFloat(dept.avgRiskScore || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>ROI:</span>
                    <span className={styles.metricValue}>
                      {parseFloat(dept.avgRoiPercent || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Savings:</span>
                    <span className={styles.metricValue}>
                      ${parseFloat(dept.totalPotentialSavings || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={styles.viewButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMembers(dept.departmentName);
                    }}
                  >
                    View Members →
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* DEPARTMENT DISTRIBUTION PIE CHART */}
          <Card className={styles.visualizationCard}>
            <h3 className={styles.sectionTitle}>Department Patient Distribution</h3>
            <DepartmentPieChart departments={departments} totalPatients={totalPatients} />
          </Card>
        </>
      )}
    </div>
  );
};

// Risk Tier Component
const RiskTier = ({ label, count, icon, tier }) => (
  <div className={styles.riskStat}>
    <span className={styles.riskIcon}>{icon}</span>
    <span className={styles.riskType}>{label}</span>
    <span className={styles.riskCount}>{count}</span>
  </div>
);

// Simple Pie Chart Component
const DepartmentPieChart = ({ departments, totalPatients }) => {
  // Colors for departments
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
  ];

  // Calculate percentages and create pie slices
  let cumulativePercent = 0;
  
  // Safety check for totalPatients
  if (!totalPatients || totalPatients === 0) {
    return (
      <div className={styles.pieChartContainer}>
        <p>No patient data available</p>
      </div>
    );
  }
  
  return (
    <div className={styles.pieChartContainer}>
      <svg viewBox="0 0 200 200" className={styles.pieChart}>
        {departments.map((dept, index) => {
          const patientCount = parseInt(dept.totalPatients || 0);
          const percentage = (patientCount / totalPatients) * 100;
          const angle = (percentage / 100) * 360;
          
          // Calculate slice path
          const startAngle = (cumulativePercent / 100) * 360;
          const endAngle = startAngle + angle;
          
          const x1 = 100 + 90 * Math.cos((Math.PI * startAngle) / 180);
          const y1 = 100 + 90 * Math.sin((Math.PI * startAngle) / 180);
          const x2 = 100 + 90 * Math.cos((Math.PI * endAngle) / 180);
          const y2 = 100 + 90 * Math.sin((Math.PI * endAngle) / 180);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M 100 100`,
            `L ${x1} ${y1}`,
            `A 90 90 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');
          
          cumulativePercent += percentage;
          
          return (
            <path
              key={dept.departmentId}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="#fff"
              strokeWidth="1"
              className={styles.pieSlice}
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className={styles.pieLegend}>
        {departments.map((dept, index) => {
          const patientCount = parseInt(dept.totalPatients || 0);
          const percentage = ((patientCount / totalPatients) * 100).toFixed(1);
          return (
            <div key={dept.departmentId} className={styles.legendItem}>
              <span 
                className={styles.legendColor} 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className={styles.legendLabel}>
                {dept.departmentName}
              </span>
              <span className={styles.legendValue}>
                {patientCount.toLocaleString()} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentsPage;
