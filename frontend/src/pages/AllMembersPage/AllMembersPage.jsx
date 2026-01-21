import React, { useState } from 'react';
import { Users, Search, Filter, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import styles from './AllMembersPage.module.css';

const AllMembersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');

  // Mock member data
  const allMembers = [
    { id: '1', name: 'John Smith', age: 65, riskScore: 0.78, conditions: ['Diabetes', 'Hypertension'], lastVisit: '2026-01-15' },
    { id: '2', name: 'Jane Doe', age: 72, riskScore: 0.65, conditions: ['Heart Disease'], lastVisit: '2026-01-10' },
    { id: '3', name: 'Michael Johnson', age: 58, riskScore: 0.45, conditions: ['High Cholesterol'], lastVisit: '2026-01-18' },
    { id: '4', name: 'Sarah Williams', age: 55, riskScore: 0.32, conditions: ['Hypertension'], lastVisit: '2026-01-19' },
    { id: '5', name: 'David Brown', age: 68, riskScore: 0.85, conditions: ['COPD', 'Diabetes', 'CKD'], lastVisit: '2026-01-12' },
    { id: '6', name: 'Emma Davis', age: 61, riskScore: 0.52, conditions: ['High Cholesterol', 'Hypertension'], lastVisit: '2026-01-17' },
    { id: '7', name: 'Robert Wilson', age: 74, riskScore: 0.71, conditions: ['Heart Disease', 'Diabetes'], lastVisit: '2026-01-14' },
    { id: '8', name: 'Lisa Anderson', age: 59, riskScore: 0.38, conditions: ['Hypertension'], lastVisit: '2026-01-20' },
    { id: '9', name: 'James Taylor', age: 70, riskScore: 0.92, conditions: ['COPD', 'CKD', 'Cancer'], lastVisit: '2026-01-08' },
    { id: '10', name: 'Patricia Martinez', age: 53, riskScore: 0.28, conditions: ['High Cholesterol'], lastVisit: '2026-01-21' },
    { id: '11', name: 'Charles Garcia', age: 66, riskScore: 0.58, conditions: ['Diabetes', 'Heart Disease'], lastVisit: '2026-01-16' },
    { id: '12', name: 'Mary Rodriguez', age: 60, riskScore: 0.42, conditions: ['Hypertension', 'High Cholesterol'], lastVisit: '2026-01-19' }
  ];

  const getRiskLevel = (score) => {
    if (score >= 0.7) return 'Very High';
    if (score >= 0.5) return 'High';
    if (score >= 0.3) return 'Medium';
    return 'Low';
  };

  const getRiskColor = (score) => {
    if (score >= 0.7) return '#dc2626';
    if (score >= 0.5) return '#f59e0b';
    if (score >= 0.3) return '#3b82f6';
    return '#10b981';
  };

  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.id.includes(searchTerm);
    
    let matchesRisk = true;
    if (selectedRiskFilter !== 'all') {
      const riskLevel = getRiskLevel(member.riskScore);
      matchesRisk = riskLevel.toLowerCase() === selectedRiskFilter.toLowerCase();
    }

    return matchesSearch && matchesRisk;
  });

  const handleMemberClick = (memberId) => {
    navigate(`/member/${memberId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Users className={styles.icon} />
          <h1>All Members</h1>
        </div>
        <p className={styles.subtitle}>Complete member directory and health profiles</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <Input
            placeholder="Search by name or member ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBox}>
          <Filter size={20} />
          <select 
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="very high">Very High Risk</option>
          </select>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Members</span>
          <span className={styles.statValue}>{filteredMembers.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>High Risk</span>
          <span className={styles.statValue}>{filteredMembers.filter(m => m.riskScore >= 0.5).length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Average Risk Score</span>
          <span className={styles.statValue}>
            {(filteredMembers.reduce((sum, m) => sum + m.riskScore, 0) / filteredMembers.length).toFixed(2)}
          </span>
        </div>
      </div>

      <div className={styles.membersContainer}>
        {filteredMembers.length > 0 ? (
          <div className={styles.membersList}>
            {filteredMembers.map(member => (
              <Card key={member.id} className={styles.memberCard}>
                <div className={styles.memberHeader}>
                  <div>
                    <h3 className={styles.memberName}>{member.name}</h3>
                    <p className={styles.memberId}>ID: {member.id}</p>
                  </div>
                  <button 
                    className={styles.viewButton}
                    onClick={() => handleMemberClick(member.id)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className={styles.memberInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Age</span>
                    <span className={styles.value}>{member.age}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Last Visit</span>
                    <span className={styles.value}>{new Date(member.lastVisit).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={styles.riskSection}>
                  <div className={styles.riskScore}>
                    <span className={styles.label}>Risk Score</span>
                    <div className={styles.scoreBar}>
                      <div 
                        className={styles.scoreIndicator}
                        style={{ 
                          width: `${member.riskScore * 100}%`,
                          backgroundColor: getRiskColor(member.riskScore)
                        }}
                      />
                    </div>
                    <div className={styles.scoreText}>
                      <span className={styles.scoreValue}>{(member.riskScore * 100).toFixed(0)}%</span>
                      <span 
                        className={styles.riskLevel}
                        style={{ color: getRiskColor(member.riskScore) }}
                      >
                        {getRiskLevel(member.riskScore)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.conditionsSection}>
                  <span className={styles.label}>Conditions</span>
                  <div className={styles.conditionsList}>
                    {member.conditions.map((condition, idx) => (
                      <span key={idx} className={styles.conditionTag}>
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Users size={48} />
            <p>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMembersPage;
