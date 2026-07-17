import axios from 'axios';

const API_URL = 'https://1c6e-45-250-226-97.ngrok-free.app';

export const login = (email, password) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

export const reportPothole = (data) => {
  return axios.post(`${API_URL}/api/reports`, data);
};

export const getPotholes = (reportedBy, status) => {
  const params = {};
  if (reportedBy) {
    params.reportedBy = reportedBy;
  }
  if (status) {
    params.status = status;
  }
  return axios.get(`${API_URL}/api/reports`, { params });
};
