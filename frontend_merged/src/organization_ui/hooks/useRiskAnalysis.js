import { useState, useCallback } from 'react';
import { riskCalculator } from '../services/ml/riskCalculator';
import { shapExplainer } from '../services/ml/shapExplainer';

export const useRiskAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeRisk = useCallback(async (memberData) => {
    setLoading(true);
    setError(null);

    try {
      // Calculate risk score
      const riskScore = riskCalculator.calculateOverallRisk(memberData);
      
      // Generate SHAP explanation
      const explanation = shapExplainer.generateExplanation(memberData, riskScore);
      
      // Predict cost
      const estimatedCost = riskCalculator.predictCost(riskScore);

      setLoading(false);
      
      return {
        riskScore,
        explanation,
        estimatedCost,
        riskTier: getRiskTier(riskScore)
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getRiskTier = (score) => {
    if (score >= 0.8) return { level: 5, label: 'Very High' };
    if (score >= 0.6) return { level: 4, label: 'High' };
    if (score >= 0.4) return { level: 3, label: 'Medium' };
    if (score >= 0.2) return { level: 2, label: 'Low' };
    return { level: 1, label: 'Very Low' };
  };

  return {
    analyzeRisk,
    loading,
    error
  };
};

export default useRiskAnalysis;