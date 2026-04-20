import apiClient from './apiClient';

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data?.token) {
        localStorage.setItem('healthguard_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('healthguard_token');
      localStorage.removeItem('healthguard_user');
    } catch (error) {
      throw error;
    }
  },

  validateToken: async () => {
    try {
      const response = await apiClient.get('/auth/validate');
      return response;
    } catch (error) {
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      if (response.data?.token) {
        localStorage.setItem('healthguard_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authApi;