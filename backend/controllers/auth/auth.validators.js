// backend/controllers/auth/auth.validators.js
import { body } from 'express-validator';

export const registerValidationRules = [
    body('name').trim().notEmpty().withMessage('Full Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    // These fields are specific to student registration, as per your frontend
    body('rollNo').trim().notEmpty().withMessage('Roll Number is required'),
    body('enrollmentNo').trim().notEmpty().withMessage('Enrollment Number is required'),
    body('branch').trim().notEmpty().withMessage('Branch is required'),
    body('year').trim().notEmpty().withMessage('Year is required'),
    body('phone').isLength({ min: 10, max: 15 }).withMessage('Phone must be 10 to 15 digits'),
    body('course').optional().isString().withMessage('Course must be a string'),
];

export const loginValidationRules = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['student', 'staff', 'admin']).withMessage('Invalid role')
];