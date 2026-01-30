import React, { useState } from 'react';
import useAssessmentState from '../../../hooks/useAssessmentState';
import { onPredict } from '../../../services/assessmentApi';
import Step1Demographics from './Step1Demographics';
import Step2ChronicConditions from './Step2ChronicConditions';
import Step3HealthcareUtilization from './Step3HealthcareUtilization';
import Step4ReviewPredict from './Step4ReviewPredict';
import StepNavigation from './StepNavigation';
import styles from './AssessmentSteps.module.css';

/**
 * Multi-Step Assessment Component
 * Orchestrates the 4-stage assessment flow with proper state management
 * Updated to match ML model's 19 raw input fields exactly
 */
const MultiStepAssessment = () => {
  const {
    currentStep,
    assessmentData,
    updateDemographics,
    updateCondition,
    updateUtilization,
    updateMetrics,
    updatePredictions,
    nextStep,
    prevStep,
    goToStep,
    validateStep
  } = useAssessmentState();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Handle field updates for different categories
  const handleFieldUpdate = (category, field, value) => {
    switch (category) {
      case 'demographics':
        updateDemographics(field, value);
        break;
      case 'conditions':
        updateCondition(field, value);
        break;
      case 'utilization':
        updateUtilization(field, value);
        break;
      case 'metrics':
        updateMetrics(field, value);
        break;
      default:
        console.warn('Unknown category:', category);
    }
  };

  // Handle navigation with validation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        nextStep();
      }
    } else {
      alert('Please complete all required fields before proceeding.');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      prevStep();
    }
  };

  const handleGoToStep = (step) => {
    // Allow navigation to previous steps or current step
    if (step <= currentStep) {
      goToStep(step);
    }
  };

  // Handle prediction calculation
  const handlePredict = async () => {
    try {
      setIsSubmitting(true);
      setSubmitMessage('');

      // Call prediction API
      const result = await onPredict(assessmentData);

      if (result.success) {
        updatePredictions(result.predictions);
        setSubmitMessage('Risk predictions calculated successfully!');
        return result;
      } else {
        setSubmitMessage('Failed to calculate predictions. Please try again.');
        return result;
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setSubmitMessage('An error occurred while calculating predictions.');
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    const commonProps = {
      data: assessmentData,
      onUpdate: handleFieldUpdate
    };

    switch (currentStep) {
      case 1:
        return <Step1Demographics {...commonProps} />;
      case 2:
        return <Step2ChronicConditions {...commonProps} />;
      case 3:
        return <Step3HealthcareUtilization {...commonProps} />;
      case 4:
        return (
          <Step4ReviewPredict
            {...commonProps}
            onPredict={handlePredict}
            onBack={handlePrev}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className={styles.multiStepAssessment}>
      {renderCurrentStep()}

      {/* Navigation - Show on all steps except the last */}
      {currentStep < 4 && (
        <StepNavigation
          currentStep={currentStep}
          totalSteps={4}
          onNext={handleNext}
          onPrev={handlePrev}
          onGoToStep={handleGoToStep}
          canGoNext={validateStep(currentStep)}
          canGoPrev={currentStep > 1}
          showStepIndicator={true}
        />
      )}

      {/* Submission message */}
      {submitMessage && (
        <div className={`${styles.message} ${submitMessage.includes('success') ? styles.success : styles.error}`}>
          {submitMessage}
        </div>
      )}

      {/* Loading overlay */}
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepAssessment;
