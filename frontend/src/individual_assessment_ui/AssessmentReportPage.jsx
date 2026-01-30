import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';
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

  const reportData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

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
          <h2 className={pageStyles.resultsTitle}>📊 Your Health Risk Assessment</h2>
          <p className={pageStyles.subtitle}>
            Based on machine learning analysis of your health data
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
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Risk Score</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: getTierColor(prediction.riskTier) }}>
                          {prediction.riskScore}%
                        </div>
                      </div>
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
    </div>
  );
};

export default AssessmentReportPage;
