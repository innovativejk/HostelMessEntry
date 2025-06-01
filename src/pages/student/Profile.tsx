// src/pages/student/Profile.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Mail, Book, Calendar, Save, Home } from 'lucide-react';
import axios, { AxiosError } from 'axios'; 

interface StudentProfileData {
  name: string;
  email: string;
  phone: string;
  course: string;
  year: string;
  branch: string;
  enrollmentNumber: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: StudentProfileData;
}

const StudentProfile: React.FC = () => {
  useAuth(); // Changed: Removed unused 'authUser' destructuring. Call useAuth() if it has side effects or is needed by context/Layout.
               // If useAuth() is solely for providing 'authUser' and has no other side effects needed here, 
               // and AuthContext is not used by Layout in a way that requires this call, 
               // then this line (and potentially the import) could be removed.
               // For now, addressing the specific "authUser unused" error.

  const [profileData, setProfileData] = useState<StudentProfileData>({
    name: '',
    email: '',
    phone: '',
    course: '',
    year: '',
    branch: '',
    enrollmentNumber: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get<ApiResponse>('/api/student/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success && response.data.data) {
        setProfileData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>; // Now AxiosError type is available
      setError(
        axiosError.response?.data?.message || 
        'Failed to fetch profile. Please try again.'
      );
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await axios.put<ApiResponse>(
        '/api/student/profile', 
        profileData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success && response.data.data) {
        setProfileData(response.data.data);
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>; // Now AxiosError type is available
      setError(
        axiosError.response?.data?.message || 
        'Failed to update profile. Please try again.'
      );
      console.error('Profile update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Student Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Student Profile">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header with profile picture */}
          <div className="bg-blue-600 p-6">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">
                {profileData.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
              <p className="text-blue-100">{profileData.enrollmentNumber}</p>
            </div>
          </div>
          
          {/* Success and error messages */}
          {saveSuccess && (
            <div className="bg-green-50 text-green-700 p-3 text-sm flex items-center">
              <Save className="h-4 w-4 mr-2" />
              <span>Profile updated successfully!</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 text-sm flex items-center">
              <span>{error}</span>
            </div>
          )}
          {/* Changed: Removed duplicate error message block */}
          
          {/* Profile content */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">Profile Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-md text-sm font-medium 
                  ${isEditing 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={profileData.name}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2 px-3"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Email Field (read-only) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        readOnly
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 py-2 px-3 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2 px-3"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Course Field */}
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                      Course
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Book className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="course"
                        name="course"
                        type="text"
                        value={profileData.course}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2 px-3"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Year Field */}
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="year"
                        name="year"
                        value={profileData.year}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2 px-3"
                        required
                      >
                        <option value="">Select Year</option>
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Branch Field */}
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                      Branch
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Home className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="branch"
                        name="branch"
                        type="text"
                        value={profileData.branch}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2 px-3"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                      ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* View Mode - Display profile information */}
                <div className="flex border-b border-gray-100 py-3">
                  <div className="w-1/3 text-gray-500 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <span>Full Name</span>
                  </div>
                  <div className="w-2/3 text-gray-800 font-medium">{profileData.name}</div>
                </div>
                
                <div className="flex border-b border-gray-100 py-3">
                  <div className="w-1/3 text-gray-500 flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    <span>Email</span>
                  </div>
                  <div className="w-2/3 text-gray-800 font-medium">{profileData.email}</div>
                </div>
                
                <div className="flex border-b border-gray-100 py-3">
                  <div className="w-1/3 text-gray-500 flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    <span>Phone</span>
                  </div>
                  <div className="w-2/3 text-gray-800 font-medium">{profileData.phone}</div>
                </div>
                
                <div className="flex border-b border-gray-100 py-3">
                  <div className="w-1/3 text-gray-500 flex items-center">
                    <Book className="h-5 w-5 mr-2" />
                    <span>Course</span>
                  </div>
                  <div className="w-2/3 text-gray-800 font-medium">{profileData.course}</div>
                </div>
                
                <div className="flex border-b border-gray-100 py-3">
                  <div className="w-1/3 text-gray-500 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>Year</span>
                  </div>
                  <div className="w-2/3 text-gray-800 font-medium">{profileData.year}</div>
                </div>
                
                <div className="flex py-3">
                  <div className="w-1/3 text-gray-500 flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    <span>Branch</span>
                  </div>
                  <div className="w-2/3 text-gray-800 font-medium">{profileData.branch}</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md mt-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Your enrollment number cannot be changed. If there are any issues with your enrollment details, please contact the administration office.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentProfile;