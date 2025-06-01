// backend/models/user.model.js
import { getDB } from '../config/database.js';
import * as logger from '../utils/logger.js'; // Import the logger

class UserModel {
  get db() {
    return getDB();
  }

  async findAll() {
    try {
      const [rows] = await this.db.execute(`SELECT id, name, email, role, status, created_at, updated_at FROM users`);
      logger.info('UserModel: Fetched all users.');
      return rows;
    } catch (err) {
      logger.error('UserModel: Error in findAll', err);
      throw new Error('Failed to retrieve all users from database.'); // Re-throw a generic error
    }
  }

  async findById(id) {
    try {
      const [rows] = await this.db.execute(`SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?`, [id]);
      const user = rows.length > 0 ? rows[0] : null;
      logger.info(`UserModel: Found user by ID ${id}: ${!!user}`);
      return user;
    } catch (err) {
      logger.error(`UserModel: Error in findById for ID ${id}`, err);
      throw new Error('Failed to retrieve user by ID from database.');
    }
  }

  async findByEmail(email) {
    try {
      const [rows] = await this.db.execute(`SELECT id, name, email, password, role, status, created_at, updated_at FROM users WHERE email = ?`, [email]);
      const user = rows.length > 0 ? rows[0] : null;
      logger.info(`UserModel: Found user by email ${email}: ${!!user}`);
      return user;
    } catch (err) {
      logger.error(`UserModel: Error in findByEmail for email ${email}`, err);
      throw new Error('Failed to retrieve user by email from database.');
    }
  }

  async create(name, email, hashedPassword, role, status = 'pending') {
    try {
      const [result] = await this.db.execute(
        `INSERT INTO users (name, email, password, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, email, hashedPassword, role, status]
      );
      logger.info(`UserModel: Created new user with ID: ${result.insertId}`);
      return result.insertId;
    } catch (err) {
      logger.error('UserModel: Error in create user', err, { email });
      throw new Error('Failed to create user in database.');
    }
  }

  async update(id, name, email, role, status) {
    try {
      const [result] = await this.db.execute(
        `UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = NOW() WHERE id = ?`,
        [name, email, role, status, id]
      );
      logger.info(`UserModel: Updated user with ID: ${id}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`UserModel: Error in update user for ID ${id}`, err);
      throw new Error('Failed to update user in database.');
    }
  }

  async delete(id) {
    try {
      const [result] = await this.db.execute(`DELETE FROM users WHERE id = ?`, [id]);
      logger.info(`UserModel: Deleted user with ID: ${id}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`UserModel: Error in delete user for ID ${id}`, err);
      throw new Error('Failed to delete user from database.');
    }
  }

  async updatePassword(userId, newHashedPassword) {
    try {
      const [result] = await this.db.execute(
        `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
        [newHashedPassword, userId]
      );
      logger.info(`UserModel: Updated password for user ID: ${userId}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`UserModel: Error in updatePassword for user ID ${userId}`, err);
      throw new Error('Failed to update user password in database.');
    }
  }

  async updateStatus(userId, status) {
    try {
      const [result] = await this.db.execute(
        `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, userId]
      );
      logger.info(`UserModel: Updated status for user ID: ${userId} to ${status}. Affected rows: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`UserModel: Error in updateStatus for user ID ${userId}`, err);
      throw new Error('Failed to update user status in database.');
    }
  }
}

export default UserModel;