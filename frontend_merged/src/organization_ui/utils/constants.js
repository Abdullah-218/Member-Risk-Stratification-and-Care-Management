export const RISK_TIERS = {
  VERY_HIGH: { level: 5, label: 'Very High', color: '#1a1a1a', threshold: 0.8, icon: '⚫' },
  HIGH: { level: 4, label: 'High', color: '#dc2626', threshold: 0.6, icon: '🔴' },
  MEDIUM: { level: 3, label: 'Medium', color: '#f59e0b', threshold: 0.4, icon: '🟠' },
  LOW: { level: 2, label: 'Low', color: '#fbbf24', threshold: 0.2, icon: '🟡' },
  VERY_LOW: { level: 1, label: 'Very Low', color: '#10b981', threshold: 0, icon: '🟢' }
};

export const PREDICTION_WINDOWS = {
  THIRTY_DAYS: { value: '30', label: '30 days' },
  SIXTY_DAYS: { value: '60', label: '60 days' },
  NINETY_DAYS: { value: '90', label: '90 days' }
};

export const RISK_MODELS = {
  COMPREHENSIVE: { value: 'comprehensive', label: 'Comprehensive' },
  DIABETES: { value: 'diabetes', label: 'Diabetes-focused' },
  CARDIAC: { value: 'cardiac', label: 'Cardiac-focused' }
};

export const REQUIRED_CSV_COLUMNS = [
  'patient_id',
  'age',
  'gender',
  'conditions',
  'utilization',
  'lab_results'
];

export const CONDITIONS = [
  'Diabetes Type 2',
  'CHF',
  'Hypertension',
  'COPD',
  'CKD',
  'Cancer',
  'Heart Disease',
  'High Cholesterol'
];

export const INTERVENTIONS = [
  { id: 'diabetes_mgmt', name: 'Diabetes Management' },
  { id: 'care_coord', name: 'Care Coordination' },
  { id: 'med_recon', name: 'Medication Reconciliation' },
  { id: 'home_health', name: 'Home Health Visits' },
  { id: 'telehealth', name: 'Telehealth Monitoring' }
];

export const API_ENDPOINTS = {
  AUTH: '/auth',
  MEMBERS: '/members',
  UPLOAD: '/upload',
  RISK: '/risk',
  INTERVENTIONS: '/interventions'
};

export default {
  RISK_TIERS,
  PREDICTION_WINDOWS,
  RISK_MODELS,
  REQUIRED_CSV_COLUMNS,
  CONDITIONS,
  INTERVENTIONS,
  API_ENDPOINTS
};