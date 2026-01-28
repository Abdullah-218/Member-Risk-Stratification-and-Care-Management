// ml (inside services)
// ml (inside services)
import { riskCalculator, calculateRisk } from "./ml/riskCalculator";
import { shapExplainer, explainRisk } from "./ml/shapExplainer";

// utils (src/utils)
import { getRiskTier } from "../utils/riskCalculations";

export const generateMockMembers = (count = 100) => {
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Donald', 'Lisa', 'Matthew', 'Betty', 'Mark', 'Margaret', 'John', 'Sandra', 'Steven', 'Ashley', 'Paul'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Perez', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
  const conditions = ['Diabetes Type 2', 'CHF', 'Hypertension', 'COPD', 'CKD', 'Cancer'];
  const departments = ['Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 'Pulmonology', 'Nephrology'];
  const members = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
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
    const department = departments[Math.floor(Math.random() * departments.length)];
    const memberData = {
      name,
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
      medications,
      department
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