// backend/models/student.model.js
import { getDB } from '../config/database.js';
import * as logger from '../utils/logger.js';

class StudentModel {
  get db() {
    return getDB();
  }

  async findByUserId(userId) {
    try {
      const [rows] = await this.db.execute(
        'SELECT student_id, user_id, roll_no, enrollment_no, branch, year, phone, course, created_at, updated_at FROM students WHERE user_id = ?',
        [userId]
      );
      const studentData = rows.length > 0 ? rows[0] : null;
      logger.info(`StudentModel: Found student by user ID ${userId}: ${!!studentData}`);
      if (studentData) {
        return {
          studentId: studentData.student_id,
          userId: studentData.user_id,
          phone: studentData.phone,
          course: studentData.course,
          year: studentData.year,
          branch: studentData.branch,
          enrollmentNumber: studentData.enrollment_no,
          rollNo: studentData.roll_no,
          createdAt: studentData.created_at,
          updatedAt: studentData.updated_at,
        };
      }
      return null;
    } catch (err) {
      logger.error(`StudentModel: Error in findByUserId for user ID ${userId}`, err);
      throw new Error('Failed to retrieve student by user ID from database.');
    }
  }

  async updateByUserId(userId, updateData) {
    try {
      const phone = updateData.phone !== undefined ? updateData.phone : null;
      const course = updateData.course !== undefined ? updateData.course : null;
      const year = updateData.year !== undefined ? updateData.year : null;
      const branch = updateData.branch !== undefined ? updateData.branch : null;
      const rollNo = updateData.rollNo !== undefined ? updateData.rollNo : null;
      const enrollmentNo = updateData.enrollmentNo !== undefined ? updateData.enrollmentNo : null;

      const [result] = await this.db.execute(
        `UPDATE students SET roll_no = ?, enrollment_no = ?, branch = ?, year = ?, phone = ?, course = ?, updated_at = NOW() WHERE user_id = ?`,
        [rollNo, enrollmentNo, branch, year, phone, course, userId]
      );
      logger.info(`StudentModel: Updated student for user ID: ${userId}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`StudentModel: Error in updateByUserId for user ID ${userId}`, err);
      throw new Error('Failed to update student in database.');
    }
  }

  async create(studentData) {
    try {
      const { userId } = studentData;
      const rollNo = studentData.rollNo !== undefined ? studentData.rollNo : null;
      const enrollmentNo = studentData.enrollmentNo !== undefined ? studentData.enrollmentNo : null;
      const branch = studentData.branch !== undefined ? studentData.branch : null;
      const year = studentData.year !== undefined ? studentData.year : null;
      const phone = studentData.phone !== undefined ? studentData.phone : null;
      const course = studentData.course !== undefined ? studentData.course : null;

      const [result] = await this.db.execute(
        `INSERT INTO students (user_id, roll_no, enrollment_no, branch, year, phone, course, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, rollNo, enrollmentNo, branch, year, phone, course]
      );
      logger.info(`StudentModel: Created new student for user ID: ${userId}. Insert ID: ${result.insertId}`);
      return result.insertId;
    } catch (err) {
      logger.error(`StudentModel: Error in create student for user ID ${studentData.userId}`, err);
      throw new Error('Failed to create student in database.');
    }
  }

  async deleteByUserId(userId) {
    try {
      const [result] = await this.db.execute(`DELETE FROM students WHERE user_id = ?`, [userId]);
      logger.info(`StudentModel: Deleted student for user ID: ${userId}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`StudentModel: Error in deleteByUserId for user ID ${userId}`, err);
      throw new Error('Failed to delete student from database.');
    }
  }

  // Add a method to find by roll number if needed for uniqueness checks
  async findByRollNo(rollNo) {
    try {
      const [rows] = await this.db.execute('SELECT student_id FROM students WHERE roll_no = ? LIMIT 1', [rollNo]);
      return rows[0] || null;
    } catch (err) {
      logger.error(`StudentModel: Error in findByRollNo for rollNo ${rollNo}`, err);
      throw new Error('Failed to check student roll number uniqueness.');
    }
  }

  // Add a method to find by enrollment number if needed for uniqueness checks
  async findByEnrollmentNo(enrollmentNo) {
    try {
      const [rows] = await this.db.execute('SELECT student_id FROM students WHERE enrollment_no = ? LIMIT 1', [enrollmentNo]);
      return rows[0] || null;
    } catch (err) {
      logger.error(`StudentModel: Error in findByEnrollmentNo for enrollmentNo ${enrollmentNo}`, err);
      throw new Error('Failed to check student enrollment number uniqueness.');
    }
  }
}

export default StudentModel;