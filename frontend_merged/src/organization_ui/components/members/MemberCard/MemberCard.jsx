import React from 'react';
import { Phone, Users, Eye } from 'lucide-react';
import Button from '../../common/Button/Button';
import styles from './MemberCard.module.css';

function MemberCard({ member, onViewDetails, onAssign, onContact }) {
  if (!member) return null;

  const riskColor =
    member.riskScore >= 0.8 ? '#dc2626' :
      member.riskScore >= 0.6 ? '#f59e0b' :
        member.riskScore >= 0.4 ? '#3b82f6' :
          member.riskScore >= 0.2 ? '#6ee7b7' :
            '#10b981';

  const riskLabel =
    member.riskScore >= 0.8 ? 'Critical' :
      member.riskScore >= 0.6 ? 'High' :
        member.riskScore >= 0.4 ? 'Medium' :
          member.riskScore >= 0.2 ? 'Medium-Low' :
            'Low';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar} style={{ backgroundColor: riskColor }}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.info}>
            <h4 className={styles.name}>{member.name}</h4>
            <p className={styles.id}>ID: {member.id}</p>
            <p className={styles.department}>{member.department || 'N/A'}</p>
          </div>
          <div className={styles.riskBadge} style={{ backgroundColor: riskColor }}>
            <span className={styles.riskScore}>{(member.riskScore * 100).toFixed(0)}%</span>
            <span className={styles.riskLabel}>{riskLabel}</span>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Age:</span>
            <span className={styles.value}>{member.age || 'N/A'}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Conditions:</span>
            <span className={styles.value}>{member.conditions?.slice(0, 2).join(', ') || 'None'}</span>
          </div>
          {member.careTeam && (
            <div className={styles.detailGroup}>
              <span className={styles.label}>Care Team:</span>
              <span className={styles.value}>{member.careTeam}</span>
            </div>
          )}
          <div className={styles.detailGroup}>
            <span className={styles.label}>Est. Cost:</span>
            <span className={styles.value}>${member.estimatedCost?.toLocaleString() || '0'}</span>
          </div>
        </div>

        <div className={styles.actions}>
          {onViewDetails && (
            <Button
              variant="secondary"
              onClick={onViewDetails}
              className={styles.actionBtn}
            >
              <Eye size={16} /> View
            </Button>
          )}
          {onAssign && (
            <Button
              variant="primary"
              onClick={onAssign}
              className={styles.actionBtn}
            >
              <Users size={16} /> Assign
            </Button>
          )}
          {onContact && (
            <Button
              variant="ghost"
              onClick={onContact}
              className={styles.actionBtn}
            >
              <Phone size={16} /> Contact
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemberCard;
