// backend/controllers/admin/user.validators.js
import { body } from 'express-validator';

// Base validation rules for user creation/update
const baseUserValidation = [
  body('name').trim().notEmpty().withMessage('Full Name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('role').isIn(['student', 'staff']).withMessage('Invalid role selected (must be student or staff)'),
  body('status').isIn(['pending', 'approved', 'suspended']).withMessage('Invalid user status. Must be pending, approved, or suspended.'),
];

export const createUserValidationRules = [
  ...baseUserValidation,
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').bail(),

  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Phone must be 10 to 15 digits if provided'),

  body('studentData')
    .if(body('role').equals('student'))
    .exists().withMessage('Student data is required for student role')
    .isObject().withMessage('Student data must be an object'),
  body('studentData.rollNo')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Roll Number is required for students'),
  body('studentData.enrollmentNo')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Enrollment Number is required for students'),
  body('studentData.branch')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Branch is required for students'),
  body('studentData.year')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Year is required for students'),
  body('studentData.course')
    .if(body('role').equals('student'))
    .optional().isString().withMessage('Course must be a string'),

  body('staffData')
    .if(body('role').equals('staff'))
    .exists().withMessage('Staff data is required for staff role')
    .isObject().withMessage('Staff data must be an object'),
  body('staffData.employeeId')
    .if(body('role').equals('staff'))
    .trim().notEmpty().withMessage('Employee ID is required for staff'),
  body('staffData.position')
    .if(body('role').equals('staff'))
    .trim().notEmpty().withMessage('Position is required for staff'),
];

export const updateUserValidationRules = [
  ...baseUserValidation,
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),

  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Phone must be 10 to 15 digits if provided'),

  body('studentData')
    .if(body('role').equals('student'))
    .exists().withMessage('Student data is required for student role update')
    .isObject().withMessage('Student data must be an object'),
  body('studentData.rollNo')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Roll Number is required for students on update'),
  body('studentData.enrollmentNo')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Enrollment Number is required for students on update'),
  body('studentData.branch')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Branch is required for students on update'),
  body('studentData.year')
    .if(body('role').equals('student'))
    .trim().notEmpty().withMessage('Year is required for students on update'),
  body('studentData.course')
    .if(body('role').equals('student'))
    .optional().isString().withMessage('Course must be a string'),

  body('staffData')
    .if(body('role').equals('staff'))
    .exists().withMessage('Staff data is required for staff role update')
    .isObject().withMessage('Staff data must be an object'),
  body('staffData.employeeId')
    .if(body('role').equals('staff'))
    .trim().notEmpty().withMessage('Employee ID is required for staff on update'),
  body('staffData.position')
    .if(body('role').equals('staff'))
    .trim().notEmpty().withMessage('Position is required for staff on update'),
];