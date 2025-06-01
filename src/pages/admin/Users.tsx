// Users.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Search, Plus, Edit, Trash, User, Book, Mail, Phone, Save, X, Eye, EyeOff } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin' | string;
  status: 'pending' | 'approved' | 'suspended' | string;
  phone?: string;
  studentId?: number;
  course?: string;
  year?: string;
  branch?: string;
  enrollmentNumber?: string;
  rollNo?: string;
  staffId?: number;
  employeeId?: string;
  position?: string;
}

type UserRoleFilter = 'all' | 'student' | 'staff';
type UserStatusFilter = 'all' | 'pending' | 'approved' | 'suspended';
type EditingUser = User | null;

interface UserFormProps {
  initialData: EditingUser;
  onSave: (user: User) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isAdding: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSave, onCancel, isSubmitting, isAdding }) => {
  const [formData, setFormData] = useState<User>(
    initialData || {
      id: 0,
      name: '',
      email: '',
      role: 'student',
      status: 'pending',
      phone: '',
      course: '', year: '', branch: '', enrollmentNumber: '', rollNo: '',
      employeeId: '', position: ''
    }
  );

  useEffect(() => {
    setFormData(initialData || {
      id: 0, name: '', email: '', role: 'student', status: 'pending', phone: '',
      course: '', year: '', branch: '', enrollmentNumber: '', rollNo: '',
      employeeId: '', position: ''
    });
  }, [initialData, isAdding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: User['role']) => {
    setFormData(prev => ({
      ...prev,
      role,
      course: role === 'student' ? prev.course : '',
      year: role === 'student' ? prev.year : '',
      branch: role === 'student' ? prev.branch : '',
      enrollmentNumber: role === 'student' ? prev.enrollmentNumber : '',
      rollNo: role === 'student' ? prev.rollNo : '',
      employeeId: role === 'staff' ? prev.employeeId : '',
      position: role === 'staff' ? prev.position : '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          {isAdding ? 'Add New User' : 'Edit User'}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-500" disabled={isSubmitting}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  id="role-student"
                  name="role"
                  type="radio"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={() => handleRoleChange('student')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting || !isAdding}
                />
                <label htmlFor="role-student" className="ml-2 block text-sm text-gray-700">Student</label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-staff"
                  name="role"
                  type="radio"
                  value="staff"
                  checked={formData.role === 'staff'}
                  onChange={() => handleRoleChange('staff')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting || !isAdding}
                />
                <label htmlFor="role-staff" className="ml-2 block text-sm text-gray-700">Staff</label>
              </div>
            </div>
          </div>

          {!isAdding && (
             <div className="md:col-span-2">
             <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
             <select
               id="status"
               name="status"
               value={formData.status}
               onChange={handleChange}
               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
               disabled={isSubmitting}
             >
               <option value="pending">Pending</option>
               <option value="approved">Approved</option>
               <option value="suspended">Suspended</option>
             </select>
           </div>
          )}


          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="John Doe" required disabled={isSubmitting} />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="john@example.com" required disabled={isSubmitting} />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
              <input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="9876543210" disabled={isSubmitting} />
            </div>
          </div>
          
          {formData.role === 'student' && (
            <>
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Book className="h-5 w-5 text-gray-400" /></div>
                  <input id="course" name="course" type="text" value={formData.course || ''} onChange={handleChange} className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="B.Tech" disabled={isSubmitting} />
                </div>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input id="year" name="year" type="text" value={formData.year || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="4th Year" disabled={isSubmitting} />
              </div>
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input id="branch" name="branch" type="text" value={formData.branch || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Computer Science" disabled={isSubmitting} />
              </div>
              <div>
                <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-700 mb-1">Enrollment No.</label>
                <input id="enrollmentNumber" name="enrollmentNumber" type="text" value={formData.enrollmentNumber || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="ENR20230001" disabled={isSubmitting} />
              </div>
              <div>
                <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 mb-1">Roll No.</label>
                <input id="rollNo" name="rollNo" type="text" value={formData.rollNo || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="S2023001" disabled={isSubmitting} />
              </div>
            </>
          )}

          {formData.role === 'staff' && (
            <>
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input id="employeeId" name="employeeId" type="text" value={formData.employeeId || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="EMP001" disabled={isSubmitting} />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input id="position" name="position" type="text" value={formData.position || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Head of Department (CSE)" disabled={isSubmitting} />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 inline mr-1" />
              {isSubmitting ? 'Saving...' : (isAdding ? 'Create User' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshUsers, setRefreshUsers] = useState<boolean>(false);

  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not available. Please log in.');
        setUsers([]);
        return;
      }

      const response = await axios.get<User[]>('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedData: User[] = Array.isArray(response.data)
        ? (response.data as any[]).filter((u: any): u is User => typeof u.id === 'number')
        : [];
      setUsers(fetchedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
      setUsers([]);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshUsers]);

  const filteredAndSearchedUsers = users.filter(user => {
    if (user.role === 'admin') {
      return false;
    }

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    const matchesSearch = !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery)) ||
      (user.role === 'student' && (
        (user.enrollmentNumber && user.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.rollNo && user.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
      )) ||
      (user.role === 'staff' && (
        (user.employeeId && user.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.position && user.position.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleAddUserClick = () => {
    setIsAddingUser(true);
    setEditingUser(null);
    setError(null);
  };

  const handleEditUserClick = (user: User) => {
    setEditingUser(user);
    setIsAddingUser(false);
    setError(null);
  };

  const handleToggleUserStatus = async (user: User) => {
    let newStatus: User['status'];
    if (user.status === 'pending') {
      newStatus = 'approved';
      if (!confirm(`Are you sure you want to APPROVE user "${user.name}"?`)) return;
    } else if (user.status === 'approved') {
      newStatus = 'suspended';
      if (!confirm(`Are you sure you want to SUSPEND user "${user.name}"? They will not be able to login.`)) return;
    } else {
      newStatus = 'approved';
      if (!confirm(`Are you sure you want to ACTIVATE user "${user.name}"?`)) return;
    }

    setIsSubmittingForm(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not available.'); }

      // Make sure to send the full user object including current role-specific data
      // along with the updated status. The backend expects this for validation.
      const payloadToSend = { ...user, status: newStatus };
      
      // If the user object directly contains phone, course, branch, etc. at the top level
      // then your backend's user.service.js update method needs to correctly extract them.
      // Given your backend's user.service.js, it expects studentData/staffData.
      // So, we need to structure the payload correctly.

      let structuredPayload: any = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: newStatus,
        phone: user.phone || null, // Ensure phone is sent
      };

      if (user.role === 'student') {
        structuredPayload.studentData = {
          rollNo: user.rollNo || null,
          enrollmentNo: user.enrollmentNumber || null, // Note: Frontend uses enrollmentNumber, backend expects enrollmentNo
          branch: user.branch || null,
          year: user.year || null,
          course: user.course || null,
        };
      } else if (user.role === 'staff') {
        structuredPayload.staffData = {
          employeeId: user.employeeId || null,
          position: user.position || null,
        };
      }

      await axios.put(`/api/admin/users/${user.id}`, structuredPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshUsers(prev => !prev);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status.');
      console.error('Error updating user status:', err);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    setIsSubmittingForm(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not available.'); }

      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshUsers(prev => !prev);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      console.error('Error deleting user:', err);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleSaveUser = async (userData: User) => {
    setIsSubmittingForm(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not available.'); }

      // Construct payload based on whether it's adding or editing, and role
      let payload: any = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        phone: userData.phone || null,
      };

      if (userData.role === 'student') {
        payload.studentData = {
          rollNo: userData.rollNo || null,
          enrollmentNo: userData.enrollmentNumber || null, // Corrected: frontend uses enrollmentNumber, backend expects enrollmentNo
          branch: userData.branch || null,
          year: userData.year || null,
          course: userData.course || null,
        };
      } else if (userData.role === 'staff') {
        payload.staffData = {
          employeeId: userData.employeeId || null,
          position: userData.position || null,
        };
      }

      if (isAddingUser) {
        // For new users, a password is required in the backend validator
        // We'll use a placeholder if not explicitly provided in the form,
        // or you might want to add a password field to the UserForm for new users.
        payload.password = 'default_password'; // Consider a secure way to handle initial passwords
        await axios.post('/api/admin/users', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (editingUser) {
        // For updates, 'newPassword' field in backend validator is optional
        // If password is changed, add it to payload
        // You'll need to add a 'newPassword' field to your UserForm if you want to allow password changes.
        // For now, it will only update other fields.
        await axios.put(`/api/admin/users/${userData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsAddingUser(false);
      setEditingUser(null);
      setRefreshUsers(prev => !prev);
    } catch (err: any) {
      // Improved error handling to show specific validation messages from backend
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors.map((e: any) => e.msg).join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else {
        setError(err.response?.data?.message || 'Failed to save user.');
      }
      console.error('Error saving user:', err);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleCancelForm = () => {
    setIsAddingUser(false);
    setEditingUser(null);
    setError(null);
  };

  if (loading) {
    return (
      <Layout title="User Management">
        <div className="text-center py-8">Loading users...</div>
      </Layout>
    );
  }

  return (
    <Layout title="User Management">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Users</h2>
          <p className="text-gray-600">Manage students and staff accounts</p>
        </div>

        <button
          onClick={handleAddUserClick}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter by role:</span>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 text-sm rounded-l-md ${
                    roleFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRoleFilter('student')}
                  className={`px-3 py-1 text-sm ${
                    roleFilter === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Students
                </button>
                <button
                  onClick={() => setRoleFilter('staff')}
                  className={`px-3 py-1 text-sm rounded-r-md ${
                    roleFilter === 'staff' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 text-sm rounded-l-md ${
                    statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 text-sm ${
                    statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1 text-sm ${
                    statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('suspended')}
                  className={`px-3 py-1 text-sm rounded-r-md ${
                    statusFilter === 'suspended' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Form for Add/Edit */}
      {(isAddingUser || editingUser) && (
        <UserForm
          initialData={editingUser}
          onSave={handleSaveUser}
          onCancel={handleCancelForm}
          isSubmitting={isSubmittingForm}
          isAdding={isAddingUser}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* REMOVE NEWLINES HERE */}
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSearchedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium capitalize">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.role === 'student' && user.enrollmentNumber}
                          {user.role === 'staff' && user.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                      ${user.role === 'student' ? 'bg-blue-100 text-blue-800' : ''}
                      ${user.role === 'staff' ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                      ${user.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      ${user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${user.status === 'suspended' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role === 'student'
                      ? `${user.course || ''}, ${user.year || ''}`
                      : user.position || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUserClick(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit User"
                      disabled={isSubmittingForm}
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {user.status === 'pending' && (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Approve User"
                          disabled={isSubmittingForm}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                    )}
                     {user.status === 'approved' && (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="text-orange-600 hover:text-orange-900 mr-3"
                          title="Suspend User"
                          disabled={isSubmittingForm}
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                    )}
                    {user.status === 'suspended' && (
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Activate User"
                          disabled={isSubmittingForm}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                    )}

                    {currentUser && user.id !== currentUser.id && user.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                        disabled={isSubmittingForm}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredAndSearchedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredAndSearchedUsers.length}</span> out of <span className="font-medium">{users.length}</span> total users
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;