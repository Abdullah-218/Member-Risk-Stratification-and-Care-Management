import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, DollarSign, Activity, AlertCircle, Info } from 'lucide-react';
import Card from '../common/Card/Card';
import Button from '../common/Button/Button';
import pageStyles from './IndividualAssessmentPage/IndividualAssessmentPage.module.css';
import styles from '../common/components/individual/AssessmentSteps/AssessmentSteps.module.css';

const REPORT_STORAGE_KEY = 'assessmentReport';

/**
 * Assessment Report Page
 * Displays ML prediction results with risk scores, tiers, and ROI calculations
 * Updated to work with actual ML model output
 */
const AssessmentReportPage = () => {
  const navigate = useNavigate();
  const [shapModalOpen, setShapModalOpen] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(null);

  const reportData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const openShapModal = (windowPeriod) => {
    setSelectedWindow(windowPeriod);
    setShapModalOpen(true);
  };

  const closeShapModal = () => {
    setShapModalOpen(false);
    setSelectedWindow(null);
  };

  const getConditionLabel = (key) => {
    const labels = {
      has_alzheimers: "Alzheimer's Disease",
      has_chf: 'Congestive Heart Failure (CHF)',
      has_ckd: 'Chronic Kidney Disease (CKD)',
      has_cancer: 'Cancer',
      has_copd: 'COPD',
      has_depression: 'Depression',
      has_diabetes: 'Diabetes Mellitus',
      has_ischemic_heart: 'Ischemic Heart Disease',
      has_ra_oa: 'Rheumatoid Arthritis / Osteoarthritis',
      has_stroke: 'Stroke / TIA',
      has_esrd: 'End-Stage Renal Disease (ESRD)'
    };
    return labels[key] || key;
  };

  const getRaceLabel = (raceCode) => {
    const races = {
      '1': 'White',
      '2': 'Black/African American',
      '3': 'Other',
      '5': 'Hispanic/Latino'
    };
    return races[raceCode] || 'Unknown';
  };

  const getTierColor = (tier) => {
    const colors = {
      1: '#059669', // Green - Normal
      2: '#3b82f6', // Blue - Low Risk
      3: '#f59e0b', // Orange - Moderate
      4: '#ef4444', // Red - High Risk
      5: '#dc2626'  // Dark Red - Critical
    };
    return colors[tier] || '#6b7280';
  };

  const selectedConditions = useMemo(() => {
    if (!reportData) return [];
    return Object.keys(reportData.conditions).filter((key) => reportData.conditions[key]);
  }, [reportData]);

  const handleBackToAssessment = () => {
    navigate('/assessment');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  if (!reportData || !reportData.predictions) {
    return (
      <div className={pageStyles.container}>
        <div className={pageStyles.wrapper}>
          <Card className={pageStyles.card}>
            <h2 className={pageStyles.title}>Assessment Report</h2>
            <p className={pageStyles.subtitle}>No report found. Please run a prediction first.</p>
            <Button onClick={handleBackToAssessment} variant="primary">
              <ChevronLeft size={16} /> Back to Assessment
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.resultsContainer}>
      <div className={pageStyles.resultsWrapper}>
        <Button variant="ghost" onClick={handleBackHome} className={pageStyles.backButton}>
          <ChevronLeft size={16} /> Back to Home
        </Button>

        <Card className={pageStyles.resultsCard}>
          <h2 className={pageStyles.resultsTitle}>📊 Your Health Risk Assessment Report</h2>
          <p className={pageStyles.subtitle}>
            A comprehensive evaluation of your health status and predicted healthcare needs
          </p>

          {/* Patient Summary */}
          <div className={styles.reviewSection}>
            <h4 className={styles.sectionTitle}>👤 Patient Summary</h4>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h5>Demographics</h5>
                <p><strong>Age:</strong> {reportData.demographics.age} years</p>
                <p><strong>Gender:</strong> {reportData.demographics.gender === 'male' ? 'Male' : 'Female'}</p>
                <p><strong>Race/Ethnicity:</strong> {getRaceLabel(reportData.demographics.race)}</p>
                <p><strong>Annual Cost:</strong> ${Number(reportData.demographics.total_annual_cost).toLocaleString()}</p>
              </div>

              <div className={styles.summaryCard}>
                <h5>Chronic Conditions</h5>
                {selectedConditions.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                    {selectedConditions.map(condition => (
                      <li key={condition}>{getConditionLabel(condition)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No chronic conditions reported</p>
                )}
              </div>

              <div className={styles.summaryCard}>
                <h5>Healthcare Utilization (12 months)</h5>
                <p><strong>Admissions:</strong> {reportData.utilization.total_admissions || 0}</p>
                <p><strong>Hospital Days:</strong> {reportData.utilization.total_hospital_days || 0}</p>
                <p><strong>Days Since Last Admission:</strong> {reportData.utilization.days_since_last_admission || 'Never'}</p>
                <p><strong>Outpatient Visits:</strong> {reportData.utilization.total_outpatient_visits || 0}</p>
              </div>
            </div>
          </div>

          {/* Risk Predictions - 3 Windows */}
          <div className={styles.predictionSection} style={{ marginTop: '40px' }}>
            <h4 className={styles.sectionTitle}>🎯 Risk Predictions & ROI Analysis</h4>
            
            <div className={styles.predictionGrid} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginTop: '20px'
            }}>
              {Object.entries(reportData.predictions).map(([period, prediction]) => (
                <div 
                  key={period} 
                  className={styles.predictionCard}
                  style={{
                    border: `2px solid ${getTierColor(prediction.riskTier)}`,
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Window Header */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      {prediction.window || period}
                    </h5>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {prediction.days} days prediction window
                    </div>
                  </div>

                  {/* Risk Score & Tier */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <Activity size={20} color={getTierColor(prediction.riskTier)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Risk Score</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: getTierColor(prediction.riskTier) }}>
                          {prediction.riskScore}%
                        </div>
                      </div>
                      {/* SHAP Info Icon */}
                      {reportData.explanations && reportData.explanations[period] && (
                        <button
                          onClick={() => openShapModal(period)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="What's driving this risk score?"
                        >
                          <Info size={18} />
                        </button>
                      )}
                    </div>
                    <div 
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: `${getTierColor(prediction.riskTier)}15`,
                        color: getTierColor(prediction.riskTier),
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      Tier {prediction.riskTier}/5 - {prediction.tierLabel}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <h6 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DollarSign size={16} />
                      Financial Projection
                    </h6>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <div style={{ color: '#6b7280' }}>Projected Cost</div>
                        <div style={{ fontWeight: '600' }}>${Number(prediction.projectedCost).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280' }}>Intervention Cost</div>
                        <div style={{ fontWeight: '600' }}>${Number(prediction.interventionCost).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280' }}>Expected Savings</div>
                        <div style={{ fontWeight: '600', color: '#059669' }}>${Number(prediction.expectedSavings).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280' }}>Net Benefit</div>
                        <div style={{ fontWeight: '600', color: prediction.netBenefit >= 0 ? '#059669' : '#dc2626' }}>
                          ${Number(prediction.netBenefit).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROI */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: prediction.roiPercent > 0 ? '#ecfdf5' : '#fef2f2',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={20} color={prediction.roiPercent > 0 ? '#059669' : '#dc2626'} />
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>ROI</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: prediction.roiPercent > 0 ? '#059669' : '#dc2626' }}>
                          {prediction.roiPercent}%
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>
                      Success Rate:<br/>
                      <span style={{ fontWeight: '600' }}>{prediction.successRate}%</span>
                      <br/>
                      ({prediction.successRateRange})
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px',
                    backgroundColor: '#fffbeb',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {prediction.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            marginTop: '40px', 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center',
            paddingTop: '30px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <Button variant="secondary" onClick={handleBackToAssessment}>
              <ChevronLeft size={16} /> Start New Assessment
            </Button>
            <Button variant="primary" onClick={handleBackHome}>
              Return to Home
            </Button>
          </div>

          {/* Database ID */}
          {reportData.patient_id_db && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'center',
              color: '#166534'
            }}>
              ✅ Patient record saved to database (ID: {reportData.patient_id_db})
            </div>
          )}
        </Card>
      </div>

      {/* SHAP Explanation Modal */}
      {shapModalOpen && selectedWindow && reportData.explanations && reportData.explanations[selectedWindow] && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeShapModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderRadius: '12px 12px 0 0',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                  <Info size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                  What's Driving Your {selectedWindow === '30-day' ? '30-Day' : selectedWindow === '60-day' ? '60-Day' : '90-Day'} Risk Score?
                </h3>
                <button
                  onClick={closeShapModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    lineHeight: 1,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#1f2937'}
                  onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                  title="Close"
                >
                  ×
                </button>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
                These are the top 5 factors influencing your risk prediction, based on SHAP (SHapley Additive exPlanations) analysis.
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {reportData.explanations[selectedWindow].top_drivers.map((driver, idx) => {
                const impactColor = driver.impact > 0 ? '#dc2626' : '#059669';
                
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      marginBottom: '16px',
                      backgroundColor: driver.impact > 0 ? '#fef2f2' : '#ecfdf5',
                      padding: '14px',
                      borderRadius: '8px',
                      border: `1px solid ${driver.impact > 0 ? '#fecaca' : '#a7f3d0'}`
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '4px'
                        }}>
                          {idx + 1}. {driver.label}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280'
                        }}>
                          Current value: {driver.value.toFixed(driver.value < 10 ? 1 : 0)}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '700',
                        color: impactColor,
                        minWidth: '70px',
                        textAlign: 'right'
                      }}>
                        {driver.percentage.toFixed(1)}%
                      </div>
                    </div>
                    
                    {/* Impact bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '10px', 
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        width: `${driver.percentage}%`, 
                        height: '100%',
                        backgroundColor: impactColor,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '500',
                      color: impactColor
                    }}>
                      {driver.direction === 'increases' ? '↑ Increases' : '↓ Decreases'} your risk score
                    </div>
                  </div>
                );
              })}

              {/* Footer tip */}
              <div style={{ 
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.5' }}>
                  <strong>💡 Tip:</strong> Focus on modifiable factors like healthcare utilization patterns and chronic disease management to potentially reduce your risk score.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentReportPage;
