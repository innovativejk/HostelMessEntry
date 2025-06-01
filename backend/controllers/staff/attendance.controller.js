// backend/controllers/staff/attendance.controller.js
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import StaffAttendanceService from '../../services/staff/attendance.service.js';
import { format } from 'date-fns';

/**
 * @desc Get attendance records for staff view (e.g., today's attendance)
 * @route GET /api/staff/attendance
 * @access Private/Staff
 */
export const getStaffAttendanceRecords = asyncHandler(async (req, res) => {
  // Staff might want to see attendance marked by them, or all today's attendance.
  // For simplicity, let's get all attendance for today.
  const today = format(new Date(), 'yyyy-MM-dd');
  const records = await StaffAttendanceService.getTodayAttendanceRecords(today); // Pass today's date

  res.status(200).json({
    success: true,
    data: records,
    message: 'Today\'s attendance records fetched for staff.',
  });
});

/**
 * @desc Get attendance summary for staff dashboard (e.g., total marked today)
 * @route GET /api/staff/attendance/summary
 * @access Private/Staff
 */
export const getStaffAttendanceSummary = asyncHandler(async (req, res) => {
  const summary = await StaffAttendanceService.getTodayAttendanceSummary();

  res.status(200).json({
    success: true,
    data: summary,
    message: 'Today\'s attendance summary fetched for staff.',
  });
});

/**
 * @desc Export staff-viewable attendance records (CSV, PDF, XLSX)
 * @route GET /api/staff/attendance/export?format=...
 * @access Private/Staff
 */
export const exportStaffAttendanceRecords = asyncHandler(async (req, res) => {
  const { startDate, endDate, format: formatType } = req.query; // Staff might filter by date range

  if (!formatType || !['csv', 'pdf', 'xlsx'].includes(formatType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing format parameter (csv, pdf, xlsx).' });
  }

  // Staff might not need filters like studentId/searchQuery from admin context,
  // or you might want to limit their export capabilities.
  // For now, using a general filter object for the service.
  const filters = { startDate, endDate }; // Example: allow staff to export for a custom range

  const fileBuffer = await StaffAttendanceService.exportStaffAttendanceData(filters, formatType);

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

  const filename = `staff_attendance_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.${fileExtension}`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(fileBuffer);
});