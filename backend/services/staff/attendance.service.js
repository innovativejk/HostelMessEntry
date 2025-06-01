// backend/services/staff/attendance.service.js
import AttendanceModel from '../../models/attendance.model.js';
import { format } from 'date-fns';
import { Parser } from 'json2csv';
import { getDB } from '../../config/database.js'; // This import is correct and needed!
import PDFDocument from 'pdfkit'; // For PDF export
import ExcelJS from 'exceljs'; // For XLSX export

const StaffAttendanceService = {
  /**
   * Marks attendance for a student via QR code scan.
   * @param {number} studentUserId - The user_id of the student from QR code.
   * @param {'breakfast'|'lunch'|'dinner'} mealType - The meal being marked.
   * @param {number} staffUserId - The user_id of the staff marking attendance.
   * @param {string} [ipAddress] - IP address of the scanner.
   * @param {string} [deviceInfo] - Device info of the scanner.
   * @returns {Promise<object>} - Result of the operation.
   * @throws {Error} - If attendance already exists for the meal/day or other error.
   */
  async markStudentAttendance(studentUserId, mealType, staffUserId, ipAddress, deviceInfo) {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Check for existing attendance to prevent duplicates based on the unique constraint
    const existingRecord = await AttendanceModel.findTodaysMarkedMealsForUser(studentUserId, today);
    if (existingRecord.includes(mealType)) { // Check if the specific meal is already marked
      throw new Error(`Attendance for this meal (${mealType}) on ${today} is already marked for this student.`);
    }

    const attendanceData = {
      userId: studentUserId,
      date: today,
      mealType: mealType,
      markedByUserId: staffUserId,
      ipAddress: ipAddress,
      deviceInfo: deviceInfo,
    };

    const result = await AttendanceModel.create(attendanceData);
    return { success: true, message: 'Attendance marked successfully', recordId: result.insertId };
  },

  /**
   * Gets attendance records viewable by staff (e.g., today's records).
   * This now uses getAttendanceReport from AttendanceModel.
   * @param {string} date - Date to fetch records for (YYYY-MM-DD).
   * @param {number} [limit] - Optional: Limit the number of records (for recent activity).
   * @returns {Promise<Array<object>>}
   */
  async getTodayAttendanceRecords(date = format(new Date(), 'yyyy-MM-dd'), limit = null) {
      const filters = {
          startDate: date,
          endDate: date,
          limit: limit // Pass limit to the model
      };
      // AttendanceModel.getAttendanceReport already handles joins for student and staff names
      return AttendanceModel.getAttendanceReport(filters);
  },

  /**
   * Gets summary statistics relevant to staff (e.g., today's attendance count).
   * @returns {Promise<object>}
   */
  async getTodayAttendanceSummary() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const db = getDB();

    // Example: Count distinct students and total meals marked today
    const [todayStats] = await db.execute(`
        SELECT
            COUNT(id) AS totalMealsMarkedToday,
            COUNT(DISTINCT user_id) AS distinctStudentsMarkedToday,
            SUM(CASE WHEN meal_type = 'breakfast' THEN 1 ELSE 0 END) AS todayBreakfastCount,
            SUM(CASE WHEN meal_type = 'lunch' THEN 1 ELSE 0 END) AS todayLunchCount,
            SUM(CASE WHEN meal_type = 'dinner' THEN 1 ELSE 0 END) AS todayDinnerCount
        FROM attendance
        WHERE date = ?
    `, [today]);

    const [totalApprovedStudentsResult] = await db.execute(`SELECT COUNT(id) AS count FROM users WHERE role = 'student' AND status = 'approved'`);
    const totalApprovedStudents = totalApprovedStudentsResult[0].count;

    // For simplicity, using today's counts for week/month if not explicitly fetched from model
    // If you need actual weekly/monthly counts, you'd add more queries here or in attendance.model.js
    const [thisWeekAttendedMealsResult] = await db.execute(`
        SELECT COUNT(id) AS count FROM attendance
        WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)
    `);
    const thisWeekAttendedMeals = thisWeekAttendedMealsResult[0].count;

    const [thisMonthAttendedMealsResult] = await db.execute(`
        SELECT COUNT(id) AS count FROM attendance
        WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())
    `);
    const thisMonthAttendedMeals = thisMonthAttendedMealsResult[0].count;


    return {
        date: today,
        totalMealsMarkedToday: todayStats[0].totalMealsMarkedToday,
        distinctStudentsMarkedToday: todayStats[0].distinctStudentsMarkedToday,
        todayBreakfastCount: todayStats[0].todayBreakfastCount,
        todayLunchCount: todayStats[0].todayLunchCount,
        todayDinnerCount: todayStats[0].todayDinnerCount,
        totalApprovedStudents: totalApprovedStudents, // Helpful for staff to see context
        thisWeekAttendedMeals: thisWeekAttendedMeals,
        thisMonthAttendedMeals: thisMonthAttendedMeals,
    };
  },

  /**
   * Exports staff-viewable attendance records.
   * @param {object} filters - Filters to apply (e.g., startDate, endDate).
   * @param {'csv'|'pdf'|'xlsx'} formatType - Desired export format.
   * @returns {Promise<Buffer|string>} - File content as buffer or string.
   * @throws {Error} - If format is unsupported.
   */
  async exportStaffAttendanceData(filters, formatType) {
    // This will fetch all records for the given date range, including student/staff names
    const records = await AttendanceModel.getAttendanceReport(filters);

    const headers = [
      { label: 'Student Name', value: 'userName' },
      { label: 'Roll No.', value: 'rollNo' },
      { label: 'Enrollment No.', value: 'enrollmentNo' },
      { label: 'Date', value: (row) => format(new Date(row.date), 'yyyy-MM-dd') },
      { label: 'Meal Type', value: 'mealType' },
      { label: 'Marked At', value: (row) => row.markedAt ? format(new Date(row.markedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
      { label: 'Marked By', value: 'markedByUserName' },
      { label: 'Manual Entry', value: (row) => row.isManualEntry ? 'Yes' : 'No' },
      { label: 'Notes', value: 'notes' },
    ];

    if (formatType === 'csv') {
      const json2csvParser = new Parser({ fields: headers });
      return json2csvParser.parse(records);
    } else if (formatType === 'pdf') {
        const doc = new PDFDocument({ margin: 30 });
        const buffers = [];

        // FIX: Ensure the Promise resolves only when the PDF stream has ended
        return new Promise((resolve, reject) => {
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const result = Buffer.concat(buffers);
                resolve(result);
            });
            doc.on('error', (err) => {
                reject(err);
            });

            doc.fontSize(16).text('Staff Attendance Report', { align: 'center' });
            doc.fontSize(10).text(`Period: ${filters.startDate || 'N/A'} to ${filters.endDate || 'N/A'}`, { align: 'center' });
            doc.fontSize(10).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'center' });
            doc.moveDown();

            if (records.length === 0) {
                doc.text('No attendance records found for the selected criteria.');
            } else {
                const tableHeaders = headers.map(h => h.label);
                const columnWidth = (doc.page.width - 60) / tableHeaders.length;

                doc.font('Helvetica-Bold').fontSize(8);
                let y = doc.y;
                let x = 30;
                tableHeaders.forEach(header => {
                    doc.text(header, x, y, { width: columnWidth, align: 'left' });
                    x += columnWidth;
                });
                doc.moveDown();
                y = doc.y;

                doc.font('Helvetica').fontSize(7);
                records.forEach(record => {
                    x = 30;
                    headers.forEach(header => {
                        let value = typeof header.value === 'function' ? header.value(record) : record[header.value];
                        if (value === undefined || value === null) value = '';
                        doc.text(String(value), x, y, { width: columnWidth, align: 'left' });
                        x += columnWidth;
                    });
                    y += 15;
                    if (y > doc.page.height - 50) {
                        doc.addPage();
                        y = 30;
                        x = 30;
                        doc.font('Helvetica-Bold').fontSize(8);
                        tableHeaders.forEach(header => {
                            doc.text(header, x, y, { width: columnWidth, align: 'left' });
                            x += columnWidth;
                        });
                        doc.moveDown();
                        y = doc.y;
                        doc.font('Helvetica').fontSize(7);
                    }
                });
            }

            doc.end(); // Finalize the PDF
        });
    } else if (formatType === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Staff Attendance');

      worksheet.columns = headers.map(h => ({ header: h.label, key: h.value, width: 15 }));

      records.forEach(record => {
          const rowData = {};
          headers.forEach(header => {
              let value = typeof header.value === 'function' ? header.value(record) : record[header.value];
              if (value === undefined || value === null) value = '';
              rowData[header.value] = value;
          });
          worksheet.addRow(rowData);
      });

      return workbook.xlsx.writeBuffer();
    } else {
      throw new Error('Unsupported export format');
    }
  }
};

export default StaffAttendanceService;
