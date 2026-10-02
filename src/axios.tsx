import axios from "axios";

// У проді фронтенд і API мають один origin: Cloudflare Pages направляє шляхи
// з public/_routes.json у функцію, а та — у Lambda (edge/proxy.mjs); решта —
// статика Pages. Порожній baseURL дає відносні
// запити, тому CORS і абсолютний хост API не потрібні.
// Локальна розробка задає REACT_APP_API_URL (див. env.example).
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

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