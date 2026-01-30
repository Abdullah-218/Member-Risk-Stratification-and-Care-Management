import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight, Heart, Activity, Shield } from 'lucide-react';
import Card from '../Card/Card';
import Button from '../Button/Button.jsx';
import styles from './EntryLoginPage.module.css';

// Integration point (merge-friendly):
// This is a pure router entry screen. It does NOT implement organization authentication.
// It only routes to the organization login route that your teammate owns.
const ORG_LOGIN_ROUTE = '/org';

const EntryLoginPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      {/* Animated Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingIcon} style={{ top: '10%', left: '10%', animationDelay: '0s' }}>
          <Heart size={40} strokeWidth={1.5} />
        </div>
        <div className={styles.floatingIcon} style={{ top: '20%', right: '15%', animationDelay: '1s' }}>
          <Activity size={35} strokeWidth={1.5} />
        </div>
        <div className={styles.floatingIcon} style={{ bottom: '15%', left: '8%', animationDelay: '2s' }}>
          <Shield size={45} strokeWidth={1.5} />
        </div>
        <div className={styles.floatingIcon} style={{ bottom: '25%', right: '12%', animationDelay: '1.5s' }}>
          <Building2 size={38} strokeWidth={1.5} />
        </div>
      </div>

      {/* Gradient Orbs */}
      <div 
        className={styles.gradientOrb1} 
        style={{ 
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` 
        }}
      />
      <div 
        className={styles.gradientOrb2} 
        style={{ 
          transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)` 
        }}
      />

      <div className={styles.wrapper}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>
                <Heart className={styles.logoIcon} size={32} />
              </div>
            </div>
            <div className={styles.brand}>HEALTHGUARD AI</div>
            <h2 className={styles.title}>Welcome Back</h2>
            <p className={styles.subtitle}>
              Choose how you want to enter the platform
            </p>
          </div>

          <div className={styles.modeGrid}>
            <div 
              className={`${styles.modeCard} ${styles.primaryMode} ${hoveredCard === 'org' ? styles.hovered : ''}`}
              onMouseEnter={() => setHoveredCard('org')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`${styles.cardGlow} ${styles.blueGlow}`} />
              <div className={styles.modeIcon}>
                <Building2 size={24} />
              </div>
              <div className={styles.modeContent}>
                <div className={styles.modeTitle}>Organization Login</div>
                <div className={styles.modeDesc}>
                  For care teams to access the Care Manager Dashboard
                </div>
              </div>
              <Button variant="primary" onClick={handleOrgMode} className={styles.modeButton}>
                Continue <ArrowRight size={16} className={styles.arrowIcon} />
              </Button>
            </div>

            <div 
              className={`${styles.modeCard} ${styles.secondaryMode} ${hoveredCard === 'individual' ? styles.hovered : ''}`}
              onMouseEnter={() => setHoveredCard('individual')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`${styles.cardGlow} ${styles.greenGlow}`} />
              <div className={styles.modeIcon}>
                <User size={24} />
              </div>
              <div className={styles.modeContent}>
                <div className={styles.modeTitle}>Individual Mode</div>
                <div className={styles.modeDesc}>
                  Start a patient self-assessment directly
                </div>
              </div>
              <Button variant="secondary" onClick={handleIndividualMode} className={styles.modeButton}>
                Start Assessment <ArrowRight size={16} className={styles.arrowIcon} />
              </Button>
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <Shield size={18} />
              <span>Secure & Private</span>
            </div>
            <div className={styles.feature}>
              <Activity size={18} />
              <span>Real-time Analysis</span>
            </div>
            <div className={styles.feature}>
              <Heart size={18} />
              <span>Patient-Centered</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EntryLoginPage;
