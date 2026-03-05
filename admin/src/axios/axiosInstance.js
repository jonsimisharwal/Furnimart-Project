// axiosInstance.js
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No valid token found for request:', config.url);
    }

    console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    const url = error.config?.url;
    const status = error.response?.status;
    
    console.error('❌ Response error:', {
      url,
      method: error.config?.method,
      status,
      data: error.response?.data
    });

    // Handle 401 - unauthorized
    if (status === 401) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new CustomEvent('admin-unauthorized'));
      window.location.href = '/admin/login';
    }

    // Handle 403 - forbidden
    if (status === 403) {
      console.error('❌ Forbidden: You do not have permission to access this resource.');
    }

    // Handle 500 - server error
    if (status === 500) {
      console.error('❌ Internal server error. Please try again later.');
    }

    // Create user-friendly error
    const customError = new Error();
    
    if (error.response) {
      customError.message = error.response.data?.message || `Server error: ${status}`;
      customError.status = status;
    } else if (error.request) {
      customError.message = 'Unable to connect to server. Please check your connection.';
    } else {
      customError.message = error.message || 'An unexpected error occurred';
    }
    
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

export default api;s