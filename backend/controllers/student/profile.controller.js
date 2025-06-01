// backend/controllers/student/profile.controller.js
import studentProfileService from '../../services/student/studentProfileService.js';

/**
 * @desc Get student profile
 * @route GET /api/student/profile
 * @access Private (Student)
 */
const getStudentProfile = async (req, res, next) => {
  try {
    // req.user is set by authenticateToken middleware, assuming it contains { id: userId }
    const userId = req.user.id; // Or req.user.userId, depending on your JWT payload structure
    const studentProfile = await studentProfileService.getStudentProfile(userId);
    res.status(200).json({ success: true, data: studentProfile });
  } catch (error) {
    next(error); // Pass error to your global error handler
  }
};

/**
 * @desc Update student profile
 * @route PUT /api/student/profile
 * @access Private (Student)
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const updateData = req.body;
    // req.user is set by authenticateToken middleware, assuming it contains { id: userId }
    const userId = req.user.id; // Or req.user.userId
    const updatedProfile = await studentProfileService.updateStudentProfile(userId, updateData);
    res.status(200).json({ success: true, data: updatedProfile, message: 'Profile updated successfully!' });
  } catch (error) {
    // Customize error responses based on error type if needed, or let errorHandler handle it
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('No valid fields')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error); // Pass other errors to your global error handler
  }
};

export {
  getStudentProfile,
  updateStudentProfile,
};