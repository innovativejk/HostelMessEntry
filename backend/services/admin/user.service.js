// backend/services/admin/user.service.js
import UserModel from '../../models/user.model.js';
import StudentModel from '../../models/student.model.js';
import StaffModel from '../../models/staff.model.js';
import bcrypt from 'bcrypt';

class UserService {
  constructor() {
    this.userModel = new UserModel();
    this.studentModel = new StudentModel();
    this.staffModel = new StaffModel();
  }

  async getAllUsers() {
    const users = await this.userModel.findAll();
    const formattedUsers = [];

    for (const user of users) {
      let details = {};
      let phone = null;
      if (user.role === 'student') {
        const student = await this.studentModel.findByUserId(user.id);
        if (student) {
          details = {
            studentId: student.studentId,
            enrollmentNumber: student.enrollmentNumber,
            course: student.course,
            year: student.year,
            branch: student.branch,
            rollNo: student.rollNo
          };
          phone = student.phone;
        }
      } else if (user.role === 'staff') {
        const staff = await this.staffModel.findByUserId(user.id);
        if (staff) {
          details = {
            staffId: staff.staffId,
            employeeId: staff.employeeId,
            position: staff.position
          };
          phone = staff.phone;
        }
      }

      formattedUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: phone,
        ...details
      });
    }
    return formattedUsers;
  }

  async getUserById(id) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    let details = {};
    let phone = null;
    if (user.role === 'student') {
      const student = await this.studentModel.findByUserId(user.id);
      if (student) {
        details = {
          studentId: student.studentId,
          enrollmentNumber: student.enrollmentNumber,
          course: student.course,
          year: student.year,
          branch: student.branch,
          rollNo: student.rollNo
        };
        phone = student.phone;
      }
    } else if (user.role === 'staff') {
      const staff = await this.staffModel.findByUserId(user.id);
      if (staff) {
        details = {
          staffId: staff.staffId,
          employeeId: staff.employeeId,
          position: staff.position
        };
        phone = staff.phone;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: phone,
      ...details
    };
  }

  async createUser(userData) {
    const { name, email, password, role, status = 'pending', studentData, staffData } = userData;

    const existingUser = await this.userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await this.userModel.create(name, email, hashedPassword, role, status);

    if (role === 'student') {
      await this.studentModel.create({ userId, ...studentData });
    } else if (role === 'staff') {
      await this.staffModel.create({ userId, ...staffData });
    } else {
      await this.userModel.delete(userId);
      throw new Error('Invalid role or missing role-specific data.');
    }

    return userId;
  }

  async updateUser(userId, userData) {
    const { name, email, role, status, newPassword, studentData, staffData, phone } = userData;

    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
        throw new Error('User not found for update.');
    }

    if (email) {
      const existingUserWithEmail = await this.userModel.findByEmail(email);
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        throw new Error('Email already taken by another user.');
      }
    }

    // Update user base data, allowing fields to be optional in payload if not changed
    const userUpdateSuccess = await this.userModel.update(
        userId,
        name !== undefined ? name : currentUser.name,
        email !== undefined ? email : currentUser.email,
        role !== undefined ? role : currentUser.role,
        status !== undefined ? status : currentUser.status
    );

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userModel.updatePassword(userId, hashedPassword);
    }

    // Handle role-specific data update (and potentially phone update)
    if (role === 'student') {
        if (!studentData) {
            throw new Error('Student data is required for student role update.');
        }
        await this.studentModel.updateByUserId(userId, { ...studentData, phone });
    } else if (role === 'staff') {
        if (!staffData) {
            throw new Error('Staff data is required for staff role update.');
        }
        await this.staffModel.updateByUserId(userId, { ...staffData, phone });
    } else {
        // This case would primarily occur if the role itself changed, or if validation passed but
        // data for the new role is missing. Your validators should ideally catch this.
        // For robustness, consider if a role change requires clearing old associated data.
    }

    return userUpdateSuccess;
  }

  async deleteUser(userId) {
    const deleted = await this.userModel.delete(userId);
    if (!deleted) {
      throw new Error('User not found or could not be deleted.');
    }
    return true;
  }
}

export default new UserService();