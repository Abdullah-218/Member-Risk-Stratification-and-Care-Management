import { Link } from 'react-router-dom';
import useMembers from '../../../hooks/useMembers';
import styles from './HighRiskMemberList.module.css';

function HighRiskMemberList() {
  const { members } = useMembers();

  return (
    <section className={styles.container}>
      <h3>High-Risk Members</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Name</th>
            <th>Risk Score</th>
            <th>Conditions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{member.name}</td>
              <td>
                <span className={styles.riskScore}>
                  {(member.riskScore * 100).toFixed(0)}%
                </span>
              </td>
              <td>{member.conditions.join(', ')}</td>
              <td>
                <Link to={`/members/${member.id}`} className={styles.link}>
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default HighRiskMemberList;
