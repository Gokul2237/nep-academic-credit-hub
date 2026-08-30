
import api from './api';

export const studentService = {
  getStudents: async () => {
    // api.js already returns response.data
    const response = await api.get('/students');

    return response;
  },

  getStudent: async (id) => {
    // api.js already returns response.data
    const response = await api.get(`/students/${id}`);

    return response;
  },
};

export default studentService;
