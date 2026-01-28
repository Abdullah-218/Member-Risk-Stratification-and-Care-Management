export const interventions = {
  types: [
    {
      id: 'diabetes_mgmt',
      name: 'Diabetes Management',
      description: 'Intensive diabetes education and monitoring program',
      targetConditions: ['Diabetes Type 2'],
      expectedRiskReduction: 0.15,
      averageCost: 2500,
      duration: '90 days',
      components: [
        'Daily glucose monitoring',
        'Nutrition counseling',
        'Medication management',
        'Endocrinology consultation'
      ],
      successMetrics: {
        hba1cReduction: 1.5,
        hospitalizationReduction: 0.35,
        satisfactionRate: 0.88
      }
    },
    {
      id: 'care_coord',
      name: 'Care Coordination',
      description: 'Dedicated care coordinator for high-risk members',
      targetConditions: ['All'],
      expectedRiskReduction: 0.12,
      averageCost: 1800,
      duration: '180 days',
      components: [
        'Weekly check-ins',
        'Appointment coordination',
        'Medication reconciliation',
        'Social determinants assessment'
      ],
      successMetrics: {
        appointmentAdherence: 0.92,
        hospitalizationReduction: 0.28,
        satisfactionRate: 0.91
      }
    },
    {
      id: 'med_recon',
      name: 'Medication Reconciliation',
      description: 'Comprehensive medication review and optimization',
      targetConditions: ['Polypharmacy'],
      expectedRiskReduction: 0.08,
      averageCost: 500,
      duration: '30 days',
      components: [
        'Pharmacist consultation',
        'Drug interaction review',
        'Dosage optimization',
        'Patient education'
      ],
      successMetrics: {
        medicationAdherence: 0.85,
        adverseEventReduction: 0.42,
        satisfactionRate: 0.79
      }
    },
    {
      id: 'home_health',
      name: 'Home Health Visits',
      description: 'Regular in-home nursing visits',
      targetConditions: ['CHF', 'COPD', 'Post-hospitalization'],
      expectedRiskReduction: 0.10,
      averageCost: 3200,
      duration: '60 days',
      components: [
        'Vital signs monitoring',
        'Medication administration',
        'Wound care',
        'Patient/family education'
        ],
      successMetrics: {
        readmissionReduction: 0.48,
        functionalImprovement: 0.65,
        satisfactionRate: 0.94
      }
    },
    {
      id: 'telehealth',
      name: 'Telehealth Monitoring',
      description: 'Remote patient monitoring with connected devices',
      targetConditions: ['CHF', 'Hypertension', 'Diabetes'],
      expectedRiskReduction: 0.07,
      averageCost: 800,
      duration: '90 days',
      components: [
        'Connected scale/BP monitor',
        'Daily data transmission',
        'Alert-based interventions',
        'Monthly virtual visits'
      ],
      successMetrics: {
        dataComplianceRate: 0.73,
        earlyDetection: 0.81,
        satisfactionRate: 0.76
      }
    }
  ],
  
  getInterventionById: (id) => {
    return interventions.types.find(i => i.id === id);
  },
  
  getRecommendedInterventions: (member) => {
    const recommended = [];
    
    // High risk members get care coordination
    if (member.riskScore >= 0.6) {
      recommended.push(interventions.getInterventionById('care_coord'));
    }
    
    // Diabetes members get diabetes management
    if (member.conditions?.some(c => c.includes('Diabetes'))) {
      recommended.push(interventions.getInterventionById('diabetes_mgmt'));
    }
    
    // Polypharmacy members get medication reconciliation
    if (member.medications >= 7) {
      recommended.push(interventions.getInterventionById('med_recon'));
    }
    
    // Recent hospitalizations get home health
    if (member.hospitalizations >= 1) {
      recommended.push(interventions.getInterventionById('home_health'));
    }
    
    // CHF/Diabetes get telehealth
    if (member.conditions?.some(c => c.includes('CHF') || c.includes('Diabetes'))) {
      recommended.push(interventions.getInterventionById('telehealth'));
    }
    
    return recommended.filter(Boolean);
  }
};

export default interventions;