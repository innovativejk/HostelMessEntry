// backend/controllers/admin/attendance.controller.js
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import AdminAttendanceService from '../../services/admin/attendance.service.js';
import { format } from 'date-fns';

/**
 * @desc Get all attendance records for admin with filters
 * @route GET /api/admin/attendance
 * @access Private/Admin
 */
export const getAdminAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate, mealType, studentId, searchQuery } = req.query;

  const filters = { startDate, endDate, mealType, studentId, searchQuery };
  const attendanceRecords = await AdminAttendanceService.getFilteredAttendance(filters);

  res.status(200).json({
    success: true,
    data: attendanceRecords,
    message: 'Admin attendance records fetched successfully',
  });
});

/**
 * @desc Get attendance summary statistics for admin dashboard
 * @route GET /api/admin/attendance/summary
 * @access Private/Admin
 */
export const getAdminAttendanceStats = asyncHandler(async (req, res) => {
  const stats = await AdminAttendanceService.getAttendanceSummaryStats();

  res.status(200).json({
    success: true,
    data: stats,
    message: 'Admin attendance summary fetched successfully',
  });
});

/**
 * @desc Export admin attendance records (CSV, PDF, XLSX)
 * @route GET /api/admin/attendance/export?format=...
 * @access Private/Admin
 */
export const exportAdminAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate, mealType, studentId, searchQuery, format: formatType } = req.query;

  if (!formatType || !['csv', 'pdf', 'xlsx'].includes(formatType)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing format parameter (csv, pdf, xlsx).' });
  }

  const filters = { startDate, endDate, mealType, studentId, searchQuery };

  const fileBuffer = await AdminAttendanceService.exportAttendanceData(filters, formatType);

  let contentType;
  let fileExtension;
  switch (formatType) {
    case 'csv':
      contentType = 'text/csv';
      fileExtension = 'csv';
      break;
    case 'pdf':
      contentType = 'application/pdf';
      fileExtension = 'pdf';
      break;
    case 'xlsx':
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
      break;
  }

  const filename = `admin_attendance_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.${fileExtension}`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(fileBuffer);
});

/**
 * @desc Get all approved students for admin filter dropdowns
 * @route GET /api/admin/students/approved
 * @access Private/Admin
 */
export const getAllApprovedStudents = asyncHandler(async (req, res) => {
    const students = await AdminAttendanceService.getApprovedStudentsForFilter();
    res.status(200).json({
        success: true,
        data: students,
        message: 'Approved students fetched successfully.'
    });
});