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
    // Stage 1: Demographics (matches ML model)
    demographics: {
      age: '',
      gender: '',  // Will be converted to 1=Male, 2=Female
      race: '',    // 1=White, 2=Black, 3=Other, 5=Hispanic
      total_annual_cost: ''
    },

    // Stage 2: Chronic Conditions (matches ML model exactly - 11 conditions)
    conditions: {
      has_alzheimers: false,
      has_chf: false,
      has_ckd: false,
      has_cancer: false,
      has_copd: false,
      has_depression: false,
      has_diabetes: false,
      has_ischemic_heart: false,
      has_ra_oa: false,
      has_stroke: false,
      has_esrd: false
    },

    // Stage 3: Healthcare Utilization (matches ML model - 4 fields only)
    utilization: {
      total_admissions: '',
      total_hospital_days: '',
      days_since_last_admission: '',
      total_outpatient_visits: ''
    },

    // Prediction Results (will be populated by backend)
    predictions: null
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
        // Demographics: age, gender, race, total_annual_cost required
        return (
          assessmentData.demographics.age !== '' &&
          assessmentData.demographics.gender !== '' &&
          assessmentData.demographics.race !== '' &&
          assessmentData.demographics.total_annual_cost !== ''
        );
      case 2:
        // Conditions are optional, always valid
        return true;
      case 3:
        // Utilization fields are optional (can be 0)
        return true;
      case 4:
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
