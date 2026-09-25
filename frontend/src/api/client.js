import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or unauthorized and not already on auth pages, logout
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
};

// Tickets endpoints
export const ticketsApi = {
  getAll: (params) => apiClient.get('/tickets', { params }),
  getById: (id) => apiClient.get(`/tickets/${id}`),
  create: (ticketData) => apiClient.post('/tickets', ticketData),
  update: (id, updateData) => apiClient.put(`/tickets/${id}`, updateData),
  delete: (id) => apiClient.delete(`/tickets/${id}`),
  getStats: () => apiClient.get('/tickets/stats'),
  getComments: (id) => apiClient.get(`/tickets/${id}/comments`),
  addComment: (id, commentData) => apiClient.post(`/tickets/${id}/comments`, commentData),
};

// Users endpoints (Agents)
export const usersApi = {
  getAgents: () => apiClient.get('/users?role=agent'),
};

export default apiClient;
