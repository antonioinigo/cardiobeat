import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

axios.defaults.baseURL = apiBaseUrl;
axios.defaults.timeout = 15000;
axios.defaults.headers.common.Accept = 'application/json';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers = {
      ...config.headers,
      'X-Access-Token': config.headers?.['X-Access-Token'] || token,
    };

    if (!config.headers?.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const requestHeaders = error?.config?.headers || {};
    const hadAuthHeader = Boolean(requestHeaders.Authorization || requestHeaders.authorization);
    const hasStoredToken = Boolean(localStorage.getItem('token'));
    const isAuthEndpoint = requestUrl.includes('/api/auth/login')
      || requestUrl.includes('/api/auth/register')
      || requestUrl.includes('/api/auth/verify-email')
      || requestUrl.includes('/api/auth/password/forgot')
      || requestUrl.includes('/api/auth/password/reset');

    if ((status === 401 || status === 403) && !isAuthEndpoint && (hadAuthHeader || hasStoredToken)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common.Authorization;

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default axios;