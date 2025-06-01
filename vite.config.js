// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // पुराने प्रॉक्सी और ngrok से संबंधित लाइनों को हटा दें या कमेंट करें
    // proxy: {
    //   '/api': 'http://localhost:5005',
    // },
    // allowedHosts: [allowedNgrokHost]
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  // VITE_API_URL को एक्सेस करने के लिए environment variables को एक्सपोज़ करें
  // यह सुनिश्चित करता है कि फ्रंटएंड कोड में process.env.VITE_API_URL उपलब्ध हो
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  }
});