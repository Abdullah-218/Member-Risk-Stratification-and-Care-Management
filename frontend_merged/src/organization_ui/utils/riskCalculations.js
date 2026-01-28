import { RISK_TIERS } from './constants';export const getRiskTier = (score) => {
if (score >= RISK_TIERS.VERY_HIGH.threshold) return RISK_TIERS.VERY_HIGH;
if (score >= RISK_TIERS.HIGH.threshold) return RISK_TIERS.HIGH;
if (score >= RISK_TIERS.MEDIUM.threshold) return RISK_TIERS.MEDIUM;
if (score >= RISK_TIERS.LOW.threshold) return RISK_TIERS.LOW;
return RISK_TIERS.VERY_LOW;
};export const calculateBMI = (weightKg, heightCm) => {
const heightM = heightCm / 100;
return weightKg / (heightM * heightM);
};export const getBMICategory = (bmi) => {
if (bmi < 18.5) return 'Underweight';
if (bmi < 25) return 'Normal';
if (bmi < 30) return 'Overweight';
if (bmi < 35) return 'Obese Class I';
if (bmi < 40) return 'Obese Class II';
return 'Obese Class III';
};
export const getBloodPressureCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if (systolic < 140 || diastolic < 90) return 'Hypertension Stage 1';
  if (systolic < 180 || diastolic < 120) return 'Hypertension Stage 2';
  return 'Hypertensive Crisis';
};

export const calculateRiskReduction = (currentScore, interventions = []) => {
  let reduction = 0;
  
  interventions.forEach(intervention => {
    switch (intervention) {
      case 'diabetes_mgmt':
        reduction += 0.15;
        break;
      case 'care_coord':
        reduction += 0.12;
        break;
      case 'med_recon':
        reduction += 0.08;
        break;
      case 'home_health':
        reduction += 0.10;
        break;
      case 'telehealth':
        reduction += 0.07;
        break;
      default:
        reduction += 0.05;
    }
  });
  const newScore = Math.max(currentScore - reduction, 0.1);
  return {
    currentScore,
    newScore,
    reduction,
    percentageImprovement: ((reduction / currentScore) * 100).toFixed(0)
  };
};

export const estimateCostSavings = (currentCost, riskReduction) => {
  const savingsPercentage = riskReduction * 0.4; // 40% cost reduction per unit risk reduction
  return currentCost * savingsPercentage;
};

export default {
  getRiskTier,
  calculateBMI,
  getBMICategory,
  getBloodPressureCategory,
  calculateRiskReduction,
  estimateCostSavings
};