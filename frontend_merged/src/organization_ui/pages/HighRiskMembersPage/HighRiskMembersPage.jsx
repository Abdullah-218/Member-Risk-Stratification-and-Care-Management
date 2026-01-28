import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";

import { useMembers } from "../../context/MemberContext";
import { useCarePlan } from "../../context/CarePlanContext";

// common components
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";

// members components
import MemberCard from "../../components/members/MemberCard/MemberCard";
import CarePlanAssignmentModal from "../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal";

// styles
import styles from "./HighRiskMembersPage.module.css";

const HighRiskMembersPage = () => {
  const { members, setSelectedMember } = useMembers();
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk-desc');
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);
  const [displayCount, setDisplayCount] = useState(10);

  // ✅ ADD PREDICTION WINDOW STATE
  const [predictionWindow, setPredictionWindow] = useState(90);

  // ✅ Handle URL parameters for filtering
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      // Map filter parameter to filter state
      const filterMap = {
        'critical': '5',
        'high': '4',
        'medium': '3',
        'medium-low': '2',
        'low': '1'
      };
      setFilter(filterMap[filterParam] || 'all');
    }
  }, [searchParams]);

  // ✅ ADJUST MEMBERS BASED ON WINDOW (SAME LOGIC AS DASHBOARD/DEPARTMENTS)
  const adjustedMembers = useMemo(() => {
    let multiplier = 1;

    if (predictionWindow === 30) multiplier = 0.85;
    if (predictionWindow === 60) multiplier = 1;
    if (predictionWindow === 90) multiplier = 1.15;

    return members.map(m => ({
      ...m,
      riskScore: Math.min(m.riskScore * multiplier, 1),
    }));
  }, [members, predictionWindow]);

  const highRiskMembers = useMemo(() =>
    adjustedMembers.filter(m => {
      if (filter === 'all') return m.riskScore >= 0.6;
      if (filter === '5') return m.riskScore >= 0.8;
      if (filter === '4') return m.riskScore >= 0.6 && m.riskScore < 0.8;
      if (filter === '3') return m.riskScore >= 0.4 && m.riskScore < 0.6;
      if (filter === '2') return m.riskScore >= 0.2 && m.riskScore < 0.4;
      if (filter === '1') return m.riskScore < 0.2;
      return false;
    }),
    [adjustedMembers, filter]
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
    navigate(`/org/member/${member.id}`);
  };

  const handleAssignClick = (member) => {
    setSelectedMemberForAssignment(member);
  };

  const handleContact = (member) => {
    const message = `Contact information for ${member.name}:\nMember ID: ${member.id}\nDepartment: ${member.department}\n\nPreparing to send notification...`;
    alert(message);
    console.log(`Contact initiated for member ${member.id}:`, member.name);
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, sortedMembers.length));
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

      {/* 🔵 PREDICTION WINDOW SELECTOR */}
      <div className={styles.predictionBanner}>
        <h3>Select Prediction Window</h3>
        <div className={styles.windowButtons}>
          {[30, 60, 90].map(day => (
            <button
              key={day}
              className={`${styles.windowBtn} ${predictionWindow === day ? styles.active : ""
                }`}
              onClick={() => setPredictionWindow(day)}
            >
              {day}-Day Window
            </button>
          ))}
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
            <option value="all">All High Risk (≥60%)</option>
            <option value="5">Critical Only (≥80%)</option>
            <option value="4">High Only (60-80%)</option>
            <option value="3">Medium Only (40-60%)</option>
            <option value="2">Medium-Low Only (20-40%)</option>
            <option value="1">Low Only (&lt;20%)</option>
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
            {sortedMembers.slice(0, displayCount).map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={() => handleViewDetails(member)}
                onAssign={() => handleAssignClick(member)}
                onContact={() => handleContact(member)}
              />
            ))}

            {sortedMembers.length > displayCount && (
              <div className={styles.loadMore}>
                <Button variant="secondary" onClick={handleLoadMore}>
                  Load More... ({sortedMembers.length - displayCount} remaining)
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