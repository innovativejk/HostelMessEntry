// backend/controllers/student/attendance.controller.js
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import StudentAttendanceService from '../../services/student/attendanceService.js';
import { format } from 'date-fns';

/**
 * @desc Get student's attendance records for a specified date range
 * @route GET /api/student/:userId/attendance/range
 * @access Private/Student (authenticated student matching userId or admin)
 */
export const getStudentAttendanceRange = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  // Security check: Ensure the authenticated user is accessing their own records
  // or is an admin. req.user.id is from the JWT payload.
  if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own attendance records.' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required.' });
  }

  // Fetch all records for the month to calculate summaries on frontend
  const records = await StudentAttendanceService.getStudentAttendanceRecordsRange(
    parseInt(userId),
    startDate,
    endDate
  );

  res.status(200).json({
    success: true,
    data: records,
    message: 'Student attendance records fetched successfully.',
  });
});

/**
 * @desc Export student's attendance records (CSV, PDF, XLSX)
 * @route GET /api/student/:userId/attendance/export?format=...
 * @access Private/Student (authenticated student matching userId or admin)
 */
export const exportStudentAttendance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate, format: formatType } = req.query;

  // Security check: Ensure the authenticated user is accessing their own records
  if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only export your own attendance records.' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required for export.' });
  }
  if (!formatType || !['csv', 'pdf', 'xlsx'].includes(formatType)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing format parameter (csv, pdf, xlsx).' });
  }

  const fileBuffer = await StudentAttendanceService.exportStudentAttendanceData(
    parseInt(userId),
    startDate,
    endDate,
    formatType
  );

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

  const filename = `student_attendance_report_${userId}_${format(new Date(), 'yyyyMMdd_HHmmss')}.${fileExtension}`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(fileBuffer);
});

// Assuming getStudentAttendance from dashboard.controller is a lightweight overview
// If it needs to fetch specific range data, it should probably call getStudentAttendanceRecordsRange
// from this service. No changes here directly.
