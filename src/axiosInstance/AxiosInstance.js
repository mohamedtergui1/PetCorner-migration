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


// Standard API client (for existing Dolibarr endpoints)
export default apiClient;
