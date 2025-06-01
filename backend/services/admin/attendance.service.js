// backend/services/admin/attendance.service.js
import AttendanceModel from '../../models/attendance.model.js';
import { format } from 'date-fns';
import { Parser } from 'json2csv'; // For CSV (though only PDF is enabled in frontend now)
import PDFDocument from 'pdfkit'; // For PDF
import ExcelJS from 'exceljs'; // For Excel (though only PDF is enabled in frontend now)

class AdminAttendanceService {
  constructor() {
    this.attendanceModel = AttendanceModel;
  }

  async getFilteredAttendance(filters) {
    return await this.attendanceModel.getAttendanceReport(filters);
  }

  async getAttendanceSummaryStats() {
    return await this.attendanceModel.getAdminDashboardStats();
  }

  async getAllApprovedStudents() {
    return await this.attendanceModel.getAllApprovedStudents();
  }

  /**
   * Exports attendance data in specified format (CSV, PDF, XLSX).
   * Note: This service is now configured to primarily handle PDF export based on recent requests.
   * @param {object} filters - Filters to apply for fetching attendance records.
   * @param {'csv'|'pdf'|'xlsx'} formatType - Desired export format.
   * @returns {Promise<Buffer|string>} - File content as buffer or string.
   * @throws {Error} - If format is unsupported.
   */
  async exportAttendanceData(filters, formatType) {
    const records = await this.attendanceModel.getAttendanceReport(filters);

    const headers = [
      { label: 'User ID', value: 'userId' },
      { label: 'User Name', value: 'userName' },
      { label: 'Roll No.', value: 'rollNo' },
      { label: 'Enrollment No.', value: 'enrollmentNo' },
      { label: 'Date', value: (row) => format(new Date(row.date), 'yyyy-MM-dd') },
      { label: 'Meal Type', value: 'mealType' },
      { label: 'Marked At', value: (row) => row.markedAt ? format(new Date(row.markedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
      { label: 'Marked By', value: 'markedByUserName' },
      { label: 'Manual Entry', value: (row) => row.isManualEntry ? 'Yes' : 'No' },
      { label: 'Notes', value: 'notes' },
    ];

    if (formatType === 'pdf') {
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

            doc.fontSize(16).text('Admin Attendance Report', { align: 'center' });
            doc.text(`Period: ${filters.startDate || 'N/A'} to ${filters.endDate || 'N/A'}`, { align: 'center' });
            doc.fontSize(10).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'center' });
            doc.moveDown();

            if (records.length === 0) {
                doc.text('No attendance records found for the selected criteria.');
            } else {
                const tableHeaders = headers.map(h => h.label);
                // Calculate column widths dynamically based on page width and number of columns
                const columnWidth = (doc.page.width - 60) / tableHeaders.length; // 60 for margins

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
                    y += 15; // Line height
                    if (y > doc.page.height - 50) { // Check if new page is needed
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

            doc.end(); // Finalize the PDF document
        });
    } else {
      // If any other format is requested, throw an error as only PDF is supported now.
      throw new Error('Unsupported export format. Only PDF export is currently enabled.');
    }
  }
}

export default new AdminAttendanceService();
