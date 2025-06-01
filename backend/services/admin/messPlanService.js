// backend/services/Admin/messPlanService.js
import MessPlanModel from '../../models/messPlan.model.js';

class AdminMessPlanService {
  constructor() {
    this.messPlanModel = new MessPlanModel();
  }

  async getAllMessPlansWithDetails() {
    return await this.messPlanModel.findAllWithStudentDetails();
  }

  async approveMessPlan(planId) {
    const updated = await this.messPlanModel.updateStatus(planId, 'approved');
    if (!updated) {
      throw new Error('Failed to approve mess plan. It might not exist or its status is not pending.');
    }
    return await this.messPlanModel.findByIdWithStudentDetails(planId);
  }

  async rejectMessPlan(planId, rejectionReason) {
    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new Error('Rejection reason is required.');
    }
    const updated = await this.messPlanModel.updateStatus(planId, 'rejected', rejectionReason);
    if (!updated) {
      throw new Error('Failed to reject mess plan. It might not exist or its status is not pending.');
    }
    return await this.messPlanModel.findByIdWithStudentDetails(planId);
  }
}

export default new AdminMessPlanService();
