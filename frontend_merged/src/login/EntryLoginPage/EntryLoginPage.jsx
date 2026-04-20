import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight } from 'lucide-react';
import Card from '../Card/Card';
import Button from '../Button/Button.jsx';
import styles from './EntryLoginPage.module.css';

// Integration point (merge-friendly):
// This is a pure router entry screen. It does NOT implement organization authentication.
// It only routes to the organization login route that your teammate owns.
const ORG_LOGIN_ROUTE = '/org';

const EntryLoginPage = () => {
  const navigate = useNavigate();

  const handleOrgMode = () => {
    // Navigate to organization login page
    navigate('/org/login');
  };

  const handleIndividualMode = () => {
    // Navigate directly to individual assessment
    navigate('/assessment');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <div className={styles.brand}>HEALTHCARE RISK PLATFORM</div>
            <h2 className={styles.title}>Login</h2>
            <p className={styles.subtitle}>
              Choose how you want to enter the platform
            </p>
          </div>

          <div className={styles.modeGrid}>
            <div className={`${styles.modeCard} ${styles.primaryMode}`}>
              <div className={styles.modeIcon}>
                <Building2 size={22} />
              </div>
              <div className={styles.modeContent}>
                <div className={styles.modeTitle}>Organization Login</div>
                <div className={styles.modeDesc}>
                  For care teams to access the Care Manager Dashboard
                </div>
              </div>
              <Button variant="primary" onClick={handleOrgMode} className={styles.modeButton}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>

            <div className={`${styles.modeCard} ${styles.secondaryMode}`}>
              <div className={styles.modeIcon}>
                <User size={22} />
              </div>
              <div className={styles.modeContent}>
                <div className={styles.modeTitle}>Individual Mode</div>
                <div className={styles.modeDesc}>
                  Start a patient self-assessment directly
                </div>
              </div>
              <Button variant="secondary" onClick={handleIndividualMode} className={styles.modeButton}>
                Start Assessment <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EntryLoginPage;
