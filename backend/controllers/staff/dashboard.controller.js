// backend/controllers/staff/dashboard.controller.js
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import StaffAttendanceService from '../../services/staff/attendance.service.js';
import { format } from 'date-fns'; // Import format

/**
 * @route GET /api/staff/dashboard/summary
 * @desc Get summary statistics for the staff dashboard (total students, today's attendance)
 * @access Private (Staff/Admin)
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
    const summary = await StaffAttendanceService.getTodayAttendanceSummary();

    res.status(200).json({
        success: true,
        data: summary,
        message: 'Dashboard summary fetched successfully.'
    });
});

/**
 * @route GET /api/staff/dashboard/recent-attendance
 * @desc Get recent attendance records for the staff dashboard (last 5 for today)
 * @access Private (Staff/Admin)
 */
export const getDashboardRecentAttendance = asyncHandler(async (req, res) => {
    const today = format(new Date(), 'yyyy-MM-dd'); // Get today's date
    // Pass today's date and a limit for recent records
    const recentRecords = await StaffAttendanceService.getTodayAttendanceRecords(today, 5); // Fetch last 5 records for today

    res.status(200).json({
        success: true,
        data: recentRecords,
        message: 'Recent attendance records fetched successfully.'
    });
});
