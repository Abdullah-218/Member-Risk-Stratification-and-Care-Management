import styles from './CarePlan.module.css';

function CarePlan({ memberId }) {
  const goals = [
    { id: 1, title: 'Reduce HbA1c to <7%', status: 'In Progress', dueDate: 'March 15, 2026' },
    { id: 2, title: 'Weight Loss Program', status: 'Active', dueDate: 'June 30, 2026' },
    { id: 3, title: 'Blood Pressure Control', status: 'Achieved', dueDate: 'Completed' },
  ];

  return (
    <section className={styles.container}>
      <h3>Care Plan</h3>
      <div className={styles.goals}>
        {goals.map((goal) => (
          <div key={goal.id} className={`${styles.goal} ${styles[goal.status.replace(' ', '-').toLowerCase()]}`}>
            <div className={styles.titleRow}>
              <h4>{goal.title}</h4>
              <span className={styles.status}>{goal.status}</span>
            </div>
            <p className={styles.dueDate}>Due: {goal.dueDate}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CarePlan;
