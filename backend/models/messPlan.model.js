// backend/models/messPlan.model.js
import { getDB } from '../config/database.js';
import { format } from 'date-fns';
import * as logger from '../utils/logger.js';

class MessPlanModel {
  get db() {
    return getDB();
  }

  /**
   * @desc Finds all mess plans with associated student and user details.
   * @returns {Promise<Array>} A promise that resolves to an array of mess plan objects.
   */
  async findAllWithStudentDetails() {
    try {
      const [rows] = await this.db.execute(
        `SELECT
            mp.id,
            mp.user_id AS studentId,
            mp.start_date AS startDate,
            mp.end_date AS endDate,
            mp.status,
            mp.created_at AS createdAt,
            mp.updated_at AS updatedAt,
            mp.rejection_reason AS rejectionReason,
            u.name AS studentName,
            s.enrollment_no AS enrollmentNumber
        FROM
            mess_plans mp
        JOIN
            users u ON mp.user_id = u.id
        LEFT JOIN
            students s ON u.id = s.user_id
        ORDER BY
            mp.created_at DESC`
      );
      logger.info(`MessPlanModel: Fetched all mess plans with student details. Count: ${rows.length}`);
      // Convert Date objects to frontend-friendly formats
      return rows.map(row => ({
        ...row,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
        startDate: row.startDate ? format(new Date(row.startDate), 'yyyy-MM-dd') : null,
        endDate: row.endDate ? format(new Date(row.endDate), 'yyyy-MM-dd') : null,
      }));
    } catch (err) {
      logger.error('MessPlanModel: Error in findAllWithStudentDetails', err);
      throw new Error('Failed to retrieve all mess plans with student details from database.');
    }
  }

  async findByUserId(userId) {
    try {
      const [rows] = await this.db.execute(
        `SELECT
           mp.id,
           mp.user_id AS studentId,
           mp.start_date AS startDate,
           mp.end_date AS endDate,
           mp.status,
           mp.rejection_reason AS rejectionReason,
           mp.created_at AS createdAt,
           mp.updated_at AS updatedAt
         FROM mess_plans mp
         WHERE mp.user_id = ?
         ORDER BY mp.created_at DESC`,
        [userId]
      );
      logger.info(`MessPlanModel: Fetched mess plans for user ID ${userId}. Count: ${rows.length}`);
      // Convert Date objects to frontend-friendly formats
      return rows.map(row => ({
        ...row,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
        startDate: row.startDate ? format(new Date(row.startDate), 'yyyy-MM-dd') : null,
        endDate: row.endDate ? format(new Date(row.endDate), 'yyyy-MM-dd') : null,
      }));
    } catch (err) {
      logger.error(`MessPlanModel: Error in findByUserId for user ID ${userId}`, err);
      throw new Error('Failed to retrieve mess plans by user ID from database.');
    }
  }

  async create(userId, startDate, endDate) {
    try {
      const [result] = await this.db.execute(
        `INSERT INTO mess_plans (user_id, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
        [userId, startDate, endDate]
      );
      logger.info(`MessPlanModel: Created new mess plan for user ID: ${userId}. Insert ID: ${result.insertId}`);
      return result.insertId;
    } catch (err) {
      logger.error(`MessPlanModel: Error in create mess plan for user ID ${userId}`, err);
      throw new Error('Failed to create mess plan in database.');
    }
  }

  async findById(planId) {
    try {
      const [rows] = await this.db.execute(
        `SELECT
           mp.id,
           mp.user_id AS studentId,
           mp.start_date AS startDate,
           mp.end_date AS endDate,
           mp.status,
           mp.rejection_reason AS rejectionReason,
           mp.created_at AS createdAt,
           mp.updated_at AS updatedAt
         FROM mess_plans mp
         WHERE mp.id = ?`,
        [planId]
      );
      const plan = rows.length > 0 ? rows[0] : null;
      logger.info(`MessPlanModel: Found mess plan by ID ${planId}: ${!!plan}`);
      if (plan) {
        return {
          ...plan,
          createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : null,
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : null,
          startDate: plan.startDate ? format(new Date(plan.startDate), 'yyyy-MM-dd') : null,
          endDate: plan.endDate ? format(new Date(plan.endDate), 'yyyy-MM-dd') : null,
        };
      }
      return null;
    } catch (err) {
      logger.error(`MessPlanModel: Error in findById for plan ID ${planId}`, err);
      throw new Error('Failed to retrieve mess plan by ID from database.');
    }
  }

  async updateStatus(planId, status, rejectionReason = null) {
    try {
      const [result] = await this.db.execute(
        `UPDATE mess_plans SET status = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?`,
        [status, rejectionReason, planId]
      );
      logger.info(`MessPlanModel: Updated status for mess plan ID: ${planId} to ${status}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`MessPlanModel: Error in updateStatus for plan ID ${planId}`, err);
      throw new Error('Failed to update mess plan status in database.');
    }
  }

  async findAllPending() {
    try {
      const [rows] = await this.db.execute(
        `SELECT
           mp.id,
           mp.user_id AS studentId,
           mp.start_date AS startDate,
           mp.end_date AS endDate,
           mp.status,
           u.name AS studentName,
           s.enrollment_no AS enrollmentNumber
         FROM mess_plans mp
         JOIN users u ON mp.user_id = u.id
         LEFT JOIN students s ON u.id = s.user_id
         WHERE mp.status = 'pending'
         ORDER BY mp.created_at ASC`
      );
      logger.info(`MessPlanModel: Fetched all pending mess plans. Count: ${rows.length}`);
      return rows.map(row => ({
        ...row,
        startDate: row.startDate ? format(new Date(row.startDate), 'yyyy-MM-dd') : null,
        endDate: row.endDate ? format(new Date(row.endDate), 'yyyy-MM-dd') : null,
      }));
    } catch (err) {
      logger.error('MessPlanModel: Error in findAllPending', err);
      throw new Error('Failed to retrieve pending mess plans from database.');
    }
  }

  /**
   * @desc Finds a single mess plan by ID with associated student and user details.
   * @param {number} planId - The ID of the mess plan.
   * @returns {Promise<Object|null>} A promise that resolves to the mess plan object or null if not found.
   */
  async findByIdWithStudentDetails(planId) {
    try {
      const [rows] = await this.db.execute(
        `SELECT
           mp.id,
           mp.user_id AS studentId,
           mp.start_date AS startDate,
           mp.end_date AS endDate,
           mp.status,
           mp.rejection_reason AS rejectionReason,
           mp.created_at AS createdAt,
           mp.updated_at AS updatedAt,
           u.name AS studentName,
           s.enrollment_no AS enrollmentNumber
         FROM mess_plans mp
         JOIN users u ON mp.user_id = u.id
         LEFT JOIN students s ON mp.user_id = s.user_id
         WHERE mp.id = ?`,
        [planId]
      );
      const plan = rows.length > 0 ? rows[0] : null;
      logger.info(`MessPlanModel: Found mess plan with student details by ID ${planId}: ${!!plan}`);
      if (plan) {
        return {
          ...plan,
          createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : null,
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : null,
          startDate: plan.startDate ? format(new Date(plan.startDate), 'yyyy-MM-dd') : null,
          endDate: plan.endDate ? format(new Date(plan.endDate), 'yyyy-MM-dd') : null,
        };
      }
      return null;
    } catch (err) {
      logger.error(`MessPlanModel: Error in findByIdWithStudentDetails for plan ID ${planId}`, err);
      throw new Error('Failed to retrieve mess plan with student details from database.');
    }
  }

  async deleteOldMessPlans(monthsThreshold) {
    try {
      // Calculate the date threshold
      const dateThreshold = new Date();
      dateThreshold.setMonth(dateThreshold.getMonth() - monthsThreshold);
      const formattedThreshold = format(dateThreshold, 'yyyy-MM-dd');

      const [result] = await this.db.execute(
        `DELETE FROM mess_plans WHERE end_date < ? AND status IN ('approved', 'rejected')`,
        [formattedThreshold]
      );
      logger.info(`MessPlanModel: Deleted ${result.affectedRows} old mess plans older than ${monthsThreshold} months.`);
      return result.affectedRows;
    } catch (err) {
      logger.error(`MessPlanModel: Error in deleteOldMessPlans for threshold ${monthsThreshold}`, err);
      throw new Error('Failed to delete old mess plans from database.');
    }
  }
}

export default MessPlanModel;
