// backend/models/staff.model.js
import { getDB } from '../config/database.js';
import * as logger from '../utils/logger.js';

class StaffModel {
  get db() {
    return getDB();
  }

  async findByUserId(userId) {
    try {
      const [rows] = await this.db.execute(
        'SELECT staff_id, user_id, employee_id, position, phone, created_at, updated_at FROM staff WHERE user_id = ?',
        [userId]
      );
      const staffData = rows.length > 0 ? rows[0] : null;
      logger.info(`StaffModel: Found staff by user ID ${userId}: ${!!staffData}`);
      if (staffData) {
        return {
          staffId: staffData.staff_id,
          userId: staffData.user_id,
          employeeId: staffData.employee_id,
          position: staffData.position,
          phone: staffData.phone,
          createdAt: staffData.created_at,
          updatedAt: staffData.updated_at,
        };
      }
      return null;
    } catch (err) {
      logger.error(`StaffModel: Error in findByUserId for user ID ${userId}`, err);
      throw new Error('Failed to retrieve staff by user ID from database.');
    }
  }

  async updateByUserId(userId, updateData) {
    try {
      const { employeeId, position, phone } = updateData;
      const [result] = await this.db.execute(
        `UPDATE staff SET employee_id = ?, position = ?, phone = ?, updated_at = NOW() WHERE user_id = ?`,
        [employeeId, position, phone, userId]
      );
      logger.info(`StaffModel: Updated staff for user ID: ${userId}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`StaffModel: Error in updateByUserId for user ID ${userId}`, err);
      throw new Error('Failed to update staff in database.');
    }
  }

  async create(staffData) {
    try {
      const { userId, employeeId, position, phone } = staffData;
      const [result] = await this.db.execute(
        `INSERT INTO staff (user_id, employee_id, position, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [userId, employeeId, position, phone]
      );
      logger.info(`StaffModel: Created new staff for user ID: ${userId}. Insert ID: ${result.insertId}`);
      return result.insertId;
    } catch (err) {
      logger.error(`StaffModel: Error in create staff for user ID ${staffData.userId}`, err);
      throw new Error('Failed to create staff in database.');
    }
  }

  async deleteByUserId(userId) {
    try {
      const [result] = await this.db.execute(`DELETE FROM staff WHERE user_id = ?`, [userId]);
      logger.info(`StaffModel: Deleted staff for user ID: ${userId}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`StaffModel: Error in deleteByUserId for user ID ${userId}`, err);
      throw new Error('Failed to delete staff from database.');
    }
  }
}

export default StaffModel;