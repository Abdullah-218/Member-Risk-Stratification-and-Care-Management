import apiClient from './apiClient';

export const interventionApi = {
  getROIMetrics: async (timeRange = '90d') => {
    try {
      const response = await apiClient.get('/interventions/roi', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getInterventionEffectiveness: async () => {
    try {
      const response = await apiClient.get('/interventions/effectiveness');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRiskTransitions: async (timeRange = '90d') => {
    try {
      const response = await apiClient.get('/interventions/transitions', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createCarePlan: async (memberId, planData) => {
    try {
      const response = await apiClient.post(`/interventions/care-plan/${memberId}`, planData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateIntervention: async (interventionId, data) => {
    try {
      const response = await apiClient.put(`/interventions/${interventionId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default interventionApi;