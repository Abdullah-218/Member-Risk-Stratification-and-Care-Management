import { riskCalculator } from '../services/ml/riskCalculator';
import { shapExplainer } from '../services/ml/shapExplainer';
import { getRiskTier } from './riskCalculations';

export const generateMockMembers = (count = 100) => {
  const conditions = ['Diabetes Type 2', 'CHF', 'Hypertension', 'COPD', 'CKD', 'Cancer'];
  const members = [];
  
  for (let i = 0; i < count; i++) {
    const age = 60 + Math.floor(Math.random() * 20);
    const gender = Math.random() > 0.5 ? 'F' : 'M';
    const bmi = 22 + Math.random() * 18;
    const systolicBP = 110 + Math.floor(Math.random() * 50);
    const diastolicBP = 70 + Math.floor(Math.random() * 30);
    const glucose = 90 + Math.floor(Math.random() * 130);
    const cholesterol = 160 + Math.floor(Math.random() * 100);
    const memberConditions = conditions.slice(0, Math.floor(Math.random() * 4));
    const edVisits = Math.floor(Math.random() * 6);
    const hospitalizations = Math.floor(Math.random() * 3);
    const medications = 3 + Math.floor(Math.random() * 10);
    const memberData = {
      age,
      gender,
      bmi,
      systolicBP,
      diastolicBP,
      glucose,
      cholesterol,
      conditions: memberConditions,
      edVisits,
      hospitalizations,
      medications
    };

    const riskScore = riskCalculator.calculateOverallRisk(memberData);
    const riskFactors = shapExplainer.calculateSHAPValues(memberData, riskScore);
    const estimatedCost = riskCalculator.predictCost(riskScore);
    
    members.push({
      id: `M-${8000 + i}`,
      ...memberData,
      riskScore,
      riskTier: getRiskTier(riskScore),
      estimatedCost,
      riskFactors
    });
  }
  
  return members.sort((a, b) => b.riskScore - a.riskScore);
};
export default generateMockMembers;