import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../common/Card/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RiskDistributionChart = ({ members }) => {
  const navigate = useNavigate();

  const data = [
    {
      name: "Low",
      count: members.filter((m) => m.riskScore < 0.2).length,
      fill: "#10b981",
      riskRange: "low"
    },
    {
      name: "Medium-Low",
      count: members.filter((m) => m.riskScore >= 0.2 && m.riskScore < 0.4).length,
      fill: "#34d399",
      riskRange: "medium-low"
    },
    {
      name: "Medium",
      count: members.filter((m) => m.riskScore >= 0.4 && m.riskScore < 0.6).length,
      fill: "#3b82f6",
      riskRange: "medium"
    },
    {
      name: "High",
      count: members.filter((m) => m.riskScore >= 0.6 && m.riskScore < 0.8).length,
      fill: "#f59e0b",
      riskRange: "high"
    },
    {
      name: "Critical",
      count: members.filter((m) => m.riskScore >= 0.8).length,
      fill: "#dc2626",
      riskRange: "critical"
    },
  ];

  const handleBarClick = (data) => {
    if (data && data.riskRange) {
      // Navigate to high-risk members page with filter
      navigate(`/org/high-risk-members?filter=${data.riskRange}`);
    }
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
    </Card>
  );
};

export default RiskDistributionChart;
