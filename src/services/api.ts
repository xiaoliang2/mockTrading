import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    throw error;
  }
);

export const fileAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
  
  getAll: (params?: { date?: string; startDate?: string; endDate?: string }) => 
    apiClient.get('/files', { params }),
  
  getByDate: () => apiClient.get('/files/by-date'),
  
  getById: (id) => apiClient.get(`/files/${id}`),
  
  delete: (id) => apiClient.delete(`/files/${id}`),
};

export const stockAPI = {
  create: (stocks: any[], dateTag?: Date) => 
    apiClient.post('/stocks', { stocks, dateTag }),
  
  getAll: (params?: { date?: string; startDate?: string; endDate?: string; latest?: boolean }) => 
    apiClient.get('/stocks', { params }),
  
  getByDate: () => apiClient.get('/stocks/by-date'),
  
  delete: (id) => apiClient.delete(`/stocks/${id}`),
};

export const transactionAPI = {
  create: (transaction) => apiClient.post('/transactions', transaction),
  
  getAll: (params?: { date?: string; startDate?: string; endDate?: string }) => 
    apiClient.get('/transactions', { params }),
  
  getByDate: () => apiClient.get('/transactions/by-date'),
};

export const portfolioAPI = {
  update: (data) => apiClient.post('/portfolio', data),
  
  getAll: () => apiClient.get('/portfolio'),
  
  updateQuantity: (stockCode, data) => apiClient.put(`/portfolio/${stockCode}`, data),
  
  delete: (stockCode) => apiClient.delete(`/portfolio/${stockCode}`),
};

export const dailySnapshotAPI = {
  create: (data) => apiClient.post('/daily-snapshot', data),
  
  getAll: (params?: { date?: string; startDate?: string; endDate?: string }) => 
    apiClient.get('/daily-snapshot', { params }),
};

export const statisticsAPI = {
  get: (params?: { startDate?: string; endDate?: string }) => 
    apiClient.get('/statistics', { params }),
};

export const configAPI = {
  set: (key, value) => apiClient.post('/config', { key, value }),
  
  get: (key) => apiClient.get(`/config/${key}`),
  
  getAll: () => apiClient.get('/config'),
};
