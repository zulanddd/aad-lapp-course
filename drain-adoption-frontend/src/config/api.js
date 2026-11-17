const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080';
export const getApiUrl = endpoint => `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/'+endpoint}`;
export const isProduction = () => process.env.NODE_ENV === 'production';
export default API_BASE_URL;
