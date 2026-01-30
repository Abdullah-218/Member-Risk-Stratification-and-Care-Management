import React, { useState, useEffect, useMemo } from "react";
import { Users, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDashboardMembers } from "../../services/api/dashboardApi";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import MemberCard from "../../components/members/MemberCard/MemberCard";
import styles from "./AllMembersPage.module.css";

const AllMembersPage = () => {
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;
  
  // Filters
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("all");
  const [selectedCostFilter, setSelectedCostFilter] = useState("all");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  
  // List of all possible conditions for filter
  const allConditions = [
    'Diabetes', 'Heart Failure', 'Kidney Disease', 'COPD', 'Cancer',
    'Ischemic Heart Disease', 'Stroke', 'Alzheimers', 'Depression', 'ESRD', 'Arthritis'
  ];

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all members from 90-day window (use limit=5000 to get all)
        const data = await getDashboardMembers('90_day', 5000);
        
        // Transform data - getDashboardMembers returns the data array directly
        const transformed = data.map(m => ({
          id: m.id,
          name: `Patient ${m.externalId}`,
          externalId: m.externalId,
          age: m.age,
          gender: m.gender,
          riskScore: m.riskScore,
          riskTier: m.riskTier,
          estimatedCost: m.estimatedCost,
          department: m.department,
          conditions: m.conditions || [],
          lastVisit: m.lastVisit,
        }));
        
        setAllMembers(transformed);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllMembers();
  }, []);

  /* ---------------- FILTERING LOGIC ---------------- */
  const filteredMembers = useMemo(() => {
    return allMembers.filter((member) => {
      // Search filter by ID
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const memberId = String(member.id).toLowerCase();
        if (!memberId.includes(query)) return false;
      }

      // Risk filter
      if (selectedRiskFilter !== "all") {
        if (selectedRiskFilter === "5" && member.riskTier !== 5) return false;
        if (selectedRiskFilter === "4" && member.riskTier !== 4) return false;
        if (selectedRiskFilter === "3" && member.riskTier !== 3) return false;
        if (selectedRiskFilter === "2" && member.riskTier !== 2) return false;
        if (selectedRiskFilter === "1" && member.riskTier !== 1) return false;
      }

      // Cost filter
      if (selectedCostFilter !== "all") {
        const cost = member.estimatedCost || 0;
        if (selectedCostFilter === "high" && cost < 50000) return false;
        if (selectedCostFilter === "medium" && (cost < 20000 || cost >= 50000)) return false;
        if (selectedCostFilter === "low" && cost >= 20000) return false;
      }

      // Conditions filter
      if (selectedConditions.length > 0) {
        const hasAnyCondition = selectedConditions.some(condition =>
          member.conditions?.includes(condition)
        );
        if (!hasAnyCondition) return false;
      }

      return true;
    });
  }, [allMembers, selectedRiskFilter, selectedCostFilter, selectedConditions, searchQuery]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRiskFilter, selectedCostFilter, selectedConditions, searchQuery]);

  /* ---------------- HANDLERS ---------------- */
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageJump = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCondition = (condition) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const clearFilters = () => {
    setSelectedRiskFilter("all");
    setSelectedCostFilter("all");
    setSelectedConditions([]);
    setSearchQuery("");
  };

  const activeFilterCount = 
    (selectedRiskFilter !== "all" ? 1 : 0) +
    (selectedCostFilter !== "all" ? 1 : 0) +
    selectedConditions.length +
    (searchQuery.trim() !== "" ? 1 : 0);

  /* ---------------- UI ---------------- */
  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Users className={styles.icon} size={32} />
          <div>
            <h1>All Members</h1>
            <p className={styles.subtitle}>
              Showing {filteredMembers.length} of {allMembers.length} total members
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#6b7280' 
              }} 
            />
            <input
              type="text"
              placeholder="Search by Patient ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 40px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                width: '250px',
                outline: 'none'
              }}
            />
          </div>
          <Button
            variant={showFilters ? "primary" : "secondary"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      {/* FILTERS PANEL */}
      {showFilters && (
        <Card className={styles.filtersCard}>
          <div className={styles.filtersHeader}>
            <h3>Filter Members</h3>
            {activeFilterCount > 0 && (
              <button className={styles.clearFilters} onClick={clearFilters}>
                Clear All
              </button>
            )}
          </div>

          <div className={styles.filtersGrid}>
            {/* Risk Level Filter */}
            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Risk Level</label>
              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Risk Levels</option>
                <option value="5">Tier 5 - Critical</option>
                <option value="4">Tier 4 - High</option>
                <option value="3">Tier 3 - Moderate</option>
                <option value="2">Tier 2 - Low-Moderate</option>
                <option value="1">Tier 1 - Low</option>
              </select>
            </div>

            {/* Cost Filter */}
            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Estimated Cost</label>
              <select
                value={selectedCostFilter}
                onChange={(e) => setSelectedCostFilter(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Cost Levels</option>
                <option value="high">High Cost (&gt;$50K)</option>
                <option value="medium">Medium Cost ($20K-$50K)</option>
                <option value="low">Low Cost (&lt;$20K)</option>
              </select>
            </div>

            {/* Conditions Filter */}
            <div className={styles.filterSection} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.filterLabel}>
                Chronic Conditions {selectedConditions.length > 0 && `(${selectedConditions.length} selected)`}
              </label>
              <div className={styles.conditionsGrid}>
                {allConditions.map(condition => (
                  <label key={condition} className={styles.conditionCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(condition)}
                      onChange={() => toggleCondition(condition)}
                    />
                    <span>{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* LOADING / ERROR / DATA */}
      {loading ? (
        <Card className={styles.loadingCard}>
          <p>Loading members...</p>
        </Card>
      ) : error ? (
        <Card className={styles.errorCard}>
          <p>Error loading members: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      ) : (
        <>
          {/* PAGINATION INFO */}
          <div className={styles.paginationInfo}>
            <span>
              Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} members
            </span>
          </div>

          {/* MEMBERS LIST */}
          <div className={styles.membersList}>
            {currentMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={() => navigate(`/org/member/${member.id}`)}
              />
            ))}
            
            {currentMembers.length === 0 && (
              <Card className={styles.emptyState}>
                <p>No members found matching the selected filters.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </Button>

              <div className={styles.pageNumbers}>
                {/* Show first page */}
                {currentPage > 3 && (
                  <>
                    <button
                      className={styles.pageNumber}
                      onClick={() => handlePageJump(1)}
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className={styles.ellipsis}>...</span>}
                  </>
                )}

                {/* Show pages around current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === currentPage ||
                    page === currentPage - 1 ||
                    page === currentPage + 1 ||
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  )
                  .filter(page => page > 0 && page <= totalPages)
                  .map(page => (
                    <button
                      key={page}
                      className={`${styles.pageNumber} ${page === currentPage ? styles.active : ''}`}
                      onClick={() => handlePageJump(page)}
                    >
                      {page}
                    </button>
                  ))}

                {/* Show last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className={styles.ellipsis}>...</span>}
                    <button
                      className={styles.pageNumber}
                      onClick={() => handlePageJump(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <Button
                variant="secondary"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllMembersPage;
