import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";

import { useMembers } from "../../context/MemberContext";
import { useCarePlan } from "../../context/CarePlanContext";
import { useNavigationHistory } from "../../context/NavigationHistoryContext";
// utils (global)
import { exportUtils } from "../../utils/exportUtils";

// common components
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";

// members components
import MemberCard from "../../components/members/MemberCard/MemberCard";
import CarePlanAssignmentModal from "../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal";

// styles
import styles from "./RiskMembersPage.module.css";


const RiskMembersPage = () => {
  const { members, setSelectedMember } = useMembers();
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const { getPreviousPage } = useNavigationHistory();

  const [sortBy, setSortBy] = useState('risk-desc');
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);
  const riskTier = location.state?.riskTier || 'Low';

  const getRiskScoreRange = (tier) => {
    switch (tier) {
      case 'Critical':
        return [0.8, 1.0];
      case 'High':
        return [0.6, 0.8];
      case 'Medium':
        return [0.4, 0.6];
      case 'Medium-Low':
        return [0.2, 0.4];
      case 'Low':
      default:
        return [0, 0.2];
    }
  };

  const [min, max] = getRiskScoreRange(riskTier);
  const filteredMembers = members.filter(m => m.riskScore >= min && m.riskScore < max);

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'risk-desc') return b.riskScore - a.riskScore;
    if (sortBy === 'risk-asc') return a.riskScore - b.riskScore;
    if (sortBy === 'cost-desc') return b.estimatedCost - a.estimatedCost;
    if (sortBy === 'cost-asc') return a.estimatedCost - b.estimatedCost;
    return 0;
  });

  const getRiskColor = (tier) => {
    switch (tier) {
      case 'Critical':
        return '#dc2626';
      case 'High':
        return '#f59e0b';
      case 'Medium':
        return '#3b82f6';
      case 'Medium-Low':
        return '#6ee7b7';
      case 'Low':
      default:
        return '#10b981';
    }
  };

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
    const filename = `${riskTier.toLowerCase()}-risk-members-${new Date().toISOString().slice(0, 10)}.csv`;
    exportUtils.exportMembersToCSV(sortedMembers, filename);
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
          <ArrowLeft size={20} /> Back
        </button>
        <div className={styles.titleSection}>
          <div
            className={styles.riskIndicator}
            style={{ backgroundColor: getRiskColor(riskTier) }}
          />
          <h2 className={styles.title}>
            {riskTier} Risk Members ({filteredMembers.length})
          </h2>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

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
      </Card>

      <div className={styles.memberList}>
        {sortedMembers.length > 0 ? (
          <>
            {sortedMembers.slice(0, 15).map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={() => handleViewDetails(member)}
                onAssign={() => handleAssignClick(member)}
                onContact={() => handleContact(member)}
              />
            ))}

            {sortedMembers.length > 15 && (
              <div className={styles.loadMore}>
                <Button variant="secondary">
                  Load More... ({sortedMembers.length - 15} remaining)
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className={styles.emptyState}>
            <p className={styles.emptyText}>No members found in the {riskTier} risk category.</p>
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

export default RiskMembersPage;
