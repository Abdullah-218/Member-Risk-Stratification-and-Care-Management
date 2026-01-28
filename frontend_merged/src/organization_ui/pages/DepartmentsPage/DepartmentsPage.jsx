import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMembers } from "../../context/MemberContext";

import Card from "../../components/common/Card/Card";
import styles from "./DepartmentsPage.module.css";

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const { members } = useMembers();

  // ✅ SAME WINDOW STATE
  const [predictionWindow, setPredictionWindow] = useState(90);

  // ✅ Adjust members based on window (same logic as Dashboard)
  const adjustedMembers = useMemo(() => {
    let multiplier = 1;

    if (predictionWindow === 30) multiplier = 0.85;
    if (predictionWindow === 60) multiplier = 1;
    if (predictionWindow === 90) multiplier = 1.15;

    return members.map(m => ({
      ...m,
      riskScore: Math.min(m.riskScore * multiplier, 1),
    }));
  }, [members, predictionWindow]);

  const handleViewMembers = (departmentName) => {
    navigate(`/org/department-members/${encodeURIComponent(departmentName)}`);
  };

  // ✅ Group members by department (DYNAMIC)
  const departmentData = useMemo(() => {
    const depts = {};

    adjustedMembers.forEach(member => {
      const dept = member.department || "Unassigned";
      if (!depts[dept]) depts[dept] = [];
      depts[dept].push(member);
    });

    return Object.keys(depts).sort().map(dept => ({
      name: dept,
      count: depts[dept].length,
      members: depts[dept],
      riskBreakdown: {
        critical: depts[dept].filter(m => m.riskScore >= 0.8).length,
        high: depts[dept].filter(m => m.riskScore >= 0.6 && m.riskScore < 0.8).length,
        medium: depts[dept].filter(m => m.riskScore >= 0.4 && m.riskScore < 0.6).length,
        mediumLow: depts[dept].filter(m => m.riskScore >= 0.2 && m.riskScore < 0.4).length,
        low: depts[dept].filter(m => m.riskScore < 0.2).length,
      }
    }));
  }, [adjustedMembers]);

  return (
    <div className={styles.container}>

      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>🏥 Hospital Departments</h2>
        <p className={styles.subtitle}>
          {departmentData.length} departments • {adjustedMembers.length} members
        </p>
      </div>

      {/* 🔵 SAME PREDICTION WINDOW UI */}
      <div className={styles.predictionBanner}>
        <h3>Select Prediction Window</h3>
        <div className={styles.windowButtons}>
          {[30, 60, 90].map(day => (
            <button
              key={day}
              className={`${styles.windowBtn} ${predictionWindow === day ? styles.active : ""
                }`}
              onClick={() => setPredictionWindow(day)}
            >
              {day}-Day Window
            </button>
          ))}
        </div>
      </div>

      {/* DEPARTMENTS GRID */}
      <div className={styles.departmentsGrid}>
        {departmentData.map(dept => (
          <Card
            key={dept.name}
            className={styles.departmentCard}
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.deptName}>{dept.name}</h3>
              <span className={styles.memberCount}>{dept.count} members</span>
            </div>

            <div className={styles.riskDistribution}>
              {dept.riskBreakdown.critical > 0 && (
                <Risk label="Critical" count={dept.riskBreakdown.critical} icon="🔴" />
              )}
              {dept.riskBreakdown.high > 0 && (
                <Risk label="High" count={dept.riskBreakdown.high} icon="🟠" />
              )}
              {dept.riskBreakdown.medium > 0 && (
                <Risk label="Medium" count={dept.riskBreakdown.medium} icon="🔵" />
              )}
              {dept.riskBreakdown.mediumLow > 0 && (
                <Risk label="Med-Low" count={dept.riskBreakdown.mediumLow} icon="🟢" />
              )}
              {dept.riskBreakdown.low > 0 && (
                <Risk label="Low" count={dept.riskBreakdown.low} icon="💚" />
              )}
            </div>

            <div className={styles.cardFooter}>
              <button
                className={styles.viewButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewMembers(dept.name);
                }}
              >
                View Members →
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ✅ Small helper component
const Risk = ({ label, count, icon }) => (
  <div className={styles.riskStat}>
    <span className={styles.riskIcon}>{icon}</span>
    <span className={styles.riskType}>{label}</span>
    <span className={styles.riskCount}>{count}</span>
  </div>
);

export default DepartmentsPage;
