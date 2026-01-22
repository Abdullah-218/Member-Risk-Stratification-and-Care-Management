import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import { useCarePlan } from '../../context/CarePlanContext';
import { useNavigationHistory } from '../../context/NavigationHistoryContext';
import { exportUtils } from '../../utils/exportUtils';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import RiskBreakdown from '../../components/members/RiskBreakdown/RiskBreakdown';
import ClinicalSummary from '../../components/members/ClinicalSummary/ClinicalSummary';
import CarePlan from '../../components/members/CarePlan/CarePlan';
import CarePlanAssignmentModal from '../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal';
import styles from './MemberDetailPage.module.css';

const MemberDetailPage = () => {
  const { selectedMember } = useMembers();
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const { getPreviousPage } = useNavigationHistory();
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);

  if (!selectedMember) {
    return (
      <div className={styles.container}>
        <Card>
          <p>No member selected. Please go back and select a member.</p>
          <Button onClick={() => navigate(getPreviousPage())}>
            Back
          </Button>
        </Card>
      </div>
    );
  }

  const getRiskBadge = () => {
    const score = selectedMember.riskScore;
    if (score >= 0.8) return { icon: '⚫', label: 'VERY HIGH', color: '#1a1a1a' };
    if (score >= 0.6) return { icon: '🔴', label: 'HIGH', color: '#dc2626' };
    if (score >= 0.4) return { icon: '🟠', label: 'MEDIUM', color: '#f59e0b' };
    if (score >= 0.2) return { icon: '🟡', label: 'LOW', color: '#fbbf24' };
    return { icon: '🟢', label: 'VERY LOW', color: '#10b981' };
  };

  const badge = getRiskBadge();

  const handleAssignClick = () => {
    setSelectedMemberForAssignment(selectedMember);
  };

  const handleAssignCarePlan = (assignment) => {
    assignCarePlan(assignment);
    const carePlan = getCarePlan(assignment.memberId);
    if (carePlan) {
      console.log(`Care plan assigned to member ${assignment.memberId}`);
    }
  };

  const handleGenerateCarePlanPDF = () => {
    if (selectedMember) {
      const filename = `care-plan-${selectedMember.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const content = `
CARE PLAN REPORT
================
Member ID: ${selectedMember.id}
Name: ${selectedMember.name}
Age: ${selectedMember.age}
Risk Score: ${(selectedMember.riskScore * 100).toFixed(0)}%
Department: ${selectedMember.department || 'N/A'}

CONDITIONS:
${selectedMember.conditions?.join('\n') || 'None'}

VITAL METRICS:
- BMI: ${selectedMember.bmi?.toFixed(1) || 'N/A'}
- Systolic BP: ${selectedMember.systolicBP || 'N/A'}
- Diastolic BP: ${selectedMember.diastolicBP || 'N/A'}
- Glucose: ${selectedMember.glucose || 'N/A'}
- Cholesterol: ${selectedMember.cholesterol || 'N/A'}

UTILIZATION:
- ED Visits (90 days): ${selectedMember.edVisits || 0}
- Hospitalizations: ${selectedMember.hospitalizations || 0}
- Current Medications: ${selectedMember.medications || 0}

Generated: ${new Date().toISOString()}
      `;
      
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      console.log(`Care plan PDF generated for member ${selectedMember.id}`);
    }
  };

  const handleCloseCase = () => {
    if (selectedMember) {
      if (window.confirm(`Are you sure you want to close the case for ${selectedMember.name}?`)) {
        console.log(`Case closed for member ${selectedMember.id}`);
        navigate('/dashboard');
      }
    }
  };

  const handleBackClick = () => {
    const previousPage = getPreviousPage();
    navigate(previousPage);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Button variant="ghost" onClick={handleBackClick}>
          <ChevronLeft size={16} /> Back
        </Button>
      </div>

      <Card>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Member Profile: {selectedMember.id}</h2>
            <div className={styles.headerMeta}>
              <span>Last Updated: Today</span>
              <span>Next Review: In 7 days</span>
            </div>
          </div>
          <div 
            className={styles.badge}
            style={{ backgroundColor: badge.color }}
          >
            {badge.icon} {badge.label} ({Math.round(selectedMember.riskScore * 100)}%)
          </div>
        </div>

        <div className={styles.demographics}>
          <h3 className={styles.sectionTitle}>👤 Demographics</h3>
          <div className={styles.demoGrid}>
            <div>
              <div className={styles.label}>Age:</div>
              <div className={styles.value}>{selectedMember.age}</div>
            </div>
            <div>
              <div className={styles.label}>Gender:</div>
              <div className={styles.value}>
                {selectedMember.gender === 'F' ? 'Female' : 'Male'}
              </div>
            </div>
            <div>
              <div className={styles.label}>Member Since:</div>
              <div className={styles.value}>2018</div>
            </div>
          </div>
        </div>

        <RiskBreakdown member={selectedMember} />
        <ClinicalSummary member={selectedMember} />
        <CarePlan member={selectedMember} />

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleAssignClick}>
            Assign Care Team
          </Button>
          <Button variant="secondary" onClick={handleGenerateCarePlanPDF}>
            <FileText size={16} /> Generate Care Plan PDF
          </Button>
          <Button variant="secondary" onClick={handleCloseCase}>
            Close Case
          </Button>
        </div>
      </Card>

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

export default MemberDetailPage;