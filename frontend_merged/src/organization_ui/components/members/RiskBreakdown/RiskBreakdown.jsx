import styles from './RiskBreakdown.module.css';

function RiskBreakdown({ memberId }) {
  const riskFactors = [
    { factor: 'Age', score: 35, percentage: 35 },
    { factor: 'Chronic Conditions', score: 40, percentage: 40 },
    { factor: 'Medication Compliance', score: 15, percentage: 15 },
    { factor: 'Healthcare Utilization', score: 10, percentage: 10 },
  ];

  const totalScore = riskFactors.reduce((sum, f) => sum + f.score, 0);

  return (
    <section className={styles.container}>
      <h3>Risk Breakdown</h3>
      <div className={styles.overallRisk}>
        <div className={styles.riskScore}>78%</div>
        <p>Overall Risk Score</p>
      </div>
      <div className={styles.factors}>
        {riskFactors.map((factor) => (
          <div key={factor.factor} className={styles.factor}>
            <div className={styles.label}>{factor.factor}</div>
            <div className={styles.bar}>
              <div className={styles.fill} style={{ width: `${factor.percentage}%` }} />
            </div>
            <div className={styles.percentage}>{factor.percentage}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RiskBreakdown;
