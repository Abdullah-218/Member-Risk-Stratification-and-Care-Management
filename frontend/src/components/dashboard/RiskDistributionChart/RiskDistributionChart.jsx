import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Card from '../../common/Card/Card';
import styles from './RiskDistributionChart.module.css';

function RiskDistributionChart() {
  const navigate = useNavigate();
  const riskData = [
    { tier: 'Low', count: 56361, percentage: 45 },
    { tier: 'Medium-Low', count: 28180, percentage: 22.5 },
    { tier: 'Medium', count: 25000, percentage: 20 },
    { tier: 'High', count: 15000, percentage: 12 },
    { tier: 'Critical', count: 6272, percentage: 5 },
  ];

  const colors = {
    'Low': '#10b981',
    'Medium-Low': '#6ee7b7',
    'Medium': '#3b82f6',
    'High': '#f59e0b',
    'Critical': '#dc2626'
  };

  const handleBarClick = (tier) => {
    navigate('/risk-members', { state: { riskTier: tier } });
  };

  return (
    <Card>
      <div className={styles.container}>
        <h3 className={styles.title}>📊 Risk Distribution</h3>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tier" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value.toLocaleString()}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                onClick={(data) => handleBarClick(data.tier)}
                style={{ cursor: 'pointer' }}
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[entry.tier]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className={styles.stats}>
          {riskData.map((data) => (
            <div key={data.tier} className={styles.statItem}>
              <div 
                className={styles.colorIndicator} 
                style={{ backgroundColor: colors[data.tier] }}
              />
              <div className={styles.statInfo}>
                <span className={styles.tier}>{data.tier}</span>
                <span className={styles.values}>
                  {data.count.toLocaleString()} members ({data.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default RiskDistributionChart;
