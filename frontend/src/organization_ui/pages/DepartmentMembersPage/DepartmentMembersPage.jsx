import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";

import { getDepartmentMembers } from "../../services/api/dashboardApi";
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
import styles from "./DepartmentMembersPage.module.css";


const DepartmentMembersPage = () => {
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const { departmentName: urlDepartmentName } = useParams();
  const { getPreviousPage } = useNavigationHistory();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('risk-desc');
  const [activeRiskFilter, setActiveRiskFilter] = useState(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);

  const [predictionWindow, setPredictionWindow] = useState(90);
  const [riskFilter, setRiskFilter] = useState('all');
  
  // ✅ Real API data states
  const [apiMembers, setApiMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Handle window parameter and risk filter from URL
  useEffect(() => {
    const windowParam = searchParams.get('window');
    const riskFilterParam = searchParams.get('riskFilter');
    
    if (windowParam) {
      setPredictionWindow(parseInt(windowParam));
    }
    
    if (riskFilterParam === 'high') {
      setRiskFilter('high'); // Only show critical + high risk (tiers 4+5)
    }
  }, [searchParams]);

  // Get department name from URL params
  const departmentName = urlDepartmentName ? decodeURIComponent(urlDepartmentName) : 'Department';

  // ✅ Fetch real department members from API
  useEffect(() => {
    const fetchDepartmentMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching department members:', {
          departmentName,
          predictionWindow,
          riskFilter
        });
        
        // If riskFilter is 'high', fetch only tiers 4 and 5 (critical + high)
        const tiers = riskFilter === 'high' ? [4, 5] : [];
        
        console.log('Fetching with tiers:', tiers);
        
        const response = await getDepartmentMembers(departmentName, predictionWindow, tiers);
        
        console.log('API Response:', response);
        console.log('Members count:', response.data?.length);
        
        setApiMembers(response.data || []);
      } catch (err) {
        console.error('Error fetching department members:', err);
        setError('Failed to load department members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (departmentName) {
      fetchDepartmentMembers();
    }
  }, [departmentName, predictionWindow, riskFilter]);

  // ✅ Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Use API data as department members
  const departmentMembers = apiMembers;

  // Organize members by risk tier (using database riskTier field)
  const riskTiers = useMemo(() => {
    const tiers = {
      critical: [],
      high: [],
      medium: [],
      mediumLow: [],
      low: []
    };

    departmentMembers.forEach(member => {
      // Use database tier field (1-5)
      if (member.riskTier === 5) tiers.critical.push(member);
      else if (member.riskTier === 4) tiers.high.push(member);
      else if (member.riskTier === 3) tiers.medium.push(member);
      else if (member.riskTier === 2) tiers.mediumLow.push(member);
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
    // Navigate to member details page
    navigate(`/org/member/${member.id}`, { state: { member } });
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

  // Loading and error states
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading department members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

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
          <h2 className={styles.title}>
            🏥 {departmentName}
            {riskFilter === 'high' && (
              <span className={styles.filterBadge}>High-Risk Only</span>
            )}
          </h2>
          <span className={styles.memberCount}>
            {departmentMembers.length} members
            {riskFilter === 'high' && (
              <span className={styles.filterNote}> (Critical + High Risk)</span>
            )}
          </span>
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
