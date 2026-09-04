import axios from "axios";

axios.defaults.baseURL =
  process.env.REACT_APP_API_URL ||
  'https://mvu07ybpnj.execute-api.us-west-2.amazonaws.com';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use((response) => {
  return response;
}, function (error) {
  const authError = error.response?.status === 401;
  const reqUrl = String(error.config?.url || '');
  const isPublicApi = reqUrl.includes('/public/');
  if (authError && !isPublicApi) {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
export default axios;