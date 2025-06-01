import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/database.js';
import { jwtSecret, jwtExpiration } from '../config/auth.js';
import StudentModel from '../models/student.model.js';
import UserModel from '../models/user.model.js';
import StaffModel from '../models/staff.model.js';

class AuthService {
  constructor() {
    this.userModel = new UserModel();
    this.studentModel = new StudentModel();
    this.staffModel = new StaffModel();
  }

  get db() {
    return getDB();
  }

  async registerStudentUser(data) {
    const db = this.db;
    const { name, email, password, rollNo, enrollmentNo, branch, year, phone, course } = data;

    const [existingUsers] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existingUsers.length > 0) {
        throw new Error('Email already registered. Please use a different email or log in.');
    }

    const [existingRollNo] = await db.query(`SELECT student_id FROM students WHERE roll_no = ? LIMIT 1`, [rollNo]);
    if (existingRollNo.length > 0) {
        throw new Error('Roll Number already registered.');
    }

    const [existingEnrollmentNo] = await db.query(`SELECT student_id FROM students WHERE enrollment_no = ? LIMIT 1`, [enrollmentNo]);
    if (existingEnrollmentNo.length > 0) {
        throw new Error('Enrollment Number already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await this.userModel.create(name, email, hashedPassword, 'student', 'pending');
    const studentId = await this.studentModel.create({
      userId, rollNo, enrollmentNo, branch, year, phone, course
    });

    return studentId;
  }

  async loginUser(email, password, role) {
    const user = await this.userModel.findByEmail(email);

    if (!user || user.role !== role) {
      throw new Error('EMAIL_OR_ROLE_MISMATCH');
    }

    if (user.status === 'pending') {
      throw new Error('PENDING_APPROVAL');
    }
    if (user.status === 'suspended') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new Error('INCORRECT_PASSWORD');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    const fullUserProfile = await this.getUserProfile(user.id);

    return { token, user: fullUserProfile };
  }

  async getUserProfile(userId) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;

    let details = {};
    let userPhone = null;

    if (user.role === 'student') {
      const student = await this.studentModel.findByUserId(userId);
      if (student) {
        details = {
          studentId: student.student_id,
          enrollmentNumber: student.enrollment_no,
          course: student.course,
          year: student.year,
          branch: student.branch,
          rollNo: student.roll_no,
          phone: student.phone
        };
        userPhone = student.phone;
      }
    } else if (user.role === 'staff') {
      const staff = await this.staffModel.findByUserId(userId);
      if (staff) {
        details = {
          staffId: staff.staff_id,
          employeeId: staff.employee_id,
          position: staff.position,
          phone: staff.phone
        };
        userPhone = staff.phone;
      }
    }

    return {
      ...userWithoutPassword,
      ...details,
      phone: userPhone || null
    };
  }
}

export default new AuthService();