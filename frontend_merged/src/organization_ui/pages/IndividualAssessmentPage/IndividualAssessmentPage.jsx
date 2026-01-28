import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Card from '../../organizational_login/components/common/Card/Card';
import Button from '../../organizational_login/components/common/Button/Button';
import Input from '../../organizational_login/components/common/Input/Input';
import RiskGauge from '../../components/individual/RiskGauge/RiskGauge';
import styles from './IndividualAssessmentPage.module.css';

const IndividualAssessmentPage = () => {
  const navigate = useNavigate();
  const reportRef = useRef();
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    conditions: [],
    bloodPressureSys: '',
    bloodPressureDia: '',
    glucose: '',
    cholesterol: '',
    medications: '',
    hospitalStays: '',
    erVisits: '',
    doctorVisits: '',
    smoking: 'no',
    exercise: 'never',
    primaryDoctor: 'yes'
  });

  const conditions = [
    'Diabetes',
    'Heart Disease',
    'High Blood Pressure',
    'High Cholesterol',
    'COPD/Asthma',
    'Cancer',
    'Kidney Disease'
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCondition = (condition) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }));
  };

  const calculateRisk = () => {
    let riskScore = 0.2;
    
    if (parseInt(formData.age) > 65) riskScore += 0.1;
    riskScore += formData.conditions.length * 0.08;
    if (parseInt(formData.bloodPressureSys) > 140) riskScore += 0.18;
    
    const bmi = formData.weight / Math.pow(formData.height / 100, 2);
    if (bmi > 27) riskScore += 0.12;
    if (parseInt(formData.medications) >= 6) riskScore += 0.08;
    if (parseInt(formData.erVisits) >= 2) riskScore += 0.06;
    return Math.min(riskScore, 0.95);
  };

  const downloadPDF = async () => {
    try {
      const element = reportRef.current;
      if (!element) {
        alert('Error: Report not found');
        return;
      }

      // Create canvas from the HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Health_Risk_Report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };

  if (showResults) {
    const riskScore = calculateRisk();
    const bmi = (formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1);

    return (
      <div className={styles.resultsContainer}>
        <div className={styles.resultsWrapper}>
          <Button variant="ghost" onClick={() => setShowResults(false)} className={styles.backButton}>
            <ChevronLeft size={16} /> Edit Assessment
          </Button>

          <div ref={reportRef}>
            <Card className={styles.resultsCard}>
              <h2 className={styles.resultsTitle}>Your Personal Health Risk Report</h2>
              <div className={styles.reportDate}>
                Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <RiskGauge riskScore={riskScore} />

              <div className={styles.riskFactors}>
              <h3 className={styles.sectionTitle}>🎯 Your Top Risk Factors</h3>
              <div className={styles.factorList}>
                {parseInt(formData.bloodPressureSys) > 140 && (
                  <div className={styles.factor} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                    <div className={styles.factorHeader}>
                      <strong>1. 🩸 High Blood Pressure ({formData.bloodPressureSys}/{formData.bloodPressureDia})</strong>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Impact: +18%</span>
                    </div>
                    <p>Your BP is elevated. This is your biggest risk.</p>
                  </div>
                )}
                {parseFloat(bmi) > 27 && (
                  <div className={styles.factor} style={{ backgroundColor: '#fef9c3', borderColor: '#fde047' }}>
                    <div className={styles.factorHeader}>
                      <strong>2. 🍔 BMI in Overweight Range ({bmi})</strong>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Impact: +12%</span>
                    </div>
                    <p>Weight management could reduce your risk.</p>
                  </div>
                )}

                {parseInt(formData.medications) >= 6 && (
                  <div className={styles.factor} style={{ backgroundColor: '#fef9c3', borderColor: '#fde047' }}>
                    <div className={styles.factorHeader}>
                      <strong>3. 💊 Taking {formData.medications}+ Medications</strong>
                      <span style={{ color: '#ca8a04', fontWeight: 600 }}>Impact: +8%</span>
                    </div>
                    <p>Medication review recommended.</p>
                  </div>
                )}

                {parseInt(formData.erVisits) >= 2 && (
                  <div className={styles.factor} style={{ backgroundColor: '#dbeafe', borderColor: '#93c5fd' }}>
                    <div className={styles.factorHeader}>
                      <strong>4. 🏥 {formData.erVisits} ER Visits Last Year</strong>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>Impact: +6%</span>
                    </div>
                    <p>More frequent ER use indicates higher risk.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.recommendations}>
              <h3 className={styles.sectionTitle}>✅ Recommended Actions</h3>
              <div className={styles.recommendGrid}>
                <div>
                  <h4>Talk to Your Doctor About:</h4>
                  <div className={styles.checklistItems}>
                    <label><input type="checkbox" /> Blood pressure management plan</label>
                    <label><input type="checkbox" /> Medication review and simplification</label>
                    <label><input type="checkbox" /> Weight management strategies</label>
                    <label><input type="checkbox" /> Regular follow-up schedule</label>
                  </div>
                </div>
                <div>
                  <h4>Self-Care Steps:</h4>
                  <div className={styles.checklistItems}>
                    <label><input type="checkbox" /> Monitor blood pressure at home</label>
                    <label><input type="checkbox" /> Reduce salt intake (&lt;2g/day)</label>
                    <label><input type="checkbox" /> Exercise 30 min/day, 5 days/week</label>
                    <label><input type="checkbox" /> Keep medication schedule consistent</label>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.goodNews}>
              <strong>💡 Good News:</strong> If you follow these recommendations, your risk could improve to LOW (22%) within 3-6 months!
            </div>

            <div className={styles.disclaimer}>
              ⚠️ <strong>Disclaimer:</strong> This is an educational tool. Always consult your healthcare provider for medical advice.
            </div>
            </Card>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={downloadPDF}>
              <Download size={16} /> Download PDF Report
            </Button>
            <Button variant="secondary" onClick={() => {
              // Email functionality
              const mailtoLink = `mailto:?subject=My Health Risk Assessment&body=Please find my health risk assessment attached. My risk score is ${(calculateRisk() * 100).toFixed(1)}%.`;
              window.location.href = mailtoLink;
            }}>
              📧 Email to Doctor
            </Button>
            <Button variant="secondary" onClick={() => setShowResults(false)}>
              Edit Assessment
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Button variant="ghost" onClick={() => navigate('/')} className={styles.backButton}>
          <ChevronLeft size={16} /> Back to Home
        </Button>

        <Card className={styles.card}>
          <h2 className={styles.title}>🩺 Personal Health Risk Assessment</h2>
          <p className={styles.subtitle}>Complete this assessment to understand your health risks</p>
          <div className={styles.info}>
            ℹ️ This tool helps you understand potential health risks. Share results with your doctor for personalized care.
          </div>

          <div className={styles.form}>
            {/* Basic Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📋 Basic Information</h3>
              <div className={styles.sectionContent}>
                <div className={styles.row}>
                  <Input
                    label="Age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateFormData('age', e.target.value)}
                    placeholder="Enter your age"
                    required
                  />
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Gender:</label>
                    <div className={styles.radios}>
                      <label className={styles.radio}>
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={(e) => updateFormData('gender', e.target.value)}
                        />
                        <span>Male</span>
                      </label>
                      <label className={styles.radio}>
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={(e) => updateFormData('gender', e.target.value)}
                        />
                        <span>Female</span>
                      </label>
                      <label className={styles.radio}>
                        <input
                          type="radio"
                          name="gender"
                          value="other"
                          checked={formData.gender === 'other'}
                          onChange={(e) => updateFormData('gender', e.target.value)}
                        />
                        <span>Other</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className={styles.row}>
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateFormData('height', e.target.value)}
                    placeholder="Enter height in cm"
                    required
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateFormData('weight', e.target.value)}
                    placeholder="Enter weight in kg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🏥 Medical History</h3>
              <div className={styles.sectionContent}>
                <label className={styles.label}>Do you have any of these conditions?</label>
                <div className={styles.checkboxGroup}>
                  {conditions.map(condition => (
                    <label key={condition} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={formData.conditions.includes(condition)}
                        onChange={() => toggleCondition(condition)}
                      />
                      <span>{condition}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Health Measurements */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📊 Recent Health Measurements</h3>
              <div className={styles.sectionContent}>
                <div className={styles.row}>
                  <Input
                    label="Blood Pressure (Systolic)"
                    type="number"
                    value={formData.bloodPressureSys}
                    onChange={(e) => updateFormData('bloodPressureSys', e.target.value)}
                    placeholder="120"
                  />
                  <Input
                    label="Blood Pressure (Diastolic)"
                    type="number"
                    value={formData.bloodPressureDia}
                    onChange={(e) => updateFormData('bloodPressureDia', e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div className={styles.row}>
                  <Input
                    label="Blood Glucose (mg/dL)"
                    type="number"
                    value={formData.glucose}
                    onChange={(e) => updateFormData('glucose', e.target.value)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Cholesterol (mg/dL)"
                    type="number"
                    value={formData.cholesterol}
                    onChange={(e) => updateFormData('cholesterol', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <Input
                  label="Number of Medications"
                  type="number"
                  value={formData.medications}
                  onChange={(e) => updateFormData('medications', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Healthcare Utilization */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🏨 Healthcare Utilization (Last 12 Months)</h3>
              <div className={styles.sectionContent}>
                <div className={styles.row}>
                  <Input
                    label="Hospital stays"
                    type="number"
                    value={formData.hospitalStays}
                    onChange={(e) => updateFormData('hospitalStays', e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="ER visits"
                    type="number"
                    value={formData.erVisits}
                    onChange={(e) => updateFormData('erVisits', e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Doctor appointments"
                    type="number"
                    value={formData.doctorVisits}
                    onChange={(e) => updateFormData('doctorVisits', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🏃 Lifestyle</h3>
              <div className={styles.sectionContent}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Do you smoke?</label>
                  <div className={styles.radios}>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="smoking"
                        value="yes"
                        checked={formData.smoking === 'yes'}
                        onChange={(e) => updateFormData('smoking', e.target.value)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="smoking"
                        value="no"
                        checked={formData.smoking === 'no'}
                        onChange={(e) => updateFormData('smoking', e.target.value)}
                      />
                      <span>No</span>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="smoking"
                        value="former"
                        checked={formData.smoking === 'former'}
                        onChange={(e) => updateFormData('smoking', e.target.value)}
                      />
                      <span>Former</span>
                    </label>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Exercise frequency:</label>
                  <select
                    value={formData.exercise}
                    onChange={(e) => updateFormData('exercise', e.target.value)}
                    className={styles.select}
                  >
                    <option value="never">Never</option>
                    <option value="rarely">Rarely (1-2 times/month)</option>
                    <option value="sometimes">Sometimes (1-2 times/week)</option>
                    <option value="regularly">Regularly (3-4 times/week)</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Do you have a primary doctor?</label>
                  <div className={styles.radios}>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="primaryDoctor"
                        value="yes"
                        checked={formData.primaryDoctor === 'yes'}
                        onChange={(e) => updateFormData('primaryDoctor', e.target.value)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="primaryDoctor"
                        value="no"
                        checked={formData.primaryDoctor === 'no'}
                        onChange={(e) => updateFormData('primaryDoctor', e.target.value)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.navigation}>
            <Button variant="secondary" onClick={() => navigate('/')}>
              <ChevronLeft size={16} /> Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowResults(true)}>
              Calculate My Risk
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IndividualAssessmentPage;
              