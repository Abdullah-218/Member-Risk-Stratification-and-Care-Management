import React from 'react';
import Card from '../../common/Card/Card';
import styles from './WindowComparison.module.css';

const WindowComparison = ({ allWindowsData }) => {
  if (!allWindowsData) return null;

  const windows = [
    { label: '30-Day', key: '30', color: '#60a5fa', darkColor: '#3b82f6' },
    { label: '60-Day', key: '60', color: '#818cf8', darkColor: '#6366f1' },
    { label: '90-Day', key: '90', color: '#a78bfa', darkColor: '#8b5cf6' }
  ];

  // Prepare chart data
  const chartData = windows.map(window => {
    const data = allWindowsData[window.key];
    if (!data) return null;

    return {
      label: window.label,
      savings: parseFloat(data.totalSavings || 0) / 1_000_000,
      percentage: parseFloat(data.savingsPercentage || 0),
      prevented: parseInt(data.preventedHospitalizations || 0),
      projected: parseFloat(data.projectedCosts || 0) / 1_000_000,
      actual: parseFloat(data.actualCosts || 0) / 1_000_000,
      color: window.color,
      darkColor: window.darkColor
    };
  }).filter(Boolean);

  // Find max values for scaling
  const maxSavings = Math.max(...chartData.map(d => d.savings));
  const maxPercent = Math.max(...chartData.map(d => d.percentage));
  const maxPrevented = Math.max(...chartData.map(d => d.prevented));

  return (
    <Card>
      <h3 className={styles.title}>📊 Prediction Window Comparison</h3>
      <p className={styles.subtitle}>Impact Analysis Across 30, 60, and 90-Day Windows</p>

      <div className={styles.chartsContainer}>
        {/* Savings Amount Chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>💰 Total Savings (Millions)</h4>
          </div>
          <div className={styles.barChart}>
            {chartData.map((data, idx) => {
              const height = maxSavings > 0 ? (data.savings / maxSavings) * 100 : 0;
              return (
                <div key={idx} className={styles.barColumn}>
                  <div className={styles.barValue}>
                    ${data.savings.toFixed(2)}M
                  </div>
                  <div className={styles.barWrapper}>
                    <div 
                      className={styles.bar}
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: data.color,
                        boxShadow: `0 4px 12px ${data.color}40`
                      }}
                    >
                      <div className={styles.barGlow} style={{ background: `linear-gradient(to bottom, ${data.darkColor}, transparent)` }}></div>
                    </div>
                  </div>
                  <div className={styles.barLabel}>{data.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Percentage Chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>📈 Savings Percentage</h4>
          </div>
          <div className={styles.barChart}>
            {chartData.map((data, idx) => {
              const height = maxPercent > 0 ? (data.percentage / maxPercent) * 100 : 0;
              return (
                <div key={idx} className={styles.barColumn}>
                  <div className={styles.barValue}>
                    {data.percentage.toFixed(1)}%
                  </div>
                  <div className={styles.barWrapper}>
                    <div 
                      className={styles.bar}
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: '#10b981',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div className={styles.barGlow} style={{ background: 'linear-gradient(to bottom, #059669, transparent)' }}></div>
                    </div>
                  </div>
                  <div className={styles.barLabel}>{data.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prevented Hospitalizations Chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>🏥 High-Risk Prevented</h4>
          </div>
          <div className={styles.barChart}>
            {chartData.map((data, idx) => {
              const height = maxPrevented > 0 ? (data.prevented / maxPrevented) * 100 : 0;
              return (
                <div key={idx} className={styles.barColumn}>
                  <div className={styles.barValue}>
                    {data.prevented}
                  </div>
                  <div className={styles.barWrapper}>
                    <div 
                      className={styles.bar}
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: '#f59e0b',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <div className={styles.barGlow} style={{ background: 'linear-gradient(to bottom, #d97706, transparent)' }}></div>
                    </div>
                  </div>
                  <div className={styles.barLabel}>{data.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Line Chart - Cost Comparison */}
      <div className={styles.lineChartSection}>
        <h4 className={styles.chartTitle}>💵 Cost Comparison Trend</h4>
        <div className={styles.lineChart}>
          <div className={styles.yAxis}>
            <div className={styles.yLabel}>$3.5M</div>
            <div className={styles.yLabel}>$2.6M</div>
            <div className={styles.yLabel}>$1.8M</div>
            <div className={styles.yLabel}>$0.9M</div>
            <div className={styles.yLabel}>$0M</div>
          </div>
          <div className={styles.chartArea}>
            <svg className={styles.svg} viewBox="0 0 600 300" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="75" x2="600" y2="75" stroke="#e5e7eb" strokeWidth="1"/>
              <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1"/>
              <line x1="0" y1="225" x2="600" y2="225" stroke="#e5e7eb" strokeWidth="1"/>
              
              {/* Projected Costs Line */}
              <polyline
                points={chartData.map((d, i) => `${i * 300 + 100},${300 - (d.projected / 3.5 * 280)}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {chartData.map((d, i) => (
                <circle
                  key={`projected-${i}`}
                  cx={i * 300 + 100}
                  cy={300 - (d.projected / 3.5 * 280)}
                  r="6"
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}

              {/* Actual Costs Line */}
              <polyline
                points={chartData.map((d, i) => `${i * 300 + 100},${300 - (d.actual / 3.5 * 280)}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {chartData.map((d, i) => (
                <circle
                  key={`actual-${i}`}
                  cx={i * 300 + 100}
                  cy={300 - (d.actual / 3.5 * 280)}
                  r="6"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
            </svg>
            
            <div className={styles.xAxis}>
              {chartData.map((d, i) => (
                <div key={i} className={styles.xLabel}>{d.label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></div>
            <span>Projected Costs (No Intervention)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#10b981' }}></div>
            <span>Actual Costs (With Intervention)</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {chartData.map((data, idx) => (
          <div key={idx} className={styles.summaryCard} style={{ borderColor: data.color }}>
            <div className={styles.summaryHeader} style={{ backgroundColor: `${data.color}20` }}>
              <span className={styles.summaryLabel}>{data.label} Summary</span>
            </div>
            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span>Savings:</span>
                <strong style={{ color: '#10b981' }}>${data.savings.toFixed(2)}M ({data.percentage.toFixed(1)}%)</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Prevented:</span>
                <strong>{data.prevented} patients</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Avg/Event:</span>
                <strong>${(data.prevented > 0 ? (data.savings * 1_000_000) / data.prevented : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WindowComparison;
