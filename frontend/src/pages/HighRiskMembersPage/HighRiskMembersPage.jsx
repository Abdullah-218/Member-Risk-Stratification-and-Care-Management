import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import { useCarePlan } from '../../context/CarePlanContext';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import MemberCard from '../../components/members/MemberCard/MemberCard';
import CarePlanAssignmentModal from '../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal';
import styles from './HighRiskMembersPage.module.css';

const HighRiskMembersPage = () => {
  const { members, setSelectedMember } = useMembers();
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk-desc');
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);

  const highRiskMembers = useMemo(() => 
    members.filter(m => {
      if (filter === 'all') return m.riskScore >= 0.6;
      if (filter === '5') return m.riskScore >= 0.8;
      if (filter === '4') return m.riskScore >= 0.6 && m.riskScore < 0.8;
      return false;
    }), 
    [members, filter]
  );

  const sortedMembers = useMemo(() => 
    [...highRiskMembers].sort((a, b) => {
      if (sortBy === 'risk-desc') return b.riskScore - a.riskScore;
      if (sortBy === 'risk-asc') return a.riskScore - b.riskScore;
      if (sortBy === 'cost-desc') return b.estimatedCost - a.estimatedCost;
      return 0;
    }),
    [highRiskMembers, sortBy]
  );

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    navigate(`/member/${member.id}`);
  };

  const handleAssignClick = (member) => {
    setSelectedMemberForAssignment(member);
  };

  const handleContact = (member) => {
    const message = `Contact information for ${member.name}:\nMember ID: ${member.id}\nDepartment: ${member.department}\n\nPreparing to send notification...`;
    alert(message);
    console.log(`Contact initiated for member ${member.id}:`, member.name);
  };

  const handleAssignCarePlan = (assignment) => {
    assignCarePlan(assignment);
    // Update member with care team info
    const carePlan = getCarePlan(assignment.memberId);
    if (carePlan) {
      console.log(`Care plan assigned to member ${assignment.memberId}`);
    }
  };

  const handleBulkAssign = () => {
    // Open modal to assign care team to first member in list, can iterate through others
    if (sortedMembers.length === 0) {
      alert('No members to assign');
      return;
    }
    // Start assignment with first member
    setSelectedMemberForAssignment(sortedMembers[0]);
  };

  const handleExport = () => {
    // Export high-risk members data as CSV
    const csv = [
      ['Member ID', 'Name', 'Risk Score', 'Department', 'Conditions', 'Est. Cost', 'Care Team Assigned'],
      ...sortedMembers.map(m => [
        m.id,
        m.name,
        (m.riskScore * 100).toFixed(0) + '%',
        m.department || 'N/A',
        m.conditions?.join('; ') || 'None',
        '$' + (m.estimatedCost || 0).toLocaleString(),
        getCarePlan(m.id) ? 'Yes' : 'No'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `high-risk-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          🚨 High-Risk Members ({highRiskMembers.length})
        </h2>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export
          </Button>
          <Button 
            variant="primary"
            onClick={handleBulkAssign}
          >
            Assign Care Team to All
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
            <option value="5">Critical Only</option>
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
        {sortedMembers.length > 0 ? (
          <>
            {sortedMembers.slice(0, 10).map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={() => handleViewDetails(member)}
                onAssign={() => handleAssignClick(member)}
                onContact={() => handleContact(member)}
              />
            ))}

            {sortedMembers.length > 10 && (
              <div className={styles.loadMore}>
                <Button variant="secondary">
                  Load More... ({sortedMembers.length - 10} remaining)
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className={styles.emptyState}>
            <p className={styles.emptyText}>
              No high-risk members found matching the selected filters.
            </p>
          </Card>
        )}
      </div>

      {selectedMemberForAssignment && (
        <CarePlanAssignmentModal
          member={selectedMemberForAssignment}
          onClose={() => setSelectedMemberForAssignment(null)}
          onAssign={handleAssignCarePlan}
        />
      )}
    </div>
  );
};

export default HighRiskMembersPage;