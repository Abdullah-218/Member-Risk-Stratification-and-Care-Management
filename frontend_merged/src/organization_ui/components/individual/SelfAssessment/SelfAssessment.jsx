import { useState } from 'react';
import styles from './SelfAssessment.module.css';

function SelfAssessment() {
  const [responses, setResponses] = useState({
    exercise: 3,
    diet: 2,
    stress: 3,
    sleep: 2,
  });

  const questions = [
    { key: 'exercise', label: 'How often do you exercise? (1=Never, 5=Daily)' },
    { key: 'diet', label: 'How healthy is your diet? (1=Poor, 5=Excellent)' },
    { key: 'stress', label: 'How would you rate your stress level? (1=Low, 5=High)' },
    { key: 'sleep', label: 'How many hours of sleep? (1=<5hrs, 5=>8hrs)' },
  ];

  return (
    <section className={styles.container}>
      <h3>Self Assessment</h3>
      <div className={styles.assessment}>
        {questions.map((q) => (
          <div key={q.key} className={styles.question}>
            <label>{q.label}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={responses[q.key]}
              onChange={(e) => setResponses(prev => ({ ...prev, [q.key]: e.target.value }))}
              className={styles.slider}
            />
            <span className={styles.value}>{responses[q.key]}/5</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SelfAssessment;
