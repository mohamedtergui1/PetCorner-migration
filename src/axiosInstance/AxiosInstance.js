import axios from 'axios';
import Token from '../../config/TokenDolibar';

const apiClient = axios.create({
  baseURL: 'https://ipos.ma/fide/api/index.php',
  headers: {
     'DOLAPIKEY' : Token,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default apiClient;