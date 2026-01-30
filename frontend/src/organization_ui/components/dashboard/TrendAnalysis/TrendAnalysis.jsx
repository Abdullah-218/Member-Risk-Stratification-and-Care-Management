import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Card from '../../common/Card/Card';
import styles from './TrendAnalysis.module.css';

const TrendAnalysis = ({ trendData }) => {
  // Transform API trend data to chart format
  const chartData = trendData ? trendData.map(item => ({
    window: item.window === '30_day' ? '30 Days' : 
            item.window === '60_day' ? '60 Days' : '90 Days',
    totalMembers: item.totalMembers,
    highRisk: item.highRiskCount,
    projectedCost: item.totalCost / 1000, // Convert to thousands
    avgRoi: item.avgRoi,
  })) : [];

  if (!trendData || chartData.length === 0) {
    return (
      <Card id="trend-analysis">
        <div className={styles.container}>
          <h3 className={styles.title}>📈 Cross-Window Trend Analysis</h3>
          <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            Loading trend data...
          </p>
        </div>
      </Card>
    );
  }

  const costIncrease = chartData[2]?.projectedCost - chartData[0]?.projectedCost;
  const highRiskGrowth = chartData[0]?.highRisk > 0 
    ? ((chartData[2]?.highRisk - chartData[0]?.highRisk) / chartData[0]?.highRisk * 100)
    : 0;
  const maxRoi = Math.max(...chartData.map(d => d.avgRoi));
  const bestRoiWindow = chartData.find(d => d.avgRoi === maxRoi)?.window;

  return (
    <Card id="trend-analysis">
      <div className={styles.container}>
        <h3 className={styles.title}>📈 Cross-Window Trend Analysis</h3>
        
        {/* High Risk Count Comparison */}
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>High Risk Patients by Prediction Window</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="window" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar 
                dataKey="highRisk" 
                fill="#dc2626" 
                name="High Risk Patients (Tier 4-5)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projected Cost Comparison */}
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>Projected Costs (in thousands)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="window" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
                formatter={(value) => `$${value.toFixed(0)}k`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="projectedCost" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 6 }}
                activeDot={{ r: 8 }}
                name="Projected Cost"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Average ROI Comparison */}
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>Average ROI by Window</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="window" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
                formatter={(value) => `${value.toFixed(2)}%`}
              />
              <Legend />
              <Bar 
                dataKey="avgRoi" 
                fill="#10b981" 
                name="Average ROI (%)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.insights}>
          <div className={styles.insight}>
            <span className={styles.label}>Risk Trend</span>
            <span className={styles.value}>📈 Increasing</span>
            <span className={styles.description}>
              High-risk patients increase from {chartData[0]?.highRisk} to {chartData[2]?.highRisk} 
              ({highRiskGrowth.toFixed(1)}% growth)
            </span>
          </div>
          <div className={styles.insight}>
            <span className={styles.label}>Cost Impact</span>
            <span className={styles.value}>
              ${(costIncrease * 1000).toLocaleString()}
            </span>
            <span className={styles.description}>Additional cost from 30-day to 90-day window</span>
          </div>
          <div className={styles.insight}>
            <span className={styles.label}>Best ROI</span>
            <span className={styles.value}>
              {maxRoi.toFixed(2)}%
            </span>
            <span className={styles.description}>
              {bestRoiWindow} prediction window
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TrendAnalysis;
