import styles from './IndividualResults.module.css';

function IndividualResults() {
  const results = [
    { title: 'Current Risk Level', value: 'High', icon: '⚠️' },
    { title: 'Recommended Actions', value: '5 items', icon: '📋' },
    { title: 'Program Eligibility', value: 'Yes', icon: '✓' },
    { title: 'Next Review Date', value: 'Feb 15, 2026', icon: '📅' },
  ];

  return (
    <section className={styles.container}>
      <h3>Assessment Results</h3>
      <div className={styles.results}>
        {results.map((result, idx) => (
          <div key={idx} className={styles.result}>
            <span className={styles.icon}>{result.icon}</span>
            <div className={styles.info}>
              <p className={styles.title}>{result.title}</p>
              <p className={styles.value}>{result.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default IndividualResults;
