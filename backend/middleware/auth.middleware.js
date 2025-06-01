// backend/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/auth.js';
import * as logger from '../utils/logger.js'; // Import logger

export const authenticateToken = (allowedRoles = []) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Authentication token required: No token provided in headers.'); // Log missing token
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      logger.error('JWT verification failed:', err, { message: err.message, token_start: token.substring(0, 10) + '...' }); // Log JWT error
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    req.user = user; // This is where the user payload from JWT is attached
    logger.info('Token authenticated successfully. User:', { userId: user.id, role: user.role });

    if (allowedRoles.length > 0) {
      if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        logger.warn(`Access denied for user ${req.user.id} (role: ${req.user.role}). Required roles: ${allowedRoles.join(', ')}`);
        return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
      }
    }

    next(); // Pass control to the next middleware/route handler
  });
};