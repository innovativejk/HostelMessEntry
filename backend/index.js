// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import staffRoutes from './routes/staff.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { getActiveMeal } from './controllers/student/dashboard.controller.js';
import * as logger from './utils/logger.js';

dotenv.config();

const app = express();

// Ensure FRONTEND_URL is correctly set on Render for backend service
app.use(cors({
  origin: process.env.FRONTEND_URL, // <--- यह ठीक है, बशर्ते Render पर Variable सही हो
  credentials: true,
}));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendBuildPath = path.join(__dirname, '..', 'dist'); // assuming frontend's dist is one level up

app.use(express.static(frontendBuildPath)); // Serve static files from the 'dist' folder

app.get('/api/general/active-meal', getActiveMeal);
logger.info('General API route /api/general/active-meal initialized.');

app.use('/api/auth', authRoutes); // API routes starting with /api
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
logger.info('All modular routes initialized.');

// Catch-all route to serve the frontend's index.html for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  connectDB();
});