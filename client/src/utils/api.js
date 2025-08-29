import axios from 'axios';

// Determine the API base URL based on environment
let API_BASE;

if (process.env.NODE_ENV === 'production') {
  // In production, use the production URL from environment variable
  API_BASE = process.env.REACT_APP_API_BASE || 'https://pco-arrivals-billboard.onrender.com/api';
} else if (process.env.NODE_ENV === 'development') {
  // In development, use localhost from .env.development
  API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';
} else {
  // For other environments (staging, etc.), use staging URL
  API_BASE = process.env.REACT_APP_API_BASE || 'https://pco-arrivals-billboard.onrender.com/api';
}

console.log('Environment:', process.env.NODE_ENV);
console.log('API Base URL:', API_BASE);
console.log('REACT_APP_API_BASE env var:', process.env.REACT_APP_API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Add request interceptor for debugging and authentication
api.interceptors.request.use(
  (config) => {
    // Add API key and user ID to headers if available
    const apiKey = localStorage.getItem('pco_api_key');
    const userId = localStorage.getItem('pco_user_id');
    
    if (apiKey && userId) {
      config.headers['X-API-Key'] = apiKey;
      config.headers['X-User-ID'] = userId;
      console.log('🔑 API Request: Adding API key and user ID to headers');
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      hasApiKey: !!apiKey,
      hasUserId: !!userId
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message
    });
    
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