// backend/routes/auth.routes.js
import express from 'express';
import { registerValidationRules, loginValidationRules } from '../controllers/auth/auth.validators.js';
import { register, login, getMe } from '../controllers/auth/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js'; // Import authenticateToken
import { asyncHandler } from '../middleware/asyncHandler.middleware.js'; // Import asyncHandler

const router = express.Router();

// Public routes
router.post('/register', registerValidationRules, asyncHandler(register));
router.post('/login', loginValidationRules, asyncHandler(login));

// Protected route to get user profile
router.get('/me', authenticateToken(), asyncHandler(getMe)); // <--- THIS IS THE CRITICAL LINE

export default router;