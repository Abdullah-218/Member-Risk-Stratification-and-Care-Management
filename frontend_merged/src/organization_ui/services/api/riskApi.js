import apiClient from './apiClient';

export const riskApi = {
  calculateRisk: async (memberData) => {
    try {
      const response = await apiClient.post('/risk/calculate', memberData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkRiskAssessment: async (members, config) => {
    try {
      const response = await apiClient.post('/risk/bulk-assessment', {
        members,
        config
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRiskExplanation: async (memberId) => {
    try {
      const response = await apiClient.get(`/risk/explanation/${memberId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRiskTrends: async (timeRange = '90d') => {
    try {
      const response = await apiClient.get('/risk/trends', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRiskDistribution: async () => {
    try {
      const response = await apiClient.get('/risk/distribution');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default riskApi;