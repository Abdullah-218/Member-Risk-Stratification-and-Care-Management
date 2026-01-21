import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../../common/Card/Card';
import styles from './TrendAnalysis.module.css';

const TrendAnalysis = () => {
  const trendData = [
    { month: 'Jan', riskScore: 0.45, highRiskMembers: 120, interventions: 35 },
    { month: 'Feb', riskScore: 0.48, highRiskMembers: 145, interventions: 42 },
    { month: 'Mar', riskScore: 0.46, highRiskMembers: 132, interventions: 38 },
    { month: 'Apr', riskScore: 0.51, highRiskMembers: 165, interventions: 48 },
    { month: 'May', riskScore: 0.49, highRiskMembers: 152, interventions: 45 },
    { month: 'Jun', riskScore: 0.47, highRiskMembers: 138, interventions: 41 },
    { month: 'Jul', riskScore: 0.44, highRiskMembers: 115, interventions: 33 },
    { month: 'Aug', riskScore: 0.42, highRiskMembers: 105, interventions: 30 },
    { month: 'Sep', riskScore: 0.41, highRiskMembers: 98, interventions: 28 },
    { month: 'Oct', riskScore: 0.39, highRiskMembers: 85, interventions: 25 },
    { month: 'Nov', riskScore: 0.38, highRiskMembers: 78, interventions: 22 },
    { month: 'Dec', riskScore: 0.35, highRiskMembers: 65, interventions: 18 },
  ];

  return (
    <Card>
      <div className={styles.container}>
        <h3 className={styles.title}>📈 Trend Analysis</h3>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="riskScore" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
                name="Avg Risk Score"
              />
              <Line 
                type="monotone" 
                dataKey="highRiskMembers" 
                stroke="#dc2626" 
                strokeWidth={2}
                dot={{ fill: '#dc2626', r: 4 }}
                activeDot={{ r: 6 }}
                name="High Risk Members"
              />
              <Line 
                type="monotone" 
                dataKey="interventions" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Interventions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.insights}>
          <div className={styles.insight}>
            <span className={styles.label}>Trend</span>
            <span className={styles.value}>📉 Improving</span>
            <span className={styles.description}>Risk scores trending downward</span>
          </div>
          <div className={styles.insight}>
            <span className={styles.label}>Change</span>
            <span className={styles.value}>-22.2%</span>
            <span className={styles.description}>Reduction from Jan to Dec</span>
          </div>
          <div className={styles.insight}>
            <span className={styles.label}>Forecast</span>
            <span className={styles.value}>0.32</span>
            <span className={styles.description}>Projected risk score for next month</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TrendAnalysis;
