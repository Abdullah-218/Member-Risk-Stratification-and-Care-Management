export const shapExplainer = {
  calculateSHAPValues: (memberData, riskScore) => {
    const baseRisk = 0.3;
    const factors = [];

    // Age factor
    if (memberData.age > 65) {
      const impact = (memberData.age - 65) * 0.005;
      factors.push({
        factor: `Age ${memberData.age}`,
        impact: Math.min(impact, 0.15)
      });
    }

    // Conditions
    if (memberData.conditions && memberData.conditions.length > 0) {
      const primaryConditions = memberData.conditions.slice(0, 2).join(' + ');
      factors.push({
        factor: primaryConditions,
        impact: memberData.conditions.length * 0.08
      });
    }

    // ED Visits
    if (memberData.edVisits > 0) {
      factors.push({
        factor: `${memberData.edVisits} ED visits in last 90 days`,
        impact: Math.min(memberData.edVisits * 0.07, 0.28)
      });
    }

    // Medications (Polypharmacy)
    if (memberData.medications >= 5) {
      factors.push({
        factor: `Age ${memberData.age} + Polypharmacy`,
        impact: 0.06 + (memberData.medications - 5) * 0.02
      });
    }

    // BMI
    if (memberData.bmi > 30) {
      factors.push({
        factor: `BMI ${memberData.bmi.toFixed(1)}`,
        impact: (memberData.bmi - 30) * 0.01
      });
    }

    // Blood Pressure
    if (memberData.systolicBP > 140) {
      factors.push({
        factor: `High BP (${memberData.systolicBP}/${memberData.diastolicBP})`,
        impact: (memberData.systolicBP - 140) * 0.005
      });
    }

    // Glucose
    if (memberData.glucose > 150) {
      factors.push({
        factor: `High Glucose (${memberData.glucose})`,
        impact: (memberData.glucose - 150) * 0.0008
      });
    }

    // Sort by impact
    factors.sort((a, b) => b.impact - a.impact);

    // Take top 5
    return factors.slice(0, 5);
  },

  generateExplanation: (memberData, riskScore) => {
    const shapValues = shapExplainer.calculateSHAPValues(memberData, riskScore);
    
    const factorList = shapValues.filter(v => v && v.factor).slice(0, 2).map(v => v.factor);
    const primaryFactors = factorList.length >= 2 
      ? `${factorList[0]} and ${factorList[1]}` 
      : factorList[0] || 'unknown factors';
    
    return {
      baseRisk: 0.3,
      factors: shapValues,
      finalRisk: riskScore,
      summary: `This member has a ${(riskScore * 100).toFixed(0)}% risk score. The primary contributors are ${primaryFactors}.`
    };
  }
};
export const explainRisk = (riskFactors) => {
  return shapExplainer.explainRisk(riskFactors);
};
export default shapExplainer;