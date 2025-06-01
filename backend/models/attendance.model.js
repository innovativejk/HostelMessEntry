// backend/models/attendance.model.js
import { getDB } from '../config/database.js';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import * as logger from '../utils/logger.js';

const AttendanceModel = {
  async create(data) {
    const db = getDB();
    const query = `
      INSERT INTO attendance
      (user_id, date, meal_type, marked_at, marked_by_user_id, ip_address, device_info, is_manual_entry, notes)
      VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await db.execute(query, [
        data.userId,
        data.date,
        data.mealType,
        data.markedByUserId,
        data.ipAddress || null,
        data.deviceInfo || null,
        data.isManualEntry || false,
        data.notes || null,
      ]);
      logger.info(`AttendanceModel: Created new attendance for user ID ${data.userId}, meal: ${data.mealType}. Insert ID: ${result.insertId}`);
      return result;
    } catch (err) {
      logger.error(`AttendanceModel: Error in create attendance for user ID ${data.userId}`, err, { data });
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('Attendance for this meal and date already exists for this user.');
      }
      throw new Error('Failed to record attendance in database.');
    }
  },

  async findByStudentAndRange(userId, startDate, endDate) {
    const db = getDB();
    const formattedStartDate = format(new Date(startDate), 'yyyy-MM-dd');
    const formattedEndDate = format(new Date(endDate), 'yyyy-MM-dd');

    try {
      const [rows] = await db.execute(
        `SELECT id, user_id, date, meal_type, marked_at, marked_by_user_id, is_manual_entry, notes
         FROM attendance
         WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC, marked_at ASC`,
        [userId, formattedStartDate, formattedEndDate]
      );
      logger.info(`AttendanceModel: Found attendance for user ID ${userId} from ${formattedStartDate} to ${formattedEndDate}. Count: ${rows.length}`);
      return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        date: format(new Date(row.date), 'yyyy-MM-dd'),
        meal_type: row.meal_type,
        marked_at: row.marked_at ? new Date(row.marked_at).toISOString() : null,
        marked_by_user_id: row.marked_by_user_id,
        is_manual_entry: row.is_manual_entry,
        notes: row.notes,
      }));
    } catch (err) {
      logger.error(`AttendanceModel: Error in findByStudentAndRange for user ID ${userId}, range ${startDate}-${endDate}`, err);
      throw new Error('Failed to retrieve attendance by user and date range from database.');
    }
  },

  async getAdminDashboardStats() {
    const db = getDB();
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');
    const formattedStartOfWeek = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const formattedEndOfWeek = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const formattedStartOfMonth = format(startOfMonth(today), 'yyyy-MM-dd');
    const formattedEndOfMonth = format(endOfMonth(today), 'yyyy-MM-dd');

    try {
      const [totalApprovedStudentsResult] = await db.execute(`SELECT COUNT(id) AS count FROM users WHERE role = 'student' AND status = 'approved'`);
      const totalApprovedStudents = totalApprovedStudentsResult[0].count;

      const [todayAttendedMealsResult] = await db.execute(`SELECT COUNT(id) AS count FROM attendance WHERE date = ?`, [formattedToday]);
      const todayAttendedMeals = todayAttendedMealsResult[0].count;

      const [todayAttendedStudentsResult] = await db.execute(`SELECT COUNT(DISTINCT user_id) AS count FROM attendance WHERE date = ?`, [formattedToday]);
      const todayAttendedStudents = todayAttendedStudentsResult[0].count;

      const [thisWeekAttendedMealsResult] = await db.execute(`SELECT COUNT(id) AS count FROM attendance WHERE date BETWEEN ? AND ?`, [formattedStartOfWeek, formattedEndOfWeek]);
      const thisWeekAttendedMeals = thisWeekAttendedMealsResult[0].count;

      const [thisMonthAttendedMealsResult] = await db.execute(`SELECT COUNT(id) AS count FROM attendance WHERE date BETWEEN ? AND ?`, [formattedStartOfMonth, formattedEndOfMonth]);
      const thisMonthAttendedMeals = thisMonthAttendedMealsResult[0].count;

      logger.info('AttendanceModel: Fetched admin dashboard stats.');
      return {
        totalApprovedStudents,
        todayAttendedMeals,
        todayAttendedStudents,
        thisWeekAttendedMeals,
        thisMonthAttendedMeals
      };
    } catch (err) {
      logger.error('AttendanceModel: Error in getAdminDashboardStats', err);
      throw new Error('Failed to retrieve admin dashboard stats from database.');
    }
  },

  async getAllApprovedStudents() {
    const db = getDB();
    const query = `
          SELECT u.id, u.name, s.roll_no, s.enrollment_no, s.course, s.year, s.branch, s.phone
          FROM users u
          JOIN students s ON u.id = s.user_id
          WHERE u.role = 'student' AND u.status = 'approved'
          ORDER BY u.name ASC
      `;
    try {
      const [rows] = await db.execute(query);
      logger.info(`AttendanceModel: Fetched all approved students. Count: ${rows.length}`);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        rollNo: row.roll_no,
        enrollmentNumber: row.enrollment_no,
        course: row.course,
        year: row.year,
        branch: row.branch,
        phone: row.phone
      }));
    } catch (err) {
      logger.error('AttendanceModel: Error in getAllApprovedStudents', err);
      throw new Error('Failed to retrieve approved students from database.');
    }
  },

  /**
   * @desc Generates an attendance report with various filters, including student and marked-by staff names.
   * @param {object} filters - Filters including startDate, endDate, mealType, userId, rollNo, enrollmentNo, isManualEntry, and limit.
   * @returns {Promise<Array<object>>} - A promise that resolves to an array of attendance records.
   */
  async getAttendanceReport(filters) {
    const db = getDB();
    let query = `
        SELECT
            a.id,
            a.user_id AS userId,
            u.name AS userName,
            s.roll_no AS rollNo,
            s.enrollment_no AS enrollmentNo,
            a.date,
            a.meal_type AS mealType,
            a.marked_at AS markedAt,
            u_marked_by.name AS markedByUserName,
            a.ip_address AS ipAddress,
            a.device_info AS deviceInfo,
            a.is_manual_entry AS isManualEntry,
            a.notes
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN users u_marked_by ON a.marked_by_user_id = u_marked_by.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ` AND a.date >= ?`;
      params.push(format(new Date(filters.startDate), 'yyyy-MM-dd'));
    }
    if (filters.endDate) {
      query += ` AND a.date <= ?`;
      params.push(format(new Date(filters.endDate), 'yyyy-MM-dd'));
    }
    if (filters.mealType) {
      query += ` AND a.meal_type = ?`;
      params.push(filters.mealType);
    }
    if (filters.userId) {
      query += ` AND a.user_id = ?`;
      params.push(filters.userId);
    }
    if (filters.rollNo) {
      query += ` AND s.roll_no = ?`;
      params.push(filters.rollNo);
    }
    if (filters.enrollmentNo) {
      query += ` AND s.enrollment_no = ?`;
      params.push(filters.enrollmentNo);
    }
    if (filters.isManualEntry !== undefined) {
      query += ` AND a.is_manual_entry = ?`;
      params.push(filters.isManualEntry ? 1 : 0);
    }

    query += ` ORDER BY a.date DESC, a.marked_at DESC`;

    // Handle limit directly in the query string to avoid issues with parameter binding for LIMIT
    const limitValue = parseInt(filters.limit, 10);
    if (!isNaN(limitValue) && limitValue > 0) {
        query += ` LIMIT ${limitValue}`; // Append limit directly
        // No need to push to params array as it's now part of the query string
    }

    // --- DEBUG LOGS START ---
    logger.info(`DEBUG: getAttendanceReport - Final Query: ${query}`);
    logger.info(`DEBUG: getAttendanceReport - Final Params: ${JSON.stringify(params)}`);
    // --- DEBUG LOGS END ---

    try {
      const [rows] = await db.execute(query, params);
      logger.info(`AttendanceModel: Generated attendance report with filters. Rows: ${rows.length}`);
      return rows.map(row => ({
        ...row,
        date: format(new Date(row.date), 'yyyy-MM-dd'),
        markedAt: row.markedAt ? new Date(row.markedAt).toISOString() : null,
      }));
    } catch (err) {
      logger.error('AttendanceModel: Error in getAttendanceReport', err, { filters });
      throw new Error(`Failed to generate attendance report from database: ${err.message}`);
    }
  },

  async findTodaysMarkedMealsForUser(userId, date) {
    const db = getDB();
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    try {
      const [rows] = await db.execute(
        `SELECT meal_type FROM attendance WHERE user_id = ? AND date = ?`,
        [userId, formattedDate]
      );
      logger.info(`AttendanceModel: Found today's marked meals for user ID ${userId} on ${formattedDate}. Count: ${rows.length}`);
      return rows.map(row => row.meal_type);
    } catch (err) {
      logger.error(`AttendanceModel: Error in findTodaysMarkedMealsForUser for user ID ${userId}, date ${date}`, err);
      throw new Error('Failed to retrieve today\'s marked meals from database.');
    }
  }
};

export default AttendanceModel;
