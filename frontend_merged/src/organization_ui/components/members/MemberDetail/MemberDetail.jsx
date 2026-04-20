import styles from './MemberDetail.module.css';

function MemberDetail({ memberId }) {
  return (
    <section className={styles.container}>
      <h3>Medical History</h3>
      <div className={styles.section}>
        <h4>Active Conditions</h4>
        <ul className={styles.list}>
          <li>Congestive Heart Failure (CHF) - Diagnosed 2015</li>
          <li>Type 2 Diabetes Mellitus - Diagnosed 2018</li>
          <li>Hypertension - Diagnosed 2010</li>
        </ul>
      </div>
      <div className={styles.section}>
        <h4>Current Medications</h4>
        <ul className={styles.list}>
          <li>Metoprolol (Mg) - Daily</li>
          <li>Lisinopril (ACE Inhibitor) - Daily</li>
          <li>Metformin (Diabetes) - Twice Daily</li>
        </ul>
      </div>
      <div className={styles.section}>
        <h4>Last Visit</h4>
        <p>Primary Care: January 12, 2026 - Dr. Sarah Smith</p>
        <p>Cardiology: December 28, 2025 - Dr. Michael Brown</p>
      </div>
    </section>
  );
}

export default MemberDetail;
