import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";

import { useCarePlan } from "../../context/CarePlanContext";
import { getMembersByTier } from "../../services/api/dashboardApi";

// common components
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";

// members components
import MemberCard from "../../components/members/MemberCard/MemberCard";
import CarePlanAssignmentModal from "../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal";

// styles
import styles from "./HighRiskMembersPage.module.css";

const HighRiskMembersPage = () => {
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk-desc');
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);
  const [predictionWindow, setPredictionWindow] = useState(90);
  
  // ✅ NEW STATE FOR REAL DATA
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // ✅ Handle URL parameters for filtering and window
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const windowParam = searchParams.get('window');

    // Set filter from URL
    if (filterParam) {
      const filterMap = {
        'critical': '5',
        'high': '4',
        'medium': '3',
        'medium-low': '2',
        'low': '1'
      };
      setFilter(filterMap[filterParam] || 'all');
    }

    // Set prediction window from URL
    if (windowParam) {
      setPredictionWindow(parseInt(windowParam));
    }
  }, [searchParams]);

  // ✅ Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ FETCH REAL DATA FROM API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Convert prediction window to API format
        const windowParam = `${predictionWindow}_day`;
        
        // Convert filter to tier array
        // High-risk means tier 4 or 5 (risk_tier >= 4)
        let tiers = [];
        if (filter === 'all') tiers = [4, 5];  // ✅ FIXED: Fetch tiers 4+5 for "All High Risk"
        else if (filter === '5') tiers = [5];
        else if (filter === '4') tiers = [4];
        
        const result = await getMembersByTier(windowParam, tiers, 1000, 0);
        
        // Transform API data to match component expectations
        const transformedMembers = result.data.map(m => ({
          id: m.id,
          name: m.name || `Patient ${m.externalId}`,
          externalId: m.externalId,
          riskScore: m.riskScore,
          riskTier: m.riskTier,
          estimatedCost: m.estimatedCost,
          department: m.department,
          age: m.age,
          gender: m.gender,
          lastVisit: m.lastVisit,
          careTeam: m.careTeam || null,
          conditions: m.conditions || [], // ✅ Add conditions from API
        }));
        
        setMembers(transformedMembers);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [predictionWindow, filter]);

  // ✅ No additional filtering needed - we fetch the correct tiers already
  const highRiskMembers = useMemo(() =>
    members,  // All fetched members are already high-risk (tiers 4+5)
    [members]
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
            <option value="all">All High Risk (Tier 4 + 5)</option>
            <option value="5">Critical Risk Only (Tier 5)</option>
            <option value="4">High Risk Only (Tier 4)</option>
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
        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading members...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>Error loading members: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : sortedMembers.length > 0 ? (
          <>
            {sortedMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={() => handleViewDetails(member)}
                onAssign={() => handleAssignClick(member)}
                onContact={() => handleContact(member)}
              />
            ))}
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