// backend/controllers/student/messPlan.controller.js
import messPlanService from '../../services/student/messPlanService.js';
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';

// Get all mess plans for the authenticated student
export const getMessPlans = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const plans = await messPlanService.getStudentMessPlans(userId);
  res.status(200).json({ success: true, data: plans });
});

// Create a new mess plan request for the authenticated student
export const createMessPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    return;
  }

  try {
    const newPlan = await messPlanService.createMessPlanRequest(userId, startDate, endDate);
    res.status(201).json({ success: true, message: 'Mess plan request submitted successfully.', data: newPlan });
  } catch (error) {
    // Catch specific errors thrown by the service and send appropriate status codes/messages
    if (error.message.includes('Start date cannot be in the past.')) { // New error message
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('End date cannot be before start date.')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('You have an overlapping active or pending mess plan request.')) { // Updated/new error message
      return res.status(409).json({ success: false, message: error.message }); // 409 Conflict for overlap
    }
    if (error.message.includes('Invalid start date or end date provided.')) { // New error message
        return res.status(400).json({ success: false, message: error.message });
    }
    // Generic error for other issues
    res.status(500).json({ success: false, message: 'Failed to create mess plan request: ' + error.message });
  }
});
