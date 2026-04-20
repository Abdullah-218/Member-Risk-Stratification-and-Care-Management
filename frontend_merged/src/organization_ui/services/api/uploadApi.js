import apiClient from './apiClient';

export const uploadApi = {
  uploadCSV: async (file, config) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));

      const response = await apiClient.post('/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUploadStatus: async (uploadId) => {
    try {
      const response = await apiClient.get(`/upload/status/${uploadId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  validateCSV: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/upload/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  downloadTemplate: () => {
    window.open(`${apiClient.defaults.baseURL}/upload/template`, '_blank');
  }
};

export default uploadApi;