// backend/routes/staff.routes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js'; // Ensure this is the UPDATED authenticateToken

// REMOVE THIS LINE IF IT EXISTS (it likely does if you're getting the error)
// import { authorizeRoles } from '../middleware/rbac.middleware.js'; 

// Import controllers
import { markAttendanceByQr } from '../controllers/staff/qr.controller.js'; // For scanning QR and marking
import { getStaffAttendanceRecords, getStaffAttendanceSummary, exportStaffAttendanceRecords } from '../controllers/staff/attendance.controller.js'; // For staff's own view of attendance
import { getDashboardSummary, getDashboardRecentAttendance } from '../controllers/staff/dashboard.controller.js';

const router = express.Router();

// All staff routes require authentication and specific roles
// Replace the two lines:
// router.use(authenticateToken);
// router.use(authorizeRoles(['admin', 'staff']));
// WITH this single line:
router.use(authenticateToken(['admin', 'staff'])); // <--- CRITICAL CHANGE: Pass roles directly

// QR Code Scanning (Staff action)
router.post('/attendance/mark-qr', markAttendanceByQr);

// Staff's Own View of Attendance (e.g., records they marked, or quick stats)
router.get('/attendance', getStaffAttendanceRecords); // Records marked by this staff or overall for today
router.get('/attendance/summary', getStaffAttendanceSummary); // Summary of attendance for staff context
router.get('/attendance/export', exportStaffAttendanceRecords); // Export attendance records viewable by staff

// Dashboard specific endpoints for staff
router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/recent-attendance', getDashboardRecentAttendance);


export default router;