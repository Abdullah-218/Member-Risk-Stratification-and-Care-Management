import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import RiskBreakdown from '../../components/members/RiskBreakdown/RiskBreakdown';
import ClinicalSummary from '../../components/members/ClinicalSummary/ClinicalSummary';
import CarePlan from '../../components/members/CarePlan/CarePlan';
import styles from './MemberDetailPage.module.css';

const MemberDetailPage = () => {
  const { selectedMember } = useMembers();
  const navigate = useNavigate();

  if (!selectedMember) {
    return (
      <div className={styles.container}>
        <Card>
          <p>No member selected. Please go back and select a member.</p>
          <Button onClick={() => navigate('/high-risk-members')}>
            Back to High-Risk Members
          </Button>
        </Card>
      </div>
    );
  }

  const getRiskBadge = () => {
    const score = selectedMember.riskScore;
    if (score >= 0.8) return { icon: '⚫', label: 'VERY HIGH', color: '#1a1a1a' };
    if (score >= 0.6) return { icon: '🔴', label: 'HIGH', color: '#dc2626' };
    if (score >= 0.4) return { icon: '🟠', label: 'MEDIUM', color: '#f59e0b' };
    if (score >= 0.2) return { icon: '🟡', label: 'LOW', color: '#fbbf24' };
    return { icon: '🟢', label: 'VERY LOW', color: '#10b981' };
  };

  const badge = getRiskBadge();

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Button variant="ghost" onClick={() => navigate('/high-risk-members')}>
          <ChevronLeft size={16} /> Back
        </Button>
      </div>

      <Card>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Member Profile: {selectedMember.id}</h2>
            <div className={styles.headerMeta}>
              <span>Last Updated: Today</span>
              <span>Next Review: In 7 days</span>
            </div>
          </div>
          <div 
            className={styles.badge}
            style={{ backgroundColor: badge.color }}
          >
            {badge.icon} {badge.label} ({Math.round(selectedMember.riskScore * 100)}%)
          </div>
        </div>

        <div className={styles.demographics}>
          <h3 className={styles.sectionTitle}>👤 Demographics</h3>
          <div className={styles.demoGrid}>
            <div>
              <div className={styles.label}>Age:</div>
              <div className={styles.value}>{selectedMember.age}</div>
            </div>
            <div>
              <div className={styles.label}>Gender:</div>
              <div className={styles.value}>
                {selectedMember.gender === 'F' ? 'Female' : 'Male'}
              </div>
            </div>
            <div>
              <div className={styles.label}>Member Since:</div>
              <div className={styles.value}>2018</div>
            </div>
          </div>
        </div>

        <RiskBreakdown member={selectedMember} />
        <ClinicalSummary member={selectedMember} />
        <CarePlan member={selectedMember} />

        <div className={styles.actions}>
          <Button variant="primary">
            Assign Care Team
          </Button>
          <Button variant="secondary">
            <FileText size={16} /> Generate Care Plan PDF
          </Button>
          <Button variant="secondary">
            Close Case
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MemberDetailPage;