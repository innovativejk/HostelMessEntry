// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // <-- This line should be updated
  withCredentials: true,
});

export default api;