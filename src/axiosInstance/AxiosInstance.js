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

// Custom API Client (for your enhanced endpoints)
const customApiClient = axios.create({
  baseURL: 'https://ipos.ma/fide/custom_api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  params: {
    v: 2,  // Always use version 2
    form: 'mobile'  // Default form parameter
  }
});

// Add request interceptor to ensure v=2 and form=mobile parameters are always included
customApiClient.interceptors.request.use((config) => {
  // Ensure v=2 and form=mobile are always in the URL
  if (!config.params) {
    config.params = {};
  }
  config.params.v = 2;
  config.params.form = 'mobile';
  return config;
});

// Add response interceptor for better error handling - Standard API
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Standard API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling - Custom API
customApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Custom API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Standard API client (for existing Dolibarr endpoints)
export default apiClient;

// Custom API client (for enhanced endpoints like products, orders, etc.)
export { customApiClient };