import { useState, useCallback, useEffect } from 'react';

/**
 * Centralized state management for assessment data
 * Provides clean, backend-ready data structure
 */
const useAssessmentState = () => {
  const loadDraft = () => {
    try {
      const raw = sessionStorage.getItem('assessmentDraft');
      if (!raw) return null;

      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const [draft] = useState(loadDraft);

  useEffect(() => {
    if (!draft) return;
    sessionStorage.removeItem('assessmentDraft');
  }, [draft]);

  const [currentStep, setCurrentStep] = useState(draft?.currentStep ?? 1);
  const [assessmentData, setAssessmentData] = useState(draft?.assessmentData ?? {
    // Stage 1: Demographics
    demographics: {
      age: '',
      gender: '',
      annualHealthcareCost: ''
    },

    // Stage 2: Chronic Conditions
    conditions: {
      diabetes: false,
      heartDisease: false,
      copd: false,
      cancer: false,
      kidneyDisease: false,
      stroke: false,
      depression: false,
      alzheimers: false,
      hypertension: false,
      arthritis: false,
      esrd: false,
      chf: false,
      ckd: false,
      ischemicHeartDisease: false
    },

    // Stage 3: Healthcare Utilization (Past 12 Months)
    utilization: {
      hospitalAdmissions: '',
      totalHospitalDays: '',
      daysSinceLastAdmission: '',
      recentAdmissionPast30Days: 'no',
      outpatientVisits: '',
      highOutpatientUser: 'no',
      erEdVisits: '',
      specialistVisits: ''
    },

    // Stage 4: Additional Health Metrics
    metrics: {
      totalInpatientCost: '',
      costPercentile: '',
      highCostPatientTop20: 'no',
      frailtyScore: '',
      complexityIndex: ''
    },

    // Prediction Results (placeholder values for frontend)
    predictions: {
      '30-day': {
        riskLevel: 'Low',
        riskScore: 15,
        costImpact: 250,
        roiValue: 1200
      },
      '60-day': {
        riskLevel: 'Medium',
        riskScore: 35,
        costImpact: 750,
        roiValue: 2800
      },
      '90-day': {
        riskLevel: 'High',
        riskScore: 65,
        costImpact: 1800,
        roiValue: 4500
      }
    }
  });

  // Update specific field in assessment data
  const updateField = useCallback((category, field, value) => {
    setAssessmentData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  }, []);

  // Update demographics
  const updateDemographics = useCallback((field, value) => {
    updateField('demographics', field, value);
  }, [updateField]);

  // Update conditions
  const updateCondition = useCallback((condition, value) => {
    setAssessmentData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [condition]: value
      }
    }));
  }, []);

  // Update utilization
  const updateUtilization = useCallback((field, value) => {
    updateField('utilization', field, value);
  }, [updateField]);

  // Update metrics
  const updateMetrics = useCallback((field, value) => {
    updateField('metrics', field, value);
  }, [updateField]);

  // Update predictions (for backend integration)
  const updatePredictions = useCallback((predictions) => {
    setAssessmentData(prev => ({
      ...prev,
      predictions
    }));
  }, []);

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(Math.max(1, Math.min(step, 5)));
  }, []);

  // Validation functions
  const validateStep = useCallback((step) => {
    switch (step) {
      case 1:
        const { age, gender, annualHealthcareCost } = assessmentData.demographics;
        return age && gender && annualHealthcareCost !== '';
      case 2:
        // Conditions are optional, always valid
        return true;
      case 3:
        const {
          hospitalAdmissions,
          totalHospitalDays,
          daysSinceLastAdmission,
          recentAdmissionPast30Days,
          outpatientVisits,
          highOutpatientUser,
          erEdVisits,
          specialistVisits
        } = assessmentData.utilization;
        return (
          hospitalAdmissions !== '' &&
          totalHospitalDays !== '' &&
          daysSinceLastAdmission !== '' &&
          recentAdmissionPast30Days !== '' &&
          outpatientVisits !== '' &&
          highOutpatientUser !== '' &&
          erEdVisits !== '' &&
          specialistVisits !== ''
        );
      case 4:
        const { totalInpatientCost, costPercentile, highCostPatientTop20, frailtyScore, complexityIndex } = assessmentData.metrics;
        return (
          totalInpatientCost !== '' &&
          costPercentile !== '' &&
          highCostPatientTop20 !== '' &&
          frailtyScore !== '' &&
          complexityIndex !== ''
        );
      case 5:
        // Review step is always valid
        return true;
      default:
        return false;
    }
  }, [assessmentData]);

  // Get complete assessment data for backend submission
  const getAssessmentForSubmission = useCallback(() => {
    return {
      ...assessmentData,
      currentStep,
      submittedAt: new Date().toISOString()
    };
  }, [assessmentData, currentStep]);

  return {
    // State
    currentStep,
    assessmentData,

    // Update functions
    updateDemographics,
    updateCondition,
    updateUtilization,
    updateMetrics,
    updatePredictions,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Validation
    validateStep,

    // Data access
    getAssessmentForSubmission
  };
};

export default useAssessmentState;
