import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  Activity,
  ChevronRight,
  Stethoscope,
  Heart,
  Brain,
  Pill,
  Shield
} from "lucide-react";
import { getDepartmentAnalytics } from "../../services/api/dashboardApi";

import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import styles from "./DepartmentsPage.module.css";

// Department icon mapping
const departmentIcons = {
  'CARD': Heart,
  'ONCO': Shield,
  'NEURO': Brain,
  'ORTHO': Activity,
  'PEDI': Users,
  'ENDO': Pill,
  default: Stethoscope
};

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
    // Navigate to department members page, show all patients
    navigate(`/org/department-members/${encodeURIComponent(departmentName)}?window=${predictionWindow}`);
  };

  const handleWindowChange = (days) => {
    setPredictionWindow(days);
  };

  // Calculate total patients across all departments (convert string to number)
  const totalPatients = departments.reduce((sum, dept) => sum + parseInt(dept.totalPatients || 0), 0);

  return (
    <div className={styles.container}>

      {/* MODERN HEADER WITH STATS */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <Building2 size={32} className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Hospital Departments</h1>
              <p className={styles.subtitle}>
                Comprehensive overview of all departments and their risk profiles
              </p>
            </div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statCard}>
              <Building2 size={20} className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>{departments.length}</div>
                <div className={styles.statLabel}>Departments</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <Users size={20} className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>{totalPatients.toLocaleString()}</div>
                <div className={styles.statLabel}>Total Patients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PREDICTION WINDOW SELECTOR - MODERN TABS */}
      <div className={styles.windowSelector}>
        <div className={styles.windowLabel}>
          <Activity size={18} />
          <span>Prediction Window</span>
        </div>
        <div className={styles.windowButtons}>
          {[30, 60, 90].map(days => (
            <button
              key={days}
              onClick={() => handleWindowChange(days)}
              className={`${styles.windowBtn} ${predictionWindow === days ? styles.activeWindow : ''}`}
            >
              <span className={styles.windowDays}>{days}</span>
              <span className={styles.windowText}>Days</span>
            </button>
          ))}
        </div>
      </div>

      {/* DEPARTMENTS GRID */}
      <div className={styles.departmentsGrid}>
        {departments.map((dept) => {
          const DeptIcon = departmentIcons[dept.departmentCode] || departmentIcons.default;
          
          return (
            <Card
              key={dept.departmentId}
              className={styles.departmentCard}
              onClick={() => handleViewMembers(dept.departmentName)}
            >
                  <div className={styles.cardTop}>
                    <div className={styles.deptIconContainer}>
                      <DeptIcon size={24} className={styles.deptIcon} />
                    </div>
                    <div className={styles.patientBadge}>
                      <Users size={14} />
                      <span>{parseInt(dept.totalPatients || 0)}</span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.deptTitle}>
                      {dept.departmentName}
                    </h3>
                    <p className={styles.deptCode}>{dept.departmentCode}</p>
                  </div>

                  {/* RISK TIER PILLS */}
                  <div className={styles.riskPills}>
                    {parseInt(dept.criticalCount || 0) > 0 && (
                      <div className={`${styles.riskPill} ${styles.critical}`}>
                        <AlertCircle size={14} />
                        <span>{dept.criticalCount} Critical</span>
                      </div>
                    )}
                    {parseInt(dept.highCount || 0) > 0 && (
                      <div className={`${styles.riskPill} ${styles.high}`}>
                        <TrendingUp size={14} />
                        <span>{dept.highCount} High</span>
                      </div>
                    )}
                    {parseInt(dept.mediumCount || 0) > 0 && (
                      <div className={`${styles.riskPill} ${styles.medium}`}>
                        <Activity size={14} />
                        <span>{dept.mediumCount} Medium</span>
                      </div>
                    )}
                  </div>

                  {/* METRICS GRID */}
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricItem}>
                      <div className={styles.metricIcon}>
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <div className={styles.metricLabel}>Avg Risk</div>
                        <div className={styles.metricValue}>
                          {(parseFloat(dept.avgRiskScore || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricIcon}>
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <div className={styles.metricLabel}>ROI</div>
                        <div className={styles.metricValue}>
                          {parseFloat(dept.avgRoiPercent || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricIcon}>
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <div className={styles.metricLabel}>Savings</div>
                        <div className={styles.metricValue}>
                          ${(parseFloat(dept.totalPotentialSavings || 0) / 1000).toFixed(1)}K
                        </div>
                      </div>
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
                      <span>View Members</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* DEPARTMENT DISTRIBUTION PIE CHART */}
          <Card className={styles.visualizationCard}>
            <h3 className={styles.sectionTitle}>Department Patient Distribution</h3>
            <DepartmentPieChart departments={departments} totalPatients={totalPatients} />
          </Card>
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
