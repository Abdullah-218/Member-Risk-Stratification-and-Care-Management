import React, { useState } from "react";
import { Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/common/Card/Card";
import styles from "./AllMembersPage.module.css";

/* ---------------- DATA PER WINDOW ---------------- */
const membersByWindow = {
  30: [
    { id: "1", name: "John Smith", age: 65, riskScore: 0.66 },
    { id: "2", name: "Jane Doe", age: 72, riskScore: 0.53 },
    { id: "4", name: "Sarah Williams", age: 55, riskScore: 0.20 }
  ],

  60: [
    { id: "1", name: "John Smith", age: 65, riskScore: 0.78 },
    { id: "2", name: "Jane Doe", age: 72, riskScore: 0.65 },
    { id: "3", name: "Michael Johnson", age: 58, riskScore: 0.45 },
    { id: "4", name: "Sarah Williams", age: 55, riskScore: 0.32 },
    { id: "5", name: "David Brown", age: 68, riskScore: 0.85 }
  ],

  90: [
    { id: "1", name: "John Smith", age: 65, riskScore: 0.82 },
    { id: "3", name: "Michael Johnson", age: 58, riskScore: 0.55 },
    { id: "5", name: "David Brown", age: 68, riskScore: 0.92 },
    { id: "6", name: "Emma Davis", age: 61, riskScore: 0.60 }
  ]
};

const AllMembersPage = () => {
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */
  const [predictionWindow, setPredictionWindow] = useState(60);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("all");

  /* ---------------- HELPERS ---------------- */
  const getRiskLevel = (score) => {
    if (score >= 0.7) return "Very High";
    if (score >= 0.5) return "High";
    if (score >= 0.3) return "Medium";
    return "Low";
  };

  const getRiskColor = (score) => {
    if (score >= 0.7) return "#dc2626";
    if (score >= 0.5) return "#f59e0b";
    if (score >= 0.3) return "#3b82f6";
    return "#10b981";
  };

  /* ---------------- ACTIVE MEMBERS ---------------- */
  const activeMembers = membersByWindow[predictionWindow] || [];

  const filteredMembers = activeMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.includes(searchTerm);

    const matchesRisk =
      selectedRiskFilter === "all" ||
      getRiskLevel(m.riskScore).toLowerCase() ===
      selectedRiskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  /* ---------------- UI ---------------- */
  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <Users className={styles.icon} />
        <h1>All Members</h1>
      </div>

      {/* DASHBOARD STYLE WINDOW */}
      <div className={styles.dashboardWindow}>
        <h2 className={styles.windowTitle}>Select Prediction Window</h2>

        <div className={styles.windowButtonGroup}>
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              className={`${styles.dashboardButton} ${predictionWindow === days ? styles.activeWindow : ""
                }`}
              onClick={() => setPredictionWindow(days)}
            >
              {days}-Day Window
            </button>
          ))}
        </div>
      </div>

      {/* MEMBERS */}
      <div className={styles.membersList}>
        {filteredMembers.map((member) => (
          <Card key={member.id} className={styles.memberCard}>
            <h3>{member.name}</h3>

            <div className={styles.scoreBar}>
              <div
                className={styles.scoreIndicator}
                style={{
                  width: `${member.riskScore * 100}%`,
                  backgroundColor: getRiskColor(member.riskScore)
                }}
              />
            </div>

            <div className={styles.scoreText}>
              {(member.riskScore * 100).toFixed(0)}% —{" "}
              <span style={{ color: getRiskColor(member.riskScore) }}>
                {getRiskLevel(member.riskScore)}
              </span>{" "}
              <small style={{ opacity: 0.6 }}>
                (
                {predictionWindow === 30
                  ? "Short-Term"
                  : predictionWindow === 60
                    ? "Mid-Term"
                    : "Long-Term"}
                )
              </small>
            </div>

            <button
              className={styles.viewDetailsButton}
              onClick={() => navigate(`/org/member/${member.id}`)}
            >
              View Member Details
            </button>

          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllMembersPage;
