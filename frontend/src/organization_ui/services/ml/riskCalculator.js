export const riskCalculator = {
  calculateBaseRisk: (age, gender) => {
    let baseRisk = 0.2;
    
    if (age > 75) baseRisk += 0.15;
    else if (age > 65) baseRisk += 0.10;
    else if (age > 55) baseRisk += 0.05;
    
    return baseRisk;
  },

  calculateConditionRisk: (conditions) => {
    const riskWeights = {
      'Diabetes Type 2': 0.15,
      'Diabetes': 0.15,
      'CHF': 0.18,
      'Heart Disease': 0.18,
      'COPD': 0.12,
      'CKD': 0.14,
      'Kidney Disease': 0.14,
      'Hypertension': 0.08,
      'High Blood Pressure': 0.08,
      'Cancer': 0.10,
      'High Cholesterol': 0.05
    };

    let risk = 0;
    conditions.forEach(condition => {
      risk += riskWeights[condition] || 0.05;
    });

    // Comorbidity multiplier
    if (conditions.length >= 3) {
      risk *= 1.3;
    } else if (conditions.length === 2) {
      risk *= 1.15;
    }

    return risk;
  },

  calculateUtilizationRisk: (edVisits, hospitalizations) => {
    let risk = 0;
    
    // ED visits
    if (edVisits >= 4) risk += 0.20;
    else if (edVisits >= 2) risk += 0.12;
    else if (edVisits >= 1) risk += 0.06;
    
    // Hospitalizations
    if (hospitalizations >= 3) risk += 0.25;
    else if (hospitalizations >= 2) risk += 0.15;
    else if (hospitalizations >= 1) risk += 0.08;
    
    return risk;
  },

  calculateMedicationRisk: (medicationCount) => {
    if (medicationCount >= 10) return 0.12;
    if (medicationCount >= 7) return 0.09;
    if (medicationCount >= 5) return 0.06;
    if (medicationCount >= 3) return 0.03;
    return 0;
  },

  calculateVitalRisk: (bmi, systolicBP, glucose, cholesterol) => {
    let risk = 0;
    
    // BMI
    if (bmi >= 35) risk += 0.10;
    else if (bmi >= 30) risk += 0.07;
    else if (bmi >= 27) risk += 0.04;
    
    // Blood Pressure
    if (systolicBP >= 160) risk += 0.12;
    else if (systolicBP >= 140) risk += 0.08;
    else if (systolicBP >= 130) risk += 0.04;
    
    // Glucose
    if (glucose >= 200) risk += 0.10;
    else if (glucose >= 150) risk += 0.06;
    else if (glucose >= 126) risk += 0.03;
    
    // Cholesterol
    if (cholesterol >= 240) risk += 0.06;
    else if (cholesterol >= 200) risk += 0.03;
    
    return risk;
  },

  calculateOverallRisk: (memberData) => {
    const {
      age,
      gender,
      conditions = [],
      edVisits = 0,
      hospitalizations = 0,
      medications = 0,
      bmi = 25,
      systolicBP = 120,
      glucose = 100,
      cholesterol = 180
    } = memberData;

    let totalRisk = 0;

    totalRisk += riskCalculator.calculateBaseRisk(age, gender);
    totalRisk += riskCalculator.calculateConditionRisk(conditions);
    totalRisk += riskCalculator.calculateUtilizationRisk(edVisits, hospitalizations);
    totalRisk += riskCalculator.calculateMedicationRisk(medications);
    totalRisk += riskCalculator.calculateVitalRisk(bmi, systolicBP, glucose, cholesterol);

    // Cap at 0.95
    return Math.min(totalRisk, 0.95);
  },

  predictCost: (riskScore) => {
    const baseCost = 15000;
    const riskMultiplier = 1 + (riskScore * 4);
    return Math.round(baseCost * riskMultiplier);
  }
};
export const calculateRisk = (member) => {
  const baseRisk = riskCalculator.calculateBaseRisk(
    member.age,
    member.gender
  );

  const conditionRisk = riskCalculator.calculateConditionRisk(
    member.conditions || []
  );

  return Math.min(baseRisk + conditionRisk, 1);
};

export default riskCalculator;