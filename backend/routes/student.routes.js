// backend/routes/student.routes.js
import express from 'express';
// Import the enhanced authenticateToken
import { authenticateToken } from '../middleware/auth.middleware.js';
// Student Profile Controllers
import { getStudentProfile, updateStudentProfile } from '../controllers/student/profile.controller.js';

// Mess Plan Controllers
import { createMessPlan, getMessPlans } from '../controllers/student/messPlan.controller.js';

// Dashboard & QR related Controllers
import {
  getActiveMessPlan,
  getStudentAttendance,
  generateQrCode,
  getRecentNotifications
} from '../controllers/student/dashboard.controller.js';

// Student Specific Attendance Controllers
import {
  getStudentAttendanceRange,
  exportStudentAttendance
} from '../controllers/student/attendance.controller.js';

const router = express.Router();
router.use(authenticateToken(['student'])); // <--- CRITICAL CHANGE

router.route('/profile')
  .get(getStudentProfile)
  .put(updateStudentProfile);

router.route('/mess-plans')
  .get(getMessPlans)
  .post(createMessPlan);

// Dashboard / QR related routes
// These routes will now implicitly use req.user.id from the controller as updated above
router.get('/mess-plan/active', getActiveMessPlan);
router.post('/generate-qr', generateQrCode);
router.get('/notifications/recent', getRecentNotifications);

// Student's Own Attendance View (more detailed history)
// These routes will also implicitly use req.user.id from the controller
// CORRECTED: Added :userId to the attendance routes to match frontend requests
router.get('/:userId/attendance', getStudentAttendance); // If this route is still used with userId in path
router.get('/:userId/attendance/range', getStudentAttendanceRange);
router.get('/:userId/attendance/export', exportStudentAttendance);

export default router;
