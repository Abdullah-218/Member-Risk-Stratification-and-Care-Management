import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import MultiStepAssessment from '../../common/components/individual/AssessmentSteps/MultiStepAssessment';
import styles from './IndividualAssessmentPage.module.css';

/**
 * Individual Assessment Page
 * Updated to use the new multi-step assessment flow
 */
const IndividualAssessmentPage = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Button variant="ghost" onClick={handleBackToHome} className={styles.backButton}>
          <ChevronLeft size={16} /> Back to Home
        </Button>

        <Card className={styles.card}>
          <h2 className={styles.title}>🩺 Individual Patient Risk Prediction</h2>
          <p className={styles.subtitle}>
            Complete this 5-step assessment to understand your health risks and potential ROI
          </p>
          <div className={styles.info}>
            ℹ️ This tool helps healthcare providers assess patient risk levels and potential cost savings
            through targeted interventions. All data is securely processed and stored according to healthcare standards.
          </div>

          {/* Multi-Step Assessment Component */}
          <MultiStepAssessment />
        </Card>
      </div>
    </div>
  );
};

export default IndividualAssessmentPage;
