import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Download, FileText } from "lucide-react";

import { useMembers } from "../../context/MemberContext";
import { useCarePlan } from "../../context/CarePlanContext";
import { useNavigationHistory } from "../../context/NavigationHistoryContext";
// utils (global)
import { exportUtils } from "../../utils/exportUtils";

// common components
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";

// member components
import RiskBreakdown from "../../components/members/RiskBreakdown/RiskBreakdown";
import ClinicalSummary from "../../components/members/ClinicalSummary/ClinicalSummary";
import CarePlan from "../../components/members/CarePlan/CarePlan";
import CarePlanAssignmentModal from "../../components/members/CarePlanAssignmentModal/CarePlanAssignmentModal";

// styles
import styles from "./MemberDetailPage.module.css";


const MemberDetailPage = () => {
  const { members } = useMembers();
  const { assignCarePlan, getCarePlan } = useCarePlan();
  const navigate = useNavigate();
  const { getPreviousPage } = useNavigationHistory();
  const { memberId } = useParams();
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);

  // Find the member by ID from URL parameter
  const selectedMember = members.find(m => m.id === memberId);

  // Dummy patient data as fallback
  const dummyMember = {
    id: memberId || 'DUMMY-001',
    name: 'John Doe',
    age: 65,
    gender: 'M',
    department: 'Cardiology',
    riskScore: 0.75,
    conditions: ['Hypertension', 'Diabetes Type 2'],
    estimatedCost: 15000,
    edVisits: 3,
    hospitalizations: 1,
    medications: 5,
    bmi: 28.5,
    systolicBP: 140,
    diastolicBP: 85,
    glucose: 110,
    cholesterol: 180
  };

  // Use found member or dummy data
  const member = selectedMember || dummyMember;

  const getRiskBadge = () => {
    const score = member.riskScore;
    if (score >= 0.8) return { icon: '⚫', label: 'VERY HIGH', color: '#1a1a1a' };
    if (score >= 0.6) return { icon: '🔴', label: 'HIGH', color: '#dc2626' };
    if (score >= 0.4) return { icon: '🟠', label: 'MEDIUM', color: '#f59e0b' };
    if (score >= 0.2) return { icon: '🟡', label: 'LOW', color: '#fbbf24' };
    return { icon: '🟢', label: 'VERY LOW', color: '#10b981' };
  };

  const badge = getRiskBadge();

  const handleAssignClick = () => {
    setSelectedMemberForAssignment(member);
  };

  const handleAssignCarePlan = (assignment) => {
    assignCarePlan(assignment);
    const carePlan = getCarePlan(assignment.memberId);
    if (carePlan) {
      console.log(`Care plan assigned to member ${assignment.memberId}`);
    }
  };

  const handleGenerateCarePlanPDF = () => {
    const filename = `care-plan-${member.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const content = `
CARE PLAN REPORT
================
Member ID: ${member.id}
Name: ${member.name}
Age: ${member.age}
Risk Score: ${(member.riskScore * 100).toFixed(0)}%
Department: ${member.department || 'N/A'}

CONDITIONS:
${member.conditions?.join('\n') || 'None'}

VITAL METRICS:
- BMI: ${member.bmi?.toFixed(1) || 'N/A'}
- Systolic BP: ${member.systolicBP || 'N/A'}
- Diastolic BP: ${member.diastolicBP || 'N/A'}
- Glucose: ${member.glucose || 'N/A'}
- Cholesterol: ${member.cholesterol || 'N/A'}

UTILIZATION:
- ED Visits (90 days): ${member.edVisits || 0}
- Hospitalizations: ${member.hospitalizations || 0}
- Current Medications: ${member.medications || 0}

Generated: ${new Date().toISOString()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    console.log(`Care plan PDF generated for member ${member.id}`);
  };

  const handleCloseCase = () => {
    if (window.confirm(`Are you sure you want to close the case for ${member.name}?`)) {
      console.log(`Case closed for member ${member.id}`);
      navigate('/dashboard');
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
            <h2 className={styles.title}>Member Profile: {member.id}</h2>
            <div className={styles.headerMeta}>
              <span>Last Updated: Today</span>
              <span>Next Review: In 7 days</span>
            </div>
          </div>
          <div
            className={styles.badge}
            style={{ backgroundColor: badge.color }}
          >
            {badge.icon} {badge.label} ({Math.round(member.riskScore * 100)}%)
          </div>
        </div>

        <div className={styles.demographics}>
          <h3 className={styles.sectionTitle}>👤 Demographics</h3>
          <div className={styles.demoGrid}>
            <div>
              <div className={styles.label}>Age:</div>
              <div className={styles.value}>{member.age}</div>
            </div>
            <div>
              <div className={styles.label}>Gender:</div>
              <div className={styles.value}>
                {member.gender === 'F' ? 'Female' : 'Male'}
              </div>
            </div>
            <div>
              <div className={styles.label}>Department:</div>
              <div className={styles.value}>{member.department || 'N/A'}</div>
            </div>
          </div>
        </div>

        <RiskBreakdown member={member} />
        <ClinicalSummary member={member} />
        <CarePlan member={member} />

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