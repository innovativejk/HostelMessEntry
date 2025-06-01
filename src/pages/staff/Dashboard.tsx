// src/pages/staff/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Scan, ClipboardList, Users, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { format, isValid } from 'date-fns';

// --- Type Definitions ---
interface StaffDashboardSummary {
  totalStudents: number;
  studentsAttendedToday: number;
  activeMeal: 'breakfast' | 'lunch' | 'dinner' | null;
  activeMealAttendance: number;
  todayBreakfastCount: number;
  todayLunchCount: number;
  todayDinnerCount: number;
}

interface RecentAttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  rollNo: string;
  enrollmentNo: string;
  date: string; //YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  markedAt: string; // ISO string
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Helper function to process Axios responses and ensure consistent ApiResponse structure
const processApiResponse = <T,>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> => {
  return response.data;
};

// Helper function to handle Axios errors and return a consistent ApiResponse structure
const handleAxiosError = <T,>(err: unknown, defaultMessage: string): ApiResponse<T> => {
  let message = defaultMessage;
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError;
    if (axiosError.response && typeof axiosError.response.data === 'object' && axiosError.response.data !== null && 'message' in axiosError.response.data) {
      message = (axiosError.response.data as { message?: string }).message || axiosError.message || defaultMessage;
    } else {
      message = axiosError.message || defaultMessage;
    }
  } else if (err instanceof Error) {
    message = err.message || defaultMessage;
  }
  return { success: false, message };
};


const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<StaffDashboardSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecentAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setError('User not logged in or ID not available.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setIsLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [summaryResult, recentRecordsResult] = await Promise.all([
        axios.get<ApiResponse<StaffDashboardSummary>>('/api/staff/dashboard/summary', { headers })
          .then(processApiResponse) // Use the helper to process response
          .catch((err) => handleAxiosError<StaffDashboardSummary>(err, 'Failed to fetch summary.')), // Use the helper for errors

        axios.get<ApiResponse<RecentAttendanceRecord[]>>('/api/staff/dashboard/recent-attendance', { headers })
          .then(processApiResponse) // Use the helper to process response
          .catch((err) => handleAxiosError<RecentAttendanceRecord[]>(err, 'Failed to fetch recent attendance.')), // Use the helper for errors
      ]);

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      } else {
        setSummary(null);
        console.warn('Failed to fetch dashboard summary:', summaryResult.message);
        setError(summaryResult.message || 'Failed to load dashboard summary.');
      }

      if (recentRecordsResult.success && Array.isArray(recentRecordsResult.data)) {
        setRecentRecords(recentRecordsResult.data);
      } else {
        setRecentRecords([]);
        console.warn('Failed to fetch recent attendance:', recentRecordsResult.message);
        // Only set error if summary was successful but recent records failed, or if it's the primary error
        if (!error) { // Avoid overwriting a more critical error from summary
            setError(recentRecordsResult.message || 'Failed to load recent attendance.');
        }
      }

    } catch (err: unknown) {
      // This catch block will only be hit if Promise.all itself fails (e.g., network down before any request starts)
      const axiosError = err as AxiosError;
      let errorMessage = axiosError?.message || 'Error fetching dashboard data.';
      if (
        axiosError?.response &&
        typeof axiosError.response.data === 'object' &&
        axiosError.response.data !== null &&
        'message' in axiosError.response.data
      ) {
        errorMessage =
          (axiosError.response.data as { message?: string }).message ||
          axiosError.message ||
          'Error fetching dashboard data.';
      }
      setError(errorMessage);
      console.error('Staff Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, error]); // Added 'error' to dependency array to re-evaluate if a prior error prevented full loading

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <Layout title="Staff Dashboard">
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
          <p className="ml-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Staff Dashboard">
        <div className="bg-red-50 text-red-700 p-4 border-l-4 border-red-500 rounded-md mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Error: {error}</span>
        </div>
        <div className="flex justify-center items-center h-full min-h-[300px] text-gray-500">
          <p>Could not load dashboard data. Please try again later.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Staff Dashboard">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-gray-600">
          {format(new Date(), 'EEEE, MMMM do,PPPP')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick stats */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Students Attended Today</h3>
              <p className="text-gray-500">Unique students for all meals</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{summary?.studentsAttendedToday ?? 'N/A'}</div>
          <div className="mt-4 text-sm text-blue-600">
            {summary?.todayBreakfastCount || 0} breakfast, {summary?.todayLunchCount || 0} lunch, {summary?.todayDinnerCount || 0} dinner
          </div>
        </div>

        {/* Scan QR Card - NOW NAVIGATES TO SCANNER PAGE */}
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-md rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/staff/scanner')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Scan className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Scan QR Code</h3>
          <p className="opacity-80">
            Go to dedicated page to scan student QR codes
          </p>
        </div>

        {/* Attendance Card - Navigates to attendance page */}
        <div
          className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-md rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/staff/attendance')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <ClipboardList className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Attendance Reports</h3>
          <p className="opacity-80">
            View and manage student attendance records
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meal
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRecords.length > 0 ? (
                  recentRecords.map((record) => {
                    const markedAtDate = record.markedAt ? new Date(record.markedAt) : null;
                    const formattedMarkedAt = markedAtDate && isValid(markedAtDate)
                                              ? format(markedAtDate, 'h:mm a')
                                              : 'N/A';
                    return (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formattedMarkedAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.userName}</div>
                          <div className="text-sm text-gray-500">Roll No: {record.rollNo || 'N/A'}</div>
                          <div className="text-sm text-gray-500">Enroll: {record.enrollmentNo || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize bg-blue-100 text-blue-800">
                            {record.mealType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Marked
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent attendance records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {recentRecords.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/staff/attendance')}
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                View all records
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StaffDashboard;
