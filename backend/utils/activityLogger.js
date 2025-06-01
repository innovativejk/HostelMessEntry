// backend/utils/activityLogger.js
import { getDB } from '../config/database.js';
import * as logger from './logger.js'; // Use the new logger

const logActivity = async (type, description, entityId = null, entityType = null) => {
  try {
    const db = getDB();
    await db.execute(
      `INSERT INTO activities (type, description, entity_id, entity_type, created_at)
       VALUES (?, ?, ?, ?, NOW())`, // Added created_at
      [type, description, entityId, entityType]
    );
    // logger.info(`Activity logged: ${type} - ${description}`); // Optional: log activity logging
  } catch (error) {
    logger.error('Failed to log activity:', error, { type, description, entityId, entityType });
    // You might want to handle this more robustly, e.g., log to a file, send alert
  }
};

export { logActivity };