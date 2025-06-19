import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle rate limiting gracefully
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, request will be retried later');
      // Don't throw the error for rate limiting, let the component handle it gracefully
      return Promise.resolve({ data: null, status: 429 });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Authentication error:', error.response.status);
      // Let the component handle authentication errors
    }
    
    // For other errors, log them but don't break the app
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api; 