import axios from 'axios';
import Token from '../../config/TokenDolibar';

// Standard Dolibarr API Client
const apiClient = axios.create({
  baseURL: 'https://ipos.ma/fide/api/index.php',
  headers: {
    'DOLAPIKEY': Token,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor to log URLs with query parameters
apiClient.interceptors.request.use(
  (config) => {
    // Build the base URL
    let fullUrl = `${config.baseURL}${config.url || ''}`;
    
    // Add query parameters if they exist
    if (config.params) {
      const queryString = new URLSearchParams(config.params).toString();
      fullUrl += `?${queryString}`;
    }
    
    console.log('🌐 API Request:', {
      method: config.method?.toUpperCase(),
      url: fullUrl,  // Now includes query parameters
      params: config.params,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling - Standard API
apiClient.interceptors.response.use(
  (response) => {
    // Reconstruct the URL with query parameters for response logging
    let fullUrl = `${response.config.baseURL}${response.config.url || ''}`;
    if (response.config.params) {
      const queryString = new URLSearchParams(response.config.params).toString();
      fullUrl += `?${queryString}`;
    }
    
    console.log('✅ API Response:', {
      url: fullUrl,  // Now includes query parameters
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    // Reconstruct the URL with query parameters for error logging
    let fullUrl = '';
    if (error.config) {
      fullUrl = `${error.config.baseURL}${error.config.url || ''}`;
      if (error.config.params) {
        const queryString = new URLSearchParams(error.config.params).toString();
        fullUrl += `?${queryString}`;
      }
    }
    
    console.error('❌ Standard API Error:', {
      url: fullUrl,  // Now includes query parameters
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Standard API client (for existing Dolibarr endpoints)
export default apiClient;