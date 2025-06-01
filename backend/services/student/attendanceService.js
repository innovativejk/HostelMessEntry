// backend/services/student/attendanceService.js
// Renamed to 'attendanceService' (lowercase 's') for consistency with JS naming conventions
import AttendanceModel from '../../models/attendance.model.js';
import { format, getDaysInMonth, subDays, isToday } from 'date-fns';
import { Parser } from 'json2csv'; // For CSV
import PDFDocument from 'pdfkit'; // For PDF
import ExcelJS from 'exceljs'; // For Excel

const StudentAttendanceService = {
  /**
   * Fetches a student's attendance records for a specific date range.
   * @param {number} userId - The ID of the student.
   * @param {string} startDate - Start date (YYYY-MM-DD).
   * @param {string} endDate - End date (YYYY-MM-DD).
   * @returns {Promise<Array<object>>} - List of attendance records.
   */
  async getStudentAttendanceRecordsRange(userId, startDate, endDate) {
    return AttendanceModel.findByStudentAndRange(userId, startDate, endDate);
  },

  /**
   * Calculates summary statistics for a student's attendance.
   * @param {number} userId - The ID of the student.
   * @returns {Promise<object>} - Summary object.
   */
  async getStudentAttendanceSummary(userId) {
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfCurrentWeek = subDays(today, today.getDay()); // Sunday as start of week
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6); // Saturday as end of week

    const recordsThisMonth = await AttendanceModel.findByStudentAndRange(
      userId,
      format(startOfMonth, 'yyyy-MM-dd'),
      format(endOfMonth, 'yyyy-MM-dd')
    );

    const recordsThisWeek = await AttendanceModel.findByStudentAndRange(
      userId,
      format(startOfCurrentWeek, 'yyyy-MM-dd'),
      format(endOfCurrentWeek, 'yyyy-MM-dd')
    );

    const recordsToday = await AttendanceModel.findByStudentAndRange(
      userId,
      formattedToday,
      formattedToday
    );

    const thisMonthTotalPossibleMeals = getDaysInMonth(today) * 3;
    const thisMonthAttendedMeals = recordsThisMonth.length;

    const thisWeekTotalPossibleMeals = 7 * 3;
    const thisWeekAttendedMeals = recordsThisWeek.length;

    const todayTotalPossibleMeals = 3;
    const todayAttendedMeals = recordsToday.length;

    return {
      thisMonthTotalPossibleMeals,
      thisMonthAttendedMeals,
      thisWeekTotalPossibleMeals,
      thisWeekAttendedMeals,
      todayTotalPossibleMeals,
      todayAttendedMeals,
    };
  },

  /**
   * Exports a student's attendance data in specified format.
   * @param {number} userId - The ID of the student.
   * @param {string} startDate - Start date (YYYY-MM-DD).
   * @param {string} endDate - End date (YYYY-MM-DD).
   * @param {'csv'|'pdf'|'xlsx'} formatType - Desired export format.
   * @returns {Promise<Buffer|string>} - File content as buffer or string.
   * @throws {Error} - If format is unsupported.
   */
  async exportStudentAttendanceData(userId, startDate, endDate, formatType) {
    const records = await AttendanceModel.findByStudentAndRange(userId, startDate, endDate);

    const headers = [
      { label: 'Date', value: 'date' },
      { label: 'Meal Type', value: 'meal_type' },
      { label: 'Marked At', value: (row) => row.marked_at ? format(new Date(row.marked_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
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

            doc.fontSize(16).text('Your Attendance Report', { align: 'center' });
            doc.fontSize(10).text(`For User ID: ${userId}`, { align: 'center' });
            doc.text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
            doc.fontSize(10).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'center' });
            doc.moveDown();

            if (records.length === 0) {
                doc.text('No attendance records found for the selected criteria.');
            } else {
                const tableHeaders = headers.map(h => h.label);
                const columnWidth = (doc.page.width - 60) / tableHeaders.length; // Adjust for margins

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
        const worksheet = workbook.addWorksheet('Student Attendance');

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
  },
};

export default StudentAttendanceService;
