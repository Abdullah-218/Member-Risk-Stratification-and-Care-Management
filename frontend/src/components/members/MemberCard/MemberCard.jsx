import styles from './MemberCard.module.css';

function MemberCard({ memberId }) {
  const memberData = {
    id: memberId,
    name: 'Alex Johnson',
    age: 62,
    gender: 'Male',
    memberSince: '2019-03-15',
    status: 'Active',
    plan: 'Medicare Advantage',
  };

  return (
    <section className={styles.container}>
      <h3>Member Information</h3>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar}>{memberData.name.charAt(0)}</div>
          <div className={styles.info}>
            <h4>{memberData.name}</h4>
            <p>{memberData.plan}</p>
          </div>
        </div>
        <div className={styles.details}>
          <div className={styles.detail}>
            <span>ID:</span> {memberData.id}
          </div>
          <div className={styles.detail}>
            <span>Age:</span> {memberData.age}
          </div>
          <div className={styles.detail}>
            <span>Gender:</span> {memberData.gender}
          </div>
          <div className={styles.detail}>
            <span>Status:</span> <span className={styles.status}>{memberData.status}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MemberCard;
