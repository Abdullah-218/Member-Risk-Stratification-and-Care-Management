import { useState, useEffect } from 'react';
import styles from './ProcessingScreen.module.css';

function ProcessingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + Math.random() * 30 : 100));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { name: 'Validating Data', status: progress > 20 ? 'done' : 'active' },
    { name: 'Processing Records', status: progress > 50 ? 'done' : progress > 20 ? 'active' : 'pending' },
    { name: 'Calculating Risk', status: progress > 80 ? 'done' : progress > 50 ? 'active' : 'pending' },
    { name: 'Generating Report', status: progress === 100 ? 'done' : progress > 80 ? 'active' : 'pending' },
  ];

  return (
    <section className={styles.container}>
      <h3>Processing</h3>
      <div className={styles.progress}>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.percentage}>{Math.floor(progress)}%</p>
      </div>
      <div className={styles.steps}>
        {steps.map((step, idx) => (
          <div key={idx} className={`${styles.step} ${styles[step.status]}`}>
            <span className={styles.indicator} />
            <span className={styles.text}>{step.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProcessingScreen;
