// src/utils/api.js
import axios from 'axios';

// Render पर डिप्लॉयमेंट के बाद, Render आपको एक URL देगा
// जो https://your-backend-service.onrender.com जैसा दिखेगा।
// उस URL को VITE_API_URL के रूप में Render पर सेट किया जाएगा।
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005'; // लोकल डेवलपमेंट के लिए फॉलबैक

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;