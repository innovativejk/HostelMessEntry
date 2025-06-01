// backend/controllers/admin/messPlan.controller.js
import adminMessPlanService from '../../services/admin/messPlanService.js';
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';

export const getAllMessPlans = asyncHandler(async (req, res) => {
  const plans = await adminMessPlanService.getAllMessPlansWithDetails();
  res.status(200).json({ success: true, data: plans });
});

export const approveMessPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const updatedPlan = await adminMessPlanService.approveMessPlan(planId);
  res.status(200).json({ success: true, message: 'Mess plan approved.', data: updatedPlan });
});

export const rejectMessPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason || rejectionReason.trim() === '') {
    res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    return;
  }

  const updatedPlan = await adminMessPlanService.rejectMessPlan(planId, rejectionReason);
  res.status(200).json({ success: true, message: 'Mess plan rejected.', data: updatedPlan });
});
