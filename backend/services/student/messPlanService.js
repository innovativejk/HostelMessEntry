// backend/services/Student/messPlanService.js
import MessPlanModel from '../../models/messPlan.model.js';
import { startOfDay, isBefore, addDays, format, isValid, parseISO, isAfter, isSameDay } from 'date-fns'; // Added isSameDay

class MessPlanService {
  constructor() {
    this.messPlanModel = new MessPlanModel();
  }

  async getStudentMessPlans(userId) {
    return await this.messPlanModel.findByUserId(userId);
  }

  async createMessPlanRequest(userId, startDateStr, endDateStr) {
    const today = startOfDay(new Date());
    const startDate = startOfDay(parseISO(startDateStr)); // Use parseISO for robust date parsing
    const endDate = startOfDay(parseISO(endDateStr));     // Use parseISO

    // Basic date validations
    if (!isValid(startDate) || !isValid(endDate)) {
        throw new Error('Invalid start date or end date provided.');
    }
    if (isBefore(endDate, startDate)) {
      throw new Error('End date cannot be before start date.');
    }
    // New plans can start from today or future, removing the "at least one day from now" restriction
    // if the requirement is that if today is the last day of current plan, new can start tomorrow.
    // However, if the current plan is still active for a few days, the new plan must start after it ends.
    if (isBefore(startDate, today)) {
        throw new Error('Start date cannot be in the past.');
    }


    const existingPlans = await this.messPlanModel.findByUserId(userId);

    // Check for overlapping active or pending plans
    const hasOverlappingPlan = existingPlans.some(plan => {
        const planStartDate = startOfDay(parseISO(plan.startDate));
        const planEndDate = startOfDay(parseISO(plan.endDate));

        // Consider only 'approved' and 'pending' plans for overlap check
        if (plan.status === 'approved' || plan.status === 'pending') {
            // Check for overlap:
            // (startDate is within existing plan) OR (endDate is within existing plan) OR
            // (existing plan starts within new plan) OR (existing plan ends within new plan)
            const overlaps = (
                (isAfter(startDate, planStartDate) || isSameDay(startDate, planStartDate)) && (isBefore(startDate, planEndDate) || isSameDay(startDate, planEndDate))
            ) || (
                (isAfter(endDate, planStartDate) || isSameDay(endDate, planStartDate)) && (isBefore(endDate, planEndDate) || isSameDay(endDate, planEndDate))
            ) || (
                (isAfter(planStartDate, startDate) || isSameDay(planStartDate, startDate)) && (isBefore(planStartDate, endDate) || isSameDay(planStartDate, endDate))
            ) || (
                (isAfter(planEndDate, startDate) || isSameDay(planEndDate, startDate)) && (isBefore(planEndDate, endDate) || isSameDay(planEndDate, endDate))
            );
            // Also, check if new plan completely encompasses an existing plan
            const encompasses = (
                (isBefore(startDate, planStartDate) || isSameDay(startDate, planStartDate)) && (isAfter(endDate, planEndDate) || isSameDay(endDate, planEndDate))
            );

            return overlaps || encompasses;
        }
        return false;
    });

    if (hasOverlappingPlan) {
      throw new Error('You have an overlapping active or pending mess plan request. Please ensure your new plan starts after your current plan ends.');
    }

    // Now, let's consider the specific requirement:
    // If the student has an active plan that expires today or in the near future,
    // they should be able to request a new plan that starts the day after their current plan ends.
    // The previous check already handles "overlapping". Here, we just ensure "next day" is allowed.

    const newPlan = await this.messPlanModel.create(userId, startDateStr, endDateStr);
    if (!newPlan) {
      throw new Error('Failed to create mess plan request.');
    }
    return newPlan;
  }

  async getActiveMessPlan(userId) {
    const db = this.messPlanModel.db;
    if (!db) {
      throw new Error('Database connection not available in MessPlanModel.');
    }

    const [rows] = await db.execute(
      `SELECT id, user_id AS userId, start_date AS startDate, end_date AS endDate, status, created_at AS createdAt, updated_at AS updatedAt
       FROM mess_plans
       WHERE user_id = ? AND status = 'approved' AND CURDATE() BETWEEN start_date AND end_date`,
      [userId]
    );

    const plan = rows.length > 0 ? rows[0] : null;
    if (plan) {
        return {
            ...plan,
            startDate: plan.startDate ? format(new Date(plan.startDate), 'yyyy-MM-dd') : null,
            endDate: plan.endDate ? format(new Date(plan.endDate), 'yyyy-MM-dd') : null,
            createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : null,
            updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : null,
        };
    }
    return null;
  }
}

export default new MessPlanService();
