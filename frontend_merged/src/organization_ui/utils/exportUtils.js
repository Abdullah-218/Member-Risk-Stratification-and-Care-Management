import { csvProcessor } from '../services/csv/csvProcessor';
import { formatCurrency, formatDate, formatPercentage } from './formatters';

export const exportUtils = {
  exportMembersToCSV: (members, filename = 'members_export.csv') => {
    const data = members.map(member => ({
      'Member ID': member.id,
      'Age': member.age,
      'Gender': member.gender,
      'Risk Score': formatPercentage(member.riskScore),
      'Risk Tier': member.riskTier?.label || '',
      'Estimated Cost': member.estimatedCost,
      'Conditions': member.conditions?.join('; ') || '',
      'ED Visits': member.edVisits,
      'Hospitalizations': member.hospitalizations,
      'Medications': member.medications
    }));
    csvProcessor.export(data, filename);
  },

  exportROIReport: (roiData, filename = 'roi_report.csv') => {
    const data = [{
      'Report Date': formatDate(new Date()),
      'Projected Costs': roiData.projectedCosts,
      'Actual Costs': roiData.actualCosts,
      'Total Savings': roiData.totalSavings,
      'Savings Percentage': formatPercentage(roiData.savingsPercentage / 100),
      'Members Prevented Hospitalization': roiData.preventedHospitalizations,
      'Avg Savings Per Event': roiData.avgSavingsPerEvent
    }];

    csvProcessor.export(data, filename);
  },

  generateCarePlanPDF: (member) => {
    // This would integrate with a PDF generation library
    console.log('Generating PDF for member:', member.id);
    // Implementation would use libraries like jsPDF or pdfmake
  },

  exportDashboardData: (dashboardData, filename = 'dashboard_export.csv') => {
    const data = [{
      'Total Members': dashboardData.totalMembers,
      'Very High Risk': dashboardData.veryHighRisk,
      'High Risk': dashboardData.highRisk,
      'Medium Risk': dashboardData.mediumRisk,
      'Low Risk': dashboardData.lowRisk,
      'Very Low Risk': dashboardData.veryLowRisk,
      'Projected Annual Cost': dashboardData.projectedCost,
      'Potential Savings': dashboardData.potentialSavings
    }];

    csvProcessor.export(data, filename);
  }
};

export default exportUtils;