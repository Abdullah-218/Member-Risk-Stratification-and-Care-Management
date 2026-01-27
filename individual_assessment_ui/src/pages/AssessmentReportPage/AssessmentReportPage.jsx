import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Home, Calendar, AlertCircle, Activity, Heart, Pill, Stethoscope, User } from 'lucide-react';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import { onSubmitAssessment, sendAssessmentReport } from '../../services/assessmentApi';
import pageStyles from '../IndividualAssessmentPage/IndividualAssessmentPage.module.css';
import styles from '../../components/individual/AssessmentSteps/AssessmentSteps.module.css';

const REPORT_STORAGE_KEY = 'assessmentReport';

const AssessmentReportPage = () => {
  const navigate = useNavigate();
  const [patientEmail, setPatientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Standard';
    }
  };

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
      diabetes: 'Diabetes',
      heartDisease: 'Heart Disease',
      copd: 'COPD',
      cancer: 'Cancer',
      kidneyDisease: 'Kidney Disease',
      stroke: 'Stroke',
      depression: 'Depression',
      alzheimers: "Alzheimer's",
      hypertension: 'Hypertension',
      arthritis: 'Arthritis',
      esrd: 'End-Stage Renal Disease (ESRD)',
      chf: 'Congestive Heart Failure (CHF)',
      ckd: 'Chronic Kidney Disease (CKD)',
      ischemicHeartDisease: 'Ischemic Heart Disease'
    };
    return labels[key] || key;
  };

  const generateRecommendations = (data) => {
    const { demographics, conditions, utilization, metrics } = data;

    const recommendations = {
      immediateActions: [],
      lifestyleChanges: [],
      followUpCare: [],
      monitoring: [],
      emergencySigns: []
    };

    if (parseInt(demographics.age) > 65) {
      recommendations.immediateActions.push({
        icon: <Stethoscope size={16} />,
        title: 'Comprehensive Geriatric Assessment',
        description: 'Schedule a complete geriatric evaluation with your primary care physician',
        priority: 'high',
        timeframe: 'Within 1 month'
      });

      recommendations.followUpCare.push({
        icon: <Calendar size={16} />,
        title: 'Quarterly Check-ups',
        description: 'Schedule quarterly visits with your primary care physician',
        priority: 'medium',
        timeframe: 'Every 3 months'
      });
    }

    const hospitalAdmissions = parseInt(utilization.hospitalAdmissions);
    const totalHospitalDays = parseInt(utilization.totalHospitalDays);
    const daysSinceLastAdmission = parseInt(utilization.daysSinceLastAdmission);
    const outpatientVisits = parseInt(utilization.outpatientVisits);
    const erEdVisits = parseInt(utilization.erEdVisits);
    const specialistVisits = parseInt(utilization.specialistVisits);
    const costPercentile = parseFloat(metrics.costPercentile);
    const totalInpatientCost = parseFloat(metrics.totalInpatientCost);
    const frailtyScore = parseFloat(metrics.frailtyScore);
    const complexityIndex = parseFloat(metrics.complexityIndex);

    if (utilization.recentAdmissionPast30Days === 'yes') {
      recommendations.immediateActions.push({
        icon: <Calendar size={16} />,
        title: 'Post-Discharge Follow-up',
        description: 'Schedule a follow-up appointment after your recent hospital admission',
        priority: 'high',
        timeframe: 'Within 7 days'
      });
    }

    if ((hospitalAdmissions >= 2) || (totalHospitalDays >= 7) || (erEdVisits >= 2)) {
      recommendations.followUpCare.push({
        icon: <Stethoscope size={16} />,
        title: 'Care Coordination',
        description: 'Create a care plan to reduce avoidable admissions and ER/ED visits',
        priority: 'high',
        timeframe: 'Within 2 weeks'
      });
    }

    if (utilization.highOutpatientUser === 'yes' || outpatientVisits >= 12 || specialistVisits >= 6) {
      recommendations.followUpCare.push({
        icon: <Calendar size={16} />,
        title: 'Consolidate Follow-up Visits',
        description: 'Review your outpatient and specialist schedule to reduce duplication and improve continuity',
        priority: 'medium',
        timeframe: 'Within 1 month'
      });
    }

    if (metrics.highCostPatientTop20 === 'yes' || costPercentile >= 80 || totalInpatientCost >= 10000) {
      recommendations.immediateActions.push({
        icon: <User size={16} />,
        title: 'High-Cost Care Management',
        description: 'Enroll in case management for medication review, coordination, and benefits navigation',
        priority: 'high',
        timeframe: 'Start this month'
      });
    }

    if (frailtyScore >= 0.4 || complexityIndex >= 0.4) {
      recommendations.followUpCare.push({
        icon: <Stethoscope size={16} />,
        title: 'Comprehensive Care Review',
        description: 'Schedule a longer visit to review comorbidities, goals of care, and support needs',
        priority: 'high',
        timeframe: 'Within 1 month'
      });
    }

    if (conditions.diabetes) {
      recommendations.followUpCare.push({
        icon: <Calendar size={16} />,
        title: 'Endocrinologist Visit',
        description: 'Schedule a diabetes management review and A1c monitoring plan',
        priority: 'high',
        timeframe: 'Within 1 month'
      });

      recommendations.monitoring.push({
        icon: <Activity size={16} />,
        title: 'Diabetes Monitoring',
        description: 'Track symptoms and follow your clinician’s monitoring plan (A1c and home checks as advised)',
        priority: 'high',
        timeframe: 'Ongoing'
      });

      recommendations.emergencySigns.push({
        icon: <AlertCircle size={16} />,
        title: 'Diabetes Emergency Signs',
        description: 'Watch for extreme thirst, frequent urination, confusion, or fruity breath odor',
        priority: 'critical',
        timeframe: 'Immediate attention if symptoms occur'
      });
    }

    if (conditions.heartDisease || conditions.ischemicHeartDisease || conditions.chf) {
      recommendations.followUpCare.push({
        icon: <Stethoscope size={16} />,
        title: 'Cardiologist Consultation',
        description: 'Regular cardiac evaluation and medication review',
        priority: 'high',
        timeframe: 'Every 6 months'
      });

      recommendations.monitoring.push({
        icon: <Activity size={16} />,
        title: 'Cardiac Symptoms Monitoring',
        description: 'Track chest pain, shortness of breath, or palpitations',
        priority: 'high',
        timeframe: 'Ongoing'
      });

      recommendations.emergencySigns.push({
        icon: <AlertCircle size={16} />,
        title: 'Cardiac Emergency',
        description: 'Seek immediate care for chest pain, severe shortness of breath, or fainting',
        priority: 'critical',
        timeframe: 'Call emergency services immediately'
      });
    }

    if (conditions.ckd || conditions.kidneyDisease || conditions.esrd) {
      recommendations.followUpCare.push({
        icon: <Stethoscope size={16} />,
        title: 'Nephrology Follow-up',
        description: 'Review kidney function, medications, and diet/fluid guidance',
        priority: 'high',
        timeframe: 'Within 1 month'
      });
    }

    if (conditions.copd) {
      recommendations.followUpCare.push({
        icon: <Stethoscope size={16} />,
        title: 'Pulmonary Care Review',
        description: 'Review inhaler technique, vaccinations, and exacerbation plan',
        priority: 'medium',
        timeframe: 'Within 2 months'
      });
    }

    if (recommendations.immediateActions.length === 0) {
      recommendations.immediateActions.push({
        icon: <Stethoscope size={16} />,
        title: 'Annual Health Check-up',
        description: 'Schedule your annual preventive health examination',
        priority: 'medium',
        timeframe: 'Within 3 months'
      });
    }

    recommendations.lifestyleChanges.push({
      icon: <User size={16} />,
      title: 'Balanced Nutrition',
      description: 'Maintain a diet rich in fruits, vegetables, and whole grains',
      priority: 'low',
      timeframe: 'Ongoing'
    });

    recommendations.monitoring.push({
      icon: <Activity size={16} />,
      title: 'Weight Management',
      description: 'Monitor weight weekly and maintain healthy BMI',
      priority: 'medium',
      timeframe: 'Weekly'
    });

    return recommendations;
  };

  const recommendations = useMemo(() => {
    if (!reportData) return null;
    return generateRecommendations(reportData);
  }, [reportData]);

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

  const handleEditAssessment = () => {
    if (!reportData) return;

    sessionStorage.setItem(
      'assessmentDraft',
      JSON.stringify({
        currentStep: 1,
        assessmentData: {
          demographics: reportData.demographics,
          conditions: reportData.conditions,
          utilization: reportData.utilization,
          metrics: reportData.metrics,
          predictions: reportData.predictions
        }
      })
    );

    navigate('/assessment');
  };

  const handleSubmitAssessment = async () => {
    if (!reportData) return;

    if (!patientEmail) {
      setSubmitMessage('Please enter the patient email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const submitResult = await onSubmitAssessment({
        ...reportData,
        recipients: {
          patientEmail
        }
      });

      if (!submitResult.success) {
        setSubmitMessage('Failed to submit assessment. Please try again.');
        return;
      }

      const sendResult = await sendAssessmentReport({
        patientEmail,
        reportData
      });

      if (sendResult.success) {
        setSubmitMessage(
          `Assessment submitted and report sent successfully! ID: ${submitResult.assessmentId}`
        );
      } else {
        setSubmitMessage(
          `Assessment submitted (ID: ${submitResult.assessmentId}) but email sending failed.`
        );
      }
    } catch (error) {
      console.error(error);
      setSubmitMessage('An error occurred while submitting and sending the report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reportData) {
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
        <Button variant="ghost" onClick={handleBackToAssessment} className={pageStyles.backButton}>
          <ChevronLeft size={16} /> Back to Assessment
        </Button>

        <Card className={pageStyles.resultsCard}>
          <h2 className={pageStyles.resultsTitle}>📄 Patient Risk Report</h2>
          <p className={pageStyles.subtitle}>Risk predictions, follow-ups, and next steps</p>

          <div className={styles.reviewSection}>
            <h4 className={styles.sectionTitle}>📋 Assessment Summary</h4>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h5>👤 Demographics</h5>
                <p>Age: {reportData.demographics.age}</p>
                <p>Gender: {reportData.demographics.gender}</p>
                <p>Annual Healthcare Cost: ${reportData.demographics.annualHealthcareCost}</p>
              </div>

              <div className={styles.summaryCard}>
                <h5>🏥 Chronic Conditions</h5>
                {selectedConditions.length > 0 ? (
                  selectedConditions.map((condition) => (
                    <p key={condition}>{getConditionLabel(condition)}</p>
                  ))
                ) : (
                  <p>No chronic conditions reported</p>
                )}
              </div>

              <div className={styles.summaryCard}>
                <h5>📊 Healthcare Utilization (12 months)</h5>
                <p>Hospital Admissions: {reportData.utilization.hospitalAdmissions}</p>
                <p>Total Hospital Days: {reportData.utilization.totalHospitalDays}</p>
                <p>Days Since Last Admission: {reportData.utilization.daysSinceLastAdmission}</p>
                <p>Recent Admission (Past 30 days): {reportData.utilization.recentAdmissionPast30Days}</p>
                <p>Outpatient Visits: {reportData.utilization.outpatientVisits}</p>
                <p>High Outpatient User (&gt;12 visits): {reportData.utilization.highOutpatientUser}</p>
                <p>ER/ED Visits: {reportData.utilization.erEdVisits}</p>
                <p>Specialist Visits: {reportData.utilization.specialistVisits}</p>
              </div>

              <div className={styles.summaryCard}>
                <h5>💓 Health Metrics</h5>
                <p>Total Inpatient Cost: ${reportData.metrics.totalInpatientCost}</p>
                <p>Cost Percentile: {reportData.metrics.costPercentile}</p>
                <p>High Cost Patient (Top 20%): {reportData.metrics.highCostPatientTop20}</p>
                <p>Frailty Score: {reportData.metrics.frailtyScore}</p>
                <p>Complexity Index: {reportData.metrics.complexityIndex}</p>
              </div>
            </div>
          </div>

          <div className={styles.predictionSection}>
            <h4 className={styles.sectionTitle}>🎯 Risk Predictions</h4>

            <div className={styles.predictionGrid}>
              {Object.entries(reportData.predictions).map(([period, prediction]) => (
                <div key={period} className={styles.predictionCard}>
                  <h5>{period.charAt(0).toUpperCase() + period.slice(1)} Risk</h5>
                  <div className={styles.riskLevel}>
                    <span
                      className={`${styles.riskBadge} ${styles[prediction.riskLevel.toLowerCase()]}`}
                    >
                      {prediction.riskLevel}
                    </span>
                    <span className={styles.riskScore}>{prediction.riskScore}%</span>
                  </div>
                  <div className={styles.financialImpact}>
                    <p>
                      Cost Impact: <span className={styles.cost}>${prediction.costImpact}</span>
                    </p>
                    <p>
                      ROI Value: <span className={styles.roi}>${prediction.roiValue}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {recommendations && (
            <div className={styles.recommendationsSection}>
              <h4 className={styles.sectionTitle}>📝 Personalized Follow-up Recommendations</h4>

              {recommendations.immediateActions.length > 0 && (
                <div className={styles.recommendationCategory}>
                  <h5 className={styles.categoryTitle}>
                    <AlertCircle size={18} /> Immediate Actions Required
                  </h5>
                  <div className={styles.recommendationGrid}>
                    {recommendations.immediateActions.map((rec, index) => (
                      <div key={index} className={styles.recommendationCard}>
                        <div className={styles.recommendationHeader}>
                          <div className={styles.recommendationIcon}>{rec.icon}</div>
                          <div className={styles.recommendationTitle}>{rec.title}</div>
                          <span
                            className={styles.priorityBadge}
                            style={{ backgroundColor: getPriorityColor(rec.priority) }}
                          >
                            {getPriorityBadge(rec.priority)}
                          </span>
                        </div>
                        <p className={styles.recommendationDescription}>{rec.description}</p>
                        <div className={styles.timeframe}>
                          <Calendar size={14} />
                          {rec.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.followUpCare.length > 0 && (
                <div className={styles.recommendationCategory}>
                  <h5 className={styles.categoryTitle}>
                    <Calendar size={18} /> Scheduled Follow-up Care
                  </h5>
                  <div className={styles.recommendationGrid}>
                    {recommendations.followUpCare.map((rec, index) => (
                      <div key={index} className={styles.recommendationCard}>
                        <div className={styles.recommendationHeader}>
                          <div className={styles.recommendationIcon}>{rec.icon}</div>
                          <div className={styles.recommendationTitle}>{rec.title}</div>
                          <span
                            className={styles.priorityBadge}
                            style={{ backgroundColor: getPriorityColor(rec.priority) }}
                          >
                            {getPriorityBadge(rec.priority)}
                          </span>
                        </div>
                        <p className={styles.recommendationDescription}>{rec.description}</p>
                        <div className={styles.timeframe}>
                          <Calendar size={14} />
                          {rec.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.lifestyleChanges.length > 0 && (
                <div className={styles.recommendationCategory}>
                  <h5 className={styles.categoryTitle}>
                    <User size={18} /> Lifestyle Modifications
                  </h5>
                  <div className={styles.recommendationGrid}>
                    {recommendations.lifestyleChanges.map((rec, index) => (
                      <div key={index} className={styles.recommendationCard}>
                        <div className={styles.recommendationHeader}>
                          <div className={styles.recommendationIcon}>{rec.icon}</div>
                          <div className={styles.recommendationTitle}>{rec.title}</div>
                          <span
                            className={styles.priorityBadge}
                            style={{ backgroundColor: getPriorityColor(rec.priority) }}
                          >
                            {getPriorityBadge(rec.priority)}
                          </span>
                        </div>
                        <p className={styles.recommendationDescription}>{rec.description}</p>
                        <div className={styles.timeframe}>
                          <Calendar size={14} />
                          {rec.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.monitoring.length > 0 && (
                <div className={styles.recommendationCategory}>
                  <h5 className={styles.categoryTitle}>
                    <Activity size={18} /> Self-Monitoring Guidelines
                  </h5>
                  <div className={styles.recommendationGrid}>
                    {recommendations.monitoring.map((rec, index) => (
                      <div key={index} className={styles.recommendationCard}>
                        <div className={styles.recommendationHeader}>
                          <div className={styles.recommendationIcon}>{rec.icon}</div>
                          <div className={styles.recommendationTitle}>{rec.title}</div>
                          <span
                            className={styles.priorityBadge}
                            style={{ backgroundColor: getPriorityColor(rec.priority) }}
                          >
                            {getPriorityBadge(rec.priority)}
                          </span>
                        </div>
                        <p className={styles.recommendationDescription}>{rec.description}</p>
                        <div className={styles.timeframe}>
                          <Calendar size={14} />
                          {rec.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.emergencySigns.length > 0 && (
                <div className={styles.recommendationCategory}>
                  <h5 className={styles.categoryTitle}>
                    <AlertCircle size={18} /> ⚠️ Emergency Warning Signs
                  </h5>
                  <div className={styles.emergencyGrid}>
                    {recommendations.emergencySigns.map((rec, index) => (
                      <div key={index} className={styles.emergencyCard}>
                        <div className={styles.emergencyHeader}>
                          <div className={styles.recommendationIcon}>{rec.icon}</div>
                          <div className={styles.recommendationTitle}>{rec.title}</div>
                          <span className={styles.emergencyBadge}>CRITICAL</span>
                        </div>
                        <p className={styles.recommendationDescription}>{rec.description}</p>
                        <div className={styles.timeframe}>
                          <AlertCircle size={14} />
                          {rec.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.reviewSection}>
            <h4 className={styles.sectionTitle}>📧 Send Report</h4>
            <div className={styles.row}>
              <Input
                label="Patient Email"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@example.com"
                required
              />
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button onClick={handleSubmitAssessment} variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : '✅ Submit Assessment'}
            </Button>
            <Button onClick={handleEditAssessment} variant="secondary" disabled={isSubmitting}>
              ✏️ Edit Assessment
            </Button>
            <Button onClick={handleBackHome} variant="ghost" disabled={isSubmitting}>
              <Home size={16} /> Back Home
            </Button>
          </div>

          {submitMessage && (
            <div className={`${styles.message} ${submitMessage.includes('successfully') ? styles.success : styles.error}`}>
              {submitMessage}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AssessmentReportPage;
