import React from 'react';
import Button from '../../common/Button/Button';
import styles from './AssessmentSteps.module.css';

/**
 * Navigation controls for multi-step assessment
 * Provides Next, Back, and step indicator functionality
 */
const StepNavigation = ({
  currentStep,
  totalSteps = 5,
  onNext,
  onPrev,
  onGoToStep,
  canGoNext = true,
  canGoPrev = true,
  showStepIndicator = true
}) => {
  const stepNumbers = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className={styles.navigation}>
      {/* Step Indicator */}
      {showStepIndicator && (
        <div className={styles.stepIndicator}>
          <span className={styles.stepText}>
            Step {currentStep} of {totalSteps}
          </span>
          <div className={styles.stepDots}>
            {stepNumbers.map(stepNum => (
              <button
                key={stepNum}
                className={`${styles.stepDot} ${stepNum === currentStep ? styles.active : ''} ${stepNum < currentStep ? styles.completed : ''}`}
                onClick={() => onGoToStep && onGoToStep(stepNum)}
                disabled={!onGoToStep}
                title={`Go to step ${stepNum}`}
              >
                {stepNum}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className={styles.navigationButtons}>
        <Button
          variant="secondary"
          onClick={onPrev}
          disabled={!canGoPrev || currentStep === 1}
        >
          ← Back
        </Button>

        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canGoNext || currentStep === totalSteps}
        >
          {currentStep === totalSteps ? 'Complete' : 'Next →'}
        </Button>
      </div>
    </div>
  );
};

export default StepNavigation;
