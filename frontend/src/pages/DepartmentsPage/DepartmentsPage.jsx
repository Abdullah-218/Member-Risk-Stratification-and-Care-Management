import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../../context/MemberContext';
import Card from '../../components/common/Card/Card';
import styles from './DepartmentsPage.module.css';

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const { members } = useMembers();

  // Group members by department
  const departmentData = useMemo(() => {
    const depts = {};
    members.forEach(member => {
      const dept = member.department || 'Unassigned';
      if (!depts[dept]) {
        depts[dept] = [];
      }
      depts[dept].push(member);
    });
    
    return Object.keys(depts)
      .sort()
      .map(dept => ({
        name: dept,
        count: depts[dept].length,
        members: depts[dept],
        riskBreakdown: {
          critical: depts[dept].filter(m => m.riskScore >= 0.8).length,
          high: depts[dept].filter(m => m.riskScore >= 0.6 && m.riskScore < 0.8).length,
          medium: depts[dept].filter(m => m.riskScore >= 0.4 && m.riskScore < 0.6).length,
          mediumLow: depts[dept].filter(m => m.riskScore >= 0.2 && m.riskScore < 0.4).length,
          low: depts[dept].filter(m => m.riskScore < 0.2).length
        }
      }));
  }, [members]);

  const handleDepartmentClick = (dept) => {
    navigate('/department-members', { state: { departmentName: dept.name, members: dept.members } });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🏥 Hospital Departments</h2>
        <p className={styles.subtitle}>{departmentData.length} departments with {members.length} total members</p>
      </div>

      {departmentData.length > 0 ? (
        <div className={styles.departmentsGrid}>
          {departmentData.map(dept => (
            <Card 
              key={dept.name}
              className={styles.departmentCard}
              onClick={() => handleDepartmentClick(dept)}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.deptName}>{dept.name}</h3>
                <span className={styles.memberCount}>{dept.count} members</span>
              </div>

              <div className={styles.riskDistribution}>
                {dept.riskBreakdown.critical > 0 && (
                  <div className={styles.riskStat}>
                    <span className={styles.riskIcon}>🔴</span>
                    <span className={styles.riskType}>Critical</span>
                    <span className={styles.riskCount}>{dept.riskBreakdown.critical}</span>
                  </div>
                )}
                {dept.riskBreakdown.high > 0 && (
                  <div className={styles.riskStat}>
                    <span className={styles.riskIcon}>🟠</span>
                    <span className={styles.riskType}>High</span>
                    <span className={styles.riskCount}>{dept.riskBreakdown.high}</span>
                  </div>
                )}
                {dept.riskBreakdown.medium > 0 && (
                  <div className={styles.riskStat}>
                    <span className={styles.riskIcon}>🔵</span>
                    <span className={styles.riskType}>Medium</span>
                    <span className={styles.riskCount}>{dept.riskBreakdown.medium}</span>
                  </div>
                )}
                {dept.riskBreakdown.mediumLow > 0 && (
                  <div className={styles.riskStat}>
                    <span className={styles.riskIcon}>🟢</span>
                    <span className={styles.riskType}>Med-Low</span>
                    <span className={styles.riskCount}>{dept.riskBreakdown.mediumLow}</span>
                  </div>
                )}
                {dept.riskBreakdown.low > 0 && (
                  <div className={styles.riskStat}>
                    <span className={styles.riskIcon}>💚</span>
                    <span className={styles.riskType}>Low</span>
                    <span className={styles.riskCount}>{dept.riskBreakdown.low}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.viewButton}>
                  View Members →
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={styles.emptyState}>
          <p className={styles.emptyText}>No departments found. Please upload member data first.</p>
        </Card>
      )}
    </div>
  );
};

export default DepartmentsPage;
