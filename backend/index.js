import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import staffRoutes from './routes/staff.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { getActiveMeal } from './controllers/student/dashboard.controller.js';
import * as logger from './utils/logger.js';
import path from 'path'; // path मॉड्यूल इंपोर्ट करें
import { fileURLToPath } from 'url'; // ESM में __dirname के लिए
import { dirname } from 'path'; // ESM में __dirname के लिए

dotenv.config();

const app = express();

// ESM में __dirname प्राप्त करने का तरीका
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// --- फ्रंटएंड स्टैटिक फ़ाइलों को परोसने के लिए ---
// 'frontend/dist' वह फ़ोल्डर है जहाँ Vite बिल्ड आउटपुट करता है
// सुनिश्चित करें कि यह आपके API राउट्स से पहले आता है
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist'))); // <--- यह लाइन जोड़ें

// आपके API राउट्स
app.get('/api/general/active-meal', getActiveMeal);
logger.info('General API route /api/general/active-meal initialized.');

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
logger.info('All modular routes initialized.');

// --- SPA फॉलबैक के लिए ---
// सभी अनिर्धारित राउट्स के लिए index.html पर फॉलबैक
// यह सुनिश्चित करने के लिए कि आपकी React Router-based SPA राउटिंग काम करे
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error caught by global error handler:', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'N/A'
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  logger.error('Failed to connect to the database or start server:', error);
  process.exit(1);
});