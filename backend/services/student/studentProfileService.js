// backend/services/Student/studentProfileService.js
 import StudentModel from '../../models/student.model.js';
 import { getDB } from '../../config/database.js';
 
 class StudentProfileService {
   constructor() {
     this.studentModel = new StudentModel();
   }
 
   get db() {
     return getDB();
   }
 
   /**
    * Fetches a student's full profile including user details.
    * Combines data from 'users' and 'students' tables.
    * @param {number} userId - The ID of the authenticated user.
    * @returns {Promise<Object>} The combined student and user profile data.
    * @throws {Error} If student profile or user details are not found.
    */
   async getStudentProfile(userId) {
     // 1. Fetch student-specific details from the students table
     const studentProfile = await this.studentModel.findByUserId(userId);
     if (!studentProfile) {
       throw new Error('Student profile not found.');
     }
 
     // 2. Fetch user details (name, email) from the users table
     // Use the getter here to get the DB instance
     const [userRows] = await this.db.execute('SELECT name, email FROM users WHERE id = ?', [userId]);
     if (userRows.length === 0) {
       throw new Error('User details not found for student.');
     }
     const userDetails = userRows[0];
 
     // Combine the data, prioritizing user details for name/email
     return {
       ...studentProfile,
       name: userDetails.name,
       email: userDetails.email,
     };
   }
 
   /**
    * Updates a student's profile across both users and students tables.
    * @param {number} userId - The ID of the authenticated user.
    * @param {Object} updateData - The data to update (name, phone, course, year, branch).
    * @returns {Promise<Object>} The updated student profile data.
    * @throws {Error} If student profile is not found for update or validation fails.
    */
   async updateStudentProfile(userId, updateData) {
     const { name, phone, course, year, branch } = updateData;
 
     let profileUpdated = false;
     let userUpdated = false;
 
     // 1. Fetch the existing student profile to preserve non-editable fields
     const existingStudentProfile = await this.studentModel.findByUserId(userId);
     if (!existingStudentProfile) {
         throw new Error('Student profile not found for update.');
     }
 
     // Prepare the payload for student model, ensuring all expected fields are present
     // and undefined values are replaced with existing ones or null
     const studentUpdatePayload = {
         phone: phone !== undefined ? phone : existingStudentProfile.phone || null,
         course: course !== undefined ? course : existingStudentProfile.course || null,
         year: year !== undefined ? year : existingStudentProfile.year || null,
         branch: branch !== undefined ? branch : existingStudentProfile.branch || null,
         // Important: Pass existing rollNo and enrollmentNo (from DB) as they are not editable from frontend
         rollNo: existingStudentProfile.rollNo || null,
         enrollmentNo: existingStudentProfile.enrollmentNumber || null // student.model.js maps enrollment_no to enrollmentNumber
     };
 
     // 2. Update fields in the 'students' table
     const studentUpdateResult = await this.studentModel.updateByUserId(userId, studentUpdatePayload);
     if (studentUpdateResult) {
         profileUpdated = true;
     }
 
     // 3. Update 'name' in the 'users' table if it's provided and changed
     if (name !== undefined) {
       const [userUpdateResult] = await this.db.execute(
         'UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?',
         [name, userId]
       );
       if (userUpdateResult.affectedRows > 0) {
         userUpdated = true;
       }
     }
 
     if (!profileUpdated && !userUpdated) {
         throw new Error('No valid fields provided for update or no changes made.');
     }
 
     // After updating, fetch the latest combined profile to return
     return this.getStudentProfile(userId);
   }
 }
 
 export default new StudentProfileService();