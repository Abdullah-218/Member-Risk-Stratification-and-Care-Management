import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import Card from "../../common/Card/Card";
import TierAnalyticsModal from "../TierAnalyticsModal/TierAnalyticsModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./RiskDistributionChart.css";

const RiskDistributionChart = ({ members, predictionWindow }) => {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({
    isOpen: false,
    tier: null,
    tierName: ''
  });

  // Use riskTier instead of riskScore ranges
  const data = [
    {
      name: "Tier 1 - Low",
      tier: 1,
      count: members.filter((m) => m.riskTier === 1).length,
      fill: "#10b981",
      riskRange: "low"
    },
    {
      name: "Tier 2 - Low-Moderate",
      tier: 2,
      count: members.filter((m) => m.riskTier === 2).length,
      fill: "#34d399",
      riskRange: "medium-low"
    },
    {
      name: "Tier 3 - Moderate",
      tier: 3,
      count: members.filter((m) => m.riskTier === 3).length,
      fill: "#f59e0b",
      riskRange: "medium"
    },
    {
      name: "Tier 4 - High",
      tier: 4,
      count: members.filter((m) => m.riskTier === 4).length,
      fill: "#f97316",
      riskRange: "high"
    },
    {
      name: "Tier 5 - Critical",
      tier: 5,
      count: members.filter((m) => m.riskTier === 5).length,
      fill: "#dc2626",
      riskRange: "critical"
    },
  ];

  const handleBarClick = (data) => {
    if (data && data.riskRange) {
      // Navigate to high-risk members page with filter and window
      navigate(`/org/high-risk-members?filter=${data.riskRange}&window=${predictionWindow}`);
    }
  };

  const openAnalytics = (tier, tierName) => {
    console.log('=== TIER BUTTON CLICKED ===');
    console.log('Tier:', tier, 'Name:', tierName);
    console.log('Prediction Window:', predictionWindow);
    
    setModalState({
      isOpen: true,
      tier,
      tierName
    });
    
    console.log('Modal state updated:', { isOpen: true, tier, tierName });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      tier: null,
      tierName: ''
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '8px',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].payload.name}</p>
          <p style={{ margin: 0 }}>{payload[0].value} members</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Click to view details</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card>
        <h3>📊 Risk Distribution</h3>
        <p>Distribution across risk categories</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" onClick={handleBarClick} cursor="pointer">
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tier Analytics Buttons */}
        <div className="tier-analytics-buttons">
          {data.map((tier) => (
            <button
              key={tier.tier}
              className="tier-analytics-btn"
              onClick={() => openAnalytics(tier.tier, tier.name)}
              style={{ borderColor: tier.fill }}
            >
              <BarChart3 size={16} />
              <span>{tier.name}</span>
              <span className="tier-count">{tier.count}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Analytics Modal */}
      <TierAnalyticsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        tier={modalState.tier}
        tierName={modalState.tierName}
        predictionWindow={predictionWindow}
      />
    </>
  );
};

export default RiskDistributionChart;
