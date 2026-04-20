import styles from './ClinicalSummary.module.css';

function ClinicalSummary({ memberId }) {
  return (
    <section className={styles.container}>
      <h3>Clinical Summary</h3>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.label}>Blood Pressure</span>
          <span className={styles.value}>138/85 mmHg</span>
          <span className={styles.note}>Last: Jan 12, 2026</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>HbA1c</span>
          <span className={styles.value}>7.2%</span>
          <span className={styles.note}>Target: {'<'}7%</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Ejection Fraction</span>
          <span className={styles.value}>45%</span>
          <span className={styles.note}>Last: Dec 28, 2025</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>BMI</span>
          <span className={styles.value}>29.2</span>
          <span className={styles.note}>Overweight</span>
        </div>
      </div>
    </section>
  );
}

export default ClinicalSummary;
