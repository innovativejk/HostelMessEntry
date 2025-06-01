// backend/controllers/auth/auth.controller.js
import { validationResult } from 'express-validator';
import authService from '../../services/auth.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js'; // Import asyncHandler

export const register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, rollNo, enrollmentNo, branch, year, phone, course } = req.body;

    const studentId = await authService.registerStudentUser({
        name, email, password, rollNo, enrollmentNo, branch, year, phone, course
    });

    res.status(201).json({
      message: 'Student registration submitted successfully. Please wait for admin approval.',
      studentId
    });
});

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, role } = req.body;
  const { token, user } = await authService.loginUser(email, password, role);
  res.json({ token, user });
});

export const getMe = asyncHandler(async (req, res) => {
    // req.user is populated by authenticateToken middleware (from JWT payload)
    const userId = req.user.id; // Assuming your JWT payload has an 'id' field
    console.log(`AuthController: getMe called for userId: ${userId}`); // Add this log

    // Fetch full user profile including joined student/staff data
    const user = await authService.getUserProfile(userId);

    if (!user) {
        console.log(`AuthController: User not found for getMe, userId: ${userId}`); // Add this log
        return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
    console.log(`AuthController: getMe successfully sent response for userId: ${userId}`); // Add this log
});