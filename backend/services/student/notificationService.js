// backend/services/student/notificationService.js
import { getDB } from '../../config/database.js';

/**
 * @desc Fetches recent notifications for a given user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of notification objects.
 */
export const getRecentNotifications = async (userId) => {
    const db = getDB();
    const [rows] = await db.execute(
        `SELECT id, user_id, type, message, is_read AS \`read\`, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
    );
    return rows;
};