// backend/controllers/student/dashboard.controller.js
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
    isAfter,
    parseISO,
    format,
    addMinutes,
    isBefore,
    subDays,
    addDays,
    isValid
} from 'date-fns';

import StudentAttendanceService from '../../services/student/attendanceService.js';
import { getRecentNotifications as getRecentNotificationsService } from '../../services/student/notificationService.js';
import MessPlanService from '../../services/student/messPlanService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const QR_CODE_EXPIRY_MINUTES = 5;

const messPlanServiceInstance = MessPlanService;

// REVISED getActiveMealType function for better precision
const getActiveMealType = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Define meal times with more precision (e.g., breakfast ends at 10:30 AM, lunch ends at 3:30 PM, dinner ends at 11:30 PM)
    // You can adjust these times based on your actual mess schedule
    // A small buffer could be added if needed, e.g., allowing for 15-30 mins after official end time for scanning

    // Breakfast window: 7:00 AM to 10:30 AM (inclusive of 7:00, exclusive of 10:30)
    if (
        (currentHour > 7 || (currentHour === 7 && currentMinute >= 0)) &&
        (currentHour < 10 || (currentHour === 10 && currentMinute < 30))
    ) {
        return 'breakfast';
    }
    // Lunch window: 12:00 PM to 3:30 PM (inclusive of 12:00, exclusive of 15:30)
    else if (
        (currentHour > 12 || (currentHour === 12 && currentMinute >= 0)) &&
        (currentHour < 15 || (currentHour === 15 && currentMinute < 30))
    ) {
        return 'lunch';
    }
    // Dinner window: 7:00 PM to 11:30 PM (inclusive of 19:00, exclusive of 23:30)
    else if (
        (currentHour > 19 || (currentHour === 19 && currentMinute >= 0)) &&
        (currentHour < 23 || (currentHour === 23 && currentMinute < 30))
    ) {
        return 'dinner';
    }
    return null;
};

export const getActiveMessPlan = asyncHandler(async (req, res) => {
    // Directly use req.user.id for the authenticated student
    const userId = req.user.id; // Corrected line
    const activePlan = await messPlanServiceInstance.getActiveMessPlan(userId);
    if (!activePlan) {
        return res.status(200).json({ success: true, message: 'No active mess plan found for this student.', data: null });
    }
    res.status(200).json({ success: true, data: activePlan });
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
    // Directly use req.user.id for the authenticated student
    const userId = req.user.id; // Corrected line
    const { date } = req.query;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400);
        throw new Error('Bad Request: Invalid or missing date parameter. Format should be YYYY-MM-DD.');
    }
    const attendance = await StudentAttendanceService.getStudentAttendanceRecordsRange(userId, date, date);
    res.status(200).json({ success: true, data: attendance });
});

export const getActiveMeal = asyncHandler(async (req, res) => {
    const mealType = getActiveMealType();
    res.status(200).json({ success: true, data: { mealType } });
});

export const generateQrCode = asyncHandler(async (req, res) => {
    const { userId: reqBodyUserId, date, mealType } = req.body; // Renamed to avoid conflict
    const parsedReqBodyUserId = parseInt(reqBodyUserId, 10);

    if (!parsedReqBodyUserId || isNaN(parsedReqBodyUserId) || !date || typeof date !== 'string' || !mealType || typeof mealType !== 'string') {
        res.status(400);
        throw new Error('Bad Request: Missing or invalid userId, date (must be string), or mealType in request body.');
    }

    // Ensure the QR code is generated for the authenticated user only
    if (req.user.id !== parsedReqBodyUserId) { // Use parsedReqBodyUserId
        res.status(403);
        throw new Error('Forbidden: Not authorized to generate QR for this user.');
    }

    const activePlan = await messPlanServiceInstance.getActiveMessPlan(req.user.id); // Use req.user.id

    if (!activePlan || !activePlan.startDate || !activePlan.endDate) {
        res.status(400);
        throw new Error('Bad Request: Student does not have an active mess plan, or plan dates are missing.');
    }

    let planStartDate = activePlan.startDate;
    let planEndDate = activePlan.endDate;

    if (planStartDate instanceof Date) {
        planStartDate = format(planStartDate, 'yyyy-MM-dd');
    }
    if (planEndDate instanceof Date) {
        planEndDate = format(planEndDate, 'yyyy-MM-dd');
    }

    if (typeof planStartDate !== 'string' || typeof planEndDate !== 'string') {
        res.status(500);
        throw new Error('Server Error: Mess plan dates could not be converted to string format from the service.');
    }

    const parsedDate = parseISO(date);
    const parsedStartDate = parseISO(planStartDate);
    const parsedEndDate = parseISO(planEndDate);

    if (!isValid(parsedDate) || !isValid(parsedStartDate) || !isValid(parsedEndDate)) {
        res.status(400);
        throw new Error('Bad Request: One or more dates (request date, plan start, or plan end) are invalid after parsing.');
    }

    if (!isAfter(parsedDate, subDays(parsedStartDate, 1)) || !isBefore(parsedDate, addDays(parsedEndDate, 1))) {
        res.status(400);
        throw new Error('Bad Request: Student\'s active mess plan does not cover this date.');
    }

    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    const alreadyMarkedRecords = await StudentAttendanceService.getStudentAttendanceRecordsRange(req.user.id, todayFormatted, todayFormatted); // Use req.user.id
    const hasMarkedCurrentMeal = alreadyMarkedRecords.some(att => att.meal_type === mealType);
    if (hasMarkedCurrentMeal) {
        res.status(400);
        throw new Error(`Conflict: Student already checked in for ${mealType} today.`);
    }

    if (getActiveMealType() !== mealType) { // This check relies on the updated getActiveMealType
        res.status(400);
        throw new Error(`Conflict: It's not the active time for ${mealType}. Please try during the correct meal window.`);
    }

    const payload = {
        userId: req.user.id, // Use req.user.id
        date: date,
        mealType: mealType,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${QR_CODE_EXPIRY_MINUTES}m` });

    res.status(200).json({ success: true, qrData: token });
});

export const getRecentNotifications = asyncHandler(async (req, res) => {
    // Directly use req.user.id for the authenticated student
    const userId = req.user.id; // Corrected line
    const notifications = await getRecentNotificationsService(userId);
    res.status(200).json({ success: true, data: notifications });
});