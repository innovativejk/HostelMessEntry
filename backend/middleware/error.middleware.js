// backend/middleware/error.middleware.js
import * as logger from '../utils/logger.js'; // <-- logger import करें

export const errorHandler = (err, req, res, next) => {
  logger.error('Error caught by error middleware:', err, { // <-- logger का उपयोग
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'N/A' // If req.user is populated by auth middleware
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    // stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Show stack only in dev
  });
};