import axios from 'axios';
import Token from '../../config/TokenDolibar';

const API_BASE_URL =  process.env.API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'DOLAPIKEY': Token,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    let fullUrl = `${config.baseURL}${config.url || ''}`;
    
    if (config.params) {
      const queryString = new URLSearchParams(config.params).toString();
      fullUrl += `?${queryString}`;
    }
    
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

apiClient.interceptors.response.use(
  (response) => {
    let fullUrl = `${response.config.baseURL}${response.config.url || ''}`;
    if (response.config.params) {
      const queryString = new URLSearchParams(response.config.params).toString();
      fullUrl += `?${queryString}`;
    }
    
    console.log('✅ API Response:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText
    });
    
    return response;
  },
  (error) => {
    let fullUrl = '';
    if (error.config) {
      fullUrl = `${error.config.baseURL}${error.config.url || ''}`;
      if (error.config.params) {
        const queryString = new URLSearchParams(error.config.params).toString();
        fullUrl += `?${queryString}`;
      }
    }
    
    console.error('❌ Standard API Error:', {
      url: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

export const apiMethods = {
  getFromBase: (params = {}) => {
    return apiClient.get('', { params });
  },
  
  postToBase: (data = {}, params = {}) => {
    return apiClient.post('', data, { params });
  },
  
  putToBase: (data = {}, params = {}) => {
    return apiClient.put('', data, { params });
  },
  
  deleteFromBase: (params = {}) => {
    return apiClient.delete('', { params });
  },
  
  requestFromBase: (config = {}) => {
    return apiClient.request({
      url: '',
      ...config
    });
  }
};

export { API_BASE_URL };

export default apiClient;