// src/utils/api.js
import axios from 'axios';

// Render पर डिप्लॉयमेंट के बाद, Render आपको एक URL देगा
// जो https://your-backend-service.onrender.com जैसा दिखेगा।
// उस URL को VITE_API_URL के रूप में Render पर सेट किया जाएगा।
// सुनिश्चित करें कि VITE_API_URL में /api सफ़िक्स शामिल नहीं है।
// baseURL में /api जोड़ें
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005'; // लोकल डेवलपमेंट के लिए फॉलबैक

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // <-- /api यहाँ जोड़ा गया है
  withCredentials: true,
});

export default api;