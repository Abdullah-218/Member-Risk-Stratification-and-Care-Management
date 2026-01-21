import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import MemberCard from '../../components/members/MemberCard/MemberCard';
import styles from './HighRiskMembersPage.module.css';

const HighRiskMembersPage = () => {
  const { members, setSelectedMember } = useMembers();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk-desc');

  const highRiskMembers = members.filter(m => {
    if (filter === 'all') return m.riskScore >= 0.6;
    if (filter === '5') return m.riskScore >= 0.8;
    if (filter === '4') return m.riskScore >= 0.6 && m.riskScore < 0.8;
    return false;
  });

  const sortedMembers = [...highRiskMembers].sort((a, b) => {
    if (sortBy === 'risk-desc') return b.riskScore - a.riskScore;
    if (sortBy === 'risk-asc') return a.riskScore - b.riskScore;
    if (sortBy === 'cost-desc') return b.estimatedCost - a.estimatedCost;
    return 0;
  });

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    navigate(`/member/${member.id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          🚨 High-Risk Members ({highRiskMembers.length})
        </h2>
        <div className={styles.actions}>
          <Button variant="secondary">
            <Download size={16} /> Export
          </Button>
          <Button variant="primary">
            Assign Care Team
          </Button>
        </div>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filters:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Tiers</option>
            <option value="5">Very High Only</option>
            <option value="4">High Only</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort by:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.select}
          >
            <option value="risk-desc">Risk Score (High→Low)</option>
            <option value="risk-asc">Risk Score (Low→High)</option>
            <option value="cost-desc">Cost (High→Low)</option>
          </select>
        </div>
      </Card>

      <div className={styles.memberList}>
        {sortedMembers.slice(0, 10).map(member => (
          <MemberCard
            key={member.id}
            member={member}
            onViewDetails={() => handleViewDetails(member)}
            onAssign={() => console.log('Assign', member.id)}
            onContact={() => console.log('Contact', member.id)}
          />
        ))}

        {sortedMembers.length > 10 && (
          <div className={styles.loadMore}>
            <Button variant="secondary">
              Load More... ({sortedMembers.length - 10} remaining)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighRiskMembersPage;