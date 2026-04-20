import apiClient from './apiClient';

export const membersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/members', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (memberId) => {
    try {
      const response = await apiClient.get(`/members/${memberId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getHighRisk: async (threshold = 0.6) => {
    try {
      const response = await apiClient.get('/members/high-risk', {
        params: { threshold }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMember: async (memberId, data) => {
    try {
      const response = await apiClient.put(`/members/${memberId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  assignCareTeam: async (memberId, careTeamId) => {
    try {
      const response = await apiClient.post(`/members/${memberId}/assign-care-team`, {
        careTeamId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markContacted: async (memberId, notes) => {
    try {
      const response = await apiClient.post(`/members/${memberId}/contact`, {
        notes,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default membersApi;