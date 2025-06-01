// backend/controllers/admin/dashboard.controller.js

import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import { getDB } from '../../config/database.js'; // Assuming you have a getDB function for database connection

/**
 * @desc Get dashboard summary statistics for admin
 * @route GET /api/admin/dashboard-stats
 * @access Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const db = getDB();

  // Fetch Total Students
  const [totalStudentsResult] = await db.execute(
    `SELECT COUNT(*) AS count FROM users WHERE role = 'student'`
  );
  const totalStudents = totalStudentsResult[0].count;

  // Fetch Total Staff
  const [totalStaffResult] = await db.execute(
    `SELECT COUNT(*) AS count FROM users WHERE role = 'staff'`
  );
  const totalStaff = totalStaffResult[0].count;

  // Fetch Active Mess Plans (assuming 'approved' status means active)
  const [activeMessPlansResult] = await db.execute(
    `SELECT COUNT(*) AS count FROM mess_plans WHERE status = 'approved'`
  );
  const activeMessPlans = activeMessPlansResult[0].count;

  // Fetch Pending Mess Plans (with student details for display)
  // We need to join mess_plans with users (for name) and students (for enrollment_no)
  const [pendingMessPlans] = await db.execute(
    `SELECT
        mp.id,
        mp.user_id AS studentId, -- Corrected: uses user_id from mess_plans
        mp.start_date AS startDate,
        mp.end_date AS endDate,
        mp.status,
        mp.created_at AS createdAt,
        u.name AS studentName,
        s.enrollment_no AS enrollmentNumber -- Corrected: uses enrollment_no from students table
    FROM
        mess_plans mp
    JOIN
        users u ON mp.user_id = u.id -- Corrected: join on mess_plans.user_id
    LEFT JOIN
        students s ON u.id = s.user_id -- Links users table to students table
    WHERE
        mp.status = 'pending'
    ORDER BY
        mp.created_at DESC
    LIMIT 5` // Limit to 5 for dashboard display
  );

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalStaff,
      activeMessPlans,
      pendingMessPlans,
    },
  });
});