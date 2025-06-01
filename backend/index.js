// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import staffRoutes from './routes/staff.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { getActiveMeal } from './controllers/student/dashboard.controller.js';
import * as logger from './utils/logger.js'; // Import logger

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// General API Routes
app.get('/api/general/active-meal', getActiveMeal);
logger.info('General API route /api/general/active-meal initialized.');

// Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
logger.info('All modular routes initialized.');

// Error handler middleware (must be the last middleware)
app.use((err, req, res, next) => {
  logger.error('Unhandled error caught by global error handler:', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'N/A' // Log user ID if available
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    // stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Optional: show stack in dev
  });
});

const PORT = process.env.PORT || 5005;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Backend running at http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  logger.error('❌ Failed to start server due to database connection error:', error);
  process.exit(1);
});