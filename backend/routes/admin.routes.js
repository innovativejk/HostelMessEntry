// backend/routes/admin.routes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validationResult } from 'express-validator';

// Dashboard Controllers
import { getDashboardStats } from '../controllers/admin/dashboard.controller.js';

// User Management Controllers & Validators
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/admin/user.controller.js';
import {
    createUserValidationRules,
    updateUserValidationRules
} from '../controllers/admin/user.validators.js';

// Mess Plan Controllers
import {
    getAllMessPlans,
    approveMessPlan,
    rejectMessPlan
} from '../controllers/admin/messPlan.controller.js';

// Attendance Controllers
import {
    getAdminAttendance,
    getAdminAttendanceStats,
    exportAdminAttendance,
    getAllApprovedStudents
} from '../controllers/admin/attendance.controller.js';


const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// All admin routes require authentication and 'admin' role
// This replaces both router.use(authenticateToken); and router.use(authorizeRoles(['admin']));
router.use(authenticateToken(['admin'])); // <--- CRITICAL CHANGE

// Admin Dashboard Stats Route
router.get('/dashboard-stats', getDashboardStats);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUserValidationRules, handleValidationErrors, createUser);
router.put('/users/:id', updateUserValidationRules, handleValidationErrors, updateUser);
router.delete('/users/:id', deleteUser);

// Mess Plan Routes for Admin
router.get('/mess-plans', getAllMessPlans);
router.put('/mess-plans/:planId/approve', approveMessPlan);
router.put('/mess-plans/:planId/reject', rejectMessPlan);

// Admin Attendance Routes
router.get('/attendance', getAdminAttendance);
router.get('/attendance/summary', getAdminAttendanceStats);
router.get('/attendance/export', exportAdminAttendance);
router.get('/students/approved', getAllApprovedStudents);

export default router;