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

// Add request interceptor to log URLs
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url || ''}`;
    console.log('🌐 API Request:', {
      method: config.method?.toUpperCase(),
      url: fullUrl,
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
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    console.error('❌ Standard API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Standard API client (for existing Dolibarr endpoints)
export default apiClient;