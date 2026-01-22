import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import { useCarePlan } from '../../context/CarePlanContext';
import { useNavigationHistory } from '../../context/NavigationHistoryContext';
import { exportUtils } from '../../utils/exportUtils';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import MemberCard from '../../components/members/MemberCard/MemberCard';
import CarePlanAssignmentModal from '../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal';
import styles from './DepartmentMembersPage.module.css';

const DepartmentMembersPage = () => {
  const { members: allMembers, setSelectedMember } = useMembers();
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const { getPreviousPage } = useNavigationHistory();
  const [sortBy, setSortBy] = useState('risk-desc');
  const [activeRiskFilter, setActiveRiskFilter] = useState(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);

  const departmentName = location.state?.departmentName || 'Department';
  const departmentMembers = location.state?.members || 
    allMembers.filter(m => m.department === departmentName);

  // Organize members by risk tier
  const riskTiers = useMemo(() => {
    const tiers = {
      critical: [],
      high: [],
      medium: [],
      mediumLow: [],
      low: []
    };

    departmentMembers.forEach(member => {
      if (member.riskScore >= 0.8) tiers.critical.push(member);
      else if (member.riskScore >= 0.6) tiers.high.push(member);
      else if (member.riskScore >= 0.4) tiers.medium.push(member);
      else if (member.riskScore >= 0.2) tiers.mediumLow.push(member);
      else tiers.low.push(member);
    });

    // Sort each tier
    Object.keys(tiers).forEach(tier => {
      tiers[tier].sort((a, b) => {
        if (sortBy === 'risk-desc') return b.riskScore - a.riskScore;
        if (sortBy === 'risk-asc') return a.riskScore - b.riskScore;
        if (sortBy === 'cost-desc') return b.estimatedCost - a.estimatedCost;
        if (sortBy === 'cost-asc') return a.estimatedCost - b.estimatedCost;
        return 0;
      });
    });

    return tiers;
  }, [departmentMembers, sortBy]);

  const riskCategories = [
    { key: 'critical', label: 'Critical', icon: '🔴', color: '#dc2626', count: riskTiers.critical.length },
    { key: 'high', label: 'High', icon: '🟠', color: '#f59e0b', count: riskTiers.high.length },
    { key: 'medium', label: 'Medium', icon: '🔵', color: '#3b82f6', count: riskTiers.medium.length },
    { key: 'mediumLow', label: 'Medium-Low', icon: '🟢', color: '#6ee7b7', count: riskTiers.mediumLow.length },
    { key: 'low', label: 'Low', icon: '💚', color: '#10b981', count: riskTiers.low.length }
  ];

  const getDisplayMembers = () => {
    if (activeRiskFilter) {
      return riskTiers[activeRiskFilter];
    }
    return departmentMembers.sort((a, b) => {
      if (sortBy === 'risk-desc') return b.riskScore - a.riskScore;
      if (sortBy === 'risk-asc') return a.riskScore - b.riskScore;
      if (sortBy === 'cost-desc') return b.estimatedCost - a.estimatedCost;
      if (sortBy === 'cost-asc') return a.estimatedCost - b.estimatedCost;
      return 0;
    });
  };

  const displayMembers = getDisplayMembers();

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
    const carePlan = getCarePlan(assignment.memberId);
    if (carePlan) {
      console.log(`Care plan assigned to member ${assignment.memberId}`);
    }
  };

  const handleExport = () => {
    const filename = `${departmentName}-members-${new Date().toISOString().slice(0, 10)}.csv`;
    exportUtils.exportMembersToCSV(departmentMembers, filename);
  };

  const handleBackClick = () => {
    const previousPage = getPreviousPage();
    navigate(previousPage);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={handleBackClick}
          title="Go back to previous page"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>🏥 {departmentName}</h2>
          <span className={styles.memberCount}>{departmentMembers.length} members</span>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      {/* Risk Distribution Cards */}
      <div className={styles.riskDistribution}>
        {riskCategories.map(category => (
          <button
            key={category.key}
            className={`${styles.riskCard} ${activeRiskFilter === category.key ? styles.active : ''}`}
            onClick={() => setActiveRiskFilter(activeRiskFilter === category.key ? null : category.key)}
            style={{
              borderLeftColor: activeRiskFilter === category.key ? category.color : '#d1d5db'
            }}
          >
            <div className={styles.riskCardIcon}>{category.icon}</div>
            <div className={styles.riskCardContent}>
              <div className={styles.riskCardLabel}>{category.label}</div>
              <div className={styles.riskCardCount}>{category.count}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort by:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.select}
          >
            <option value="risk-desc">Risk Score (High→Low)</option>
            <option value="risk-asc">Risk Score (Low→High)</option>
            <option value="cost-desc">Estimated Cost (High→Low)</option>
            <option value="cost-asc">Estimated Cost (Low→High)</option>
          </select>
        </div>

        {activeRiskFilter && (
          <div className={styles.activeFilter}>
            Filtered by: <strong>{riskCategories.find(c => c.key === activeRiskFilter)?.label}</strong>
            <button 
              className={styles.clearFilter}
              onClick={() => setActiveRiskFilter(null)}
            >
              Clear
            </button>
          </div>
        )}
      </Card>

      {/* Members List */}
      <div className={styles.memberList}>
        {displayMembers.length > 0 ? (
          <>
            {displayMembers.slice(0, 20).map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={() => handleViewDetails(member)}
                onAssign={() => handleAssignClick(member)}
                onContact={() => handleContact(member)}
              />
            ))}

            {displayMembers.length > 20 && (
              <div className={styles.loadMore}>
                <Button variant="secondary">
                  Load More... ({displayMembers.length - 20} remaining)
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className={styles.emptyState}>
            <p className={styles.emptyText}>
              {activeRiskFilter 
                ? `No ${riskCategories.find(c => c.key === activeRiskFilter)?.label} risk members in this department.`
                : `No members found in ${departmentName} department.`
              }
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

export default DepartmentMembersPage;
