// frontend/pages/admin/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Utensils, ArrowRight, Loader2, Check, X, Info, AlertCircle } from 'lucide-react'; // Removed unused Calendar, AlertTriangle
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import axios, { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast'; // For notifications

// Define types for MessPlan (matching backend response for pending plans)
interface PendingMessPlan {
  id: number;
  studentId: number; // This will now correctly map to mp.user_id
  studentName: string; // Comes from JOIN with users table
  enrollmentNumber?: string; // Corrected: uses enrollment_no from students table (optional)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  rejectionReason?: string | null;
}

// Define Dashboard Stats API Response
interface DashboardStatsApiResponse {
  success: boolean;
  message?: string;
  data: {
    totalStudents: number;
    totalStaff: number;
    activeMessPlans: number;
    pendingMessPlans: PendingMessPlan[];
  };
}

// Action API Response (for approve/reject)
interface ActionApiResponse {
  success: boolean;
  message?: string;
  data?: PendingMessPlan; // The updated mess plan
}


const AdminDashboard: React.FC = () => {
  const { user } = useAuth(); // 'user' is declared but its value is never read. Keeping it as it's part of auth context.
  const navigate = useNavigate();

  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalStaff, setTotalStaff] = useState<number | null>(null);
  const [activeMessPlans, setActiveMessPlans] = useState<number | null>(null);
  const [pendingMessPlans, setPendingMessPlans] = useState<PendingMessPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Changed to string | null
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null); // To disable buttons during action

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response: AxiosResponse<DashboardStatsApiResponse> = await axios.get(
        '/api/admin/dashboard-stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        setTotalStudents(response.data.data.totalStudents);
        setTotalStaff(response.data.data.totalStaff);
        setActiveMessPlans(response.data.data.activeMessPlans);
        // Sort pending mess plans by creation date, newest first
        const sortedPendingPlans = response.data.data.pendingMessPlans.sort((a, b) =>
          parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
        );
        setPendingMessPlans(sortedPendingPlans);
      } else {
        setError((response.data as { message?: string }).message || 'Failed to fetch dashboard stats.');
        toast.error((response.data as { message?: string }).message || 'Failed to fetch dashboard stats.');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage =
        (axiosError.response?.data as { message?: string })?.message ||
        axiosError.message ||
        'An unexpected error occurred while fetching dashboard stats.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching dashboard stats:', axiosError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);


  // Handle Approve/Reject action for pending mess plans
  const handleAction = async (planId: number, actionType: 'approve' | 'reject') => {
    setActionInProgressId(planId);
    setError(null); // Clear any previous action-specific errors

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in.');
        return;
      }

      let response: AxiosResponse<ActionApiResponse>;

      // For dashboard, we directly approve/reject without a rejection reason modal
      // If a rejection reason is required, a modal similar to MessPlans.tsx would be needed here.
      // For simplicity on dashboard, assuming direct rejection or a generic reason for now if rejecting.
      // If the backend requires a reason, and it's not provided, it will fail.
      const rejectionReasonForDashboard = "Rejected from dashboard overview."; // Default reason for dashboard quick reject

      if (actionType === 'approve') {
        response = await axios.put(
          `/api/admin/mess-plans/${planId}/approve`,
          {}, // No body needed for approve
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else { // 'reject'
        response = await axios.put(
          `/api/admin/mess-plans/${planId}/reject`,
          { rejectionReason: rejectionReasonForDashboard }, // Send a default reason
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success && response.data.data) {
        toast.success(response.data.message || `Mess plan ${actionType}d successfully!`);
        // Remove the actioned plan from the pending list
        setPendingMessPlans((prevPlans) =>
          prevPlans.filter((plan) => plan.id !== planId)
        );
        // Optionally, re-fetch dashboard stats to update counts, or manually update activeMessPlans count
        // For simplicity, refetching all stats is robust.
        fetchDashboardStats();
      } else {
        const message = (response.data as { message?: string }).message || `Failed to ${actionType} mess plan.`;
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage =
        (axiosError.response?.data as { message?: string })?.message ||
        axiosError.message ||
        `An unexpected error occurred while trying to ${actionType} the mess plan.`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(`Error ${actionType}ing mess plan:`, axiosError);
    } finally {
      setActionInProgressId(null);
    }
  };


  if (loading) {
    return (
      <Layout title="Admin Dashboard"> {/* Corrected: Added title prop */}
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="ml-3 text-lg text-gray-700">Loading dashboard data...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Admin Dashboard - Error"> {/* Corrected: Added title prop */}
        <div className="flex flex-col items-center justify-center h-96 text-red-600">
          <AlertCircle className="h-12 w-12 mb-4" /> {/* Corrected: AlertCircle is now imported */}
          <p className="text-xl font-semibold">Error: {error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard"> {/* Corrected: Added title prop */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Students Card */}
        <div
          className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => navigate('/admin/users?role=student')}
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {totalStudents !== null ? totalStudents : <Loader2 className="animate-spin h-6 w-6 text-gray-400" />}
            </p>
          </div>
          <Users className="h-12 w-12 text-blue-500 opacity-75" />
        </div>

        {/* Total Staff Card */}
        <div
          className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => navigate('/admin/users?role=staff')}
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Total Staff</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {totalStaff !== null ? totalStaff : <Loader2 className="animate-spin h-6 w-6 text-gray-400" />}
            </p>
          </div>
          <Users className="h-12 w-12 text-purple-500 opacity-75" />
        </div>

        {/* Active Mess Plans Card */}
        <div
          className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => navigate('/admin/mess-plans?status=approved')}
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Active Mess Plans</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {activeMessPlans !== null ? activeMessPlans : <Loader2 className="animate-spin h-6 w-6 text-gray-400" />}
            </p>
          </div>
          <Utensils className="h-12 w-12 text-green-500 opacity-75" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Mess Plan Approvals */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Pending Mess Plan Approvals</h3>
            <button
              onClick={() => navigate('/admin/mess-plans?status=pending')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {pendingMessPlans.length > 0 ? (
              <div className="space-y-4">
                {pendingMessPlans.slice(0, 5).map((plan) => { // Displaying up to 5 pending plans
                  const formattedStartDate = format(parseISO(plan.startDate), 'MMM d, yyyy');
                  const formattedEndDate = format(parseISO(plan.endDate), 'MMM d, yyyy');
                  const appliedOnDate = format(parseISO(plan.createdAt), 'MMM d, yyyy');

                  return (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{plan.studentName}</span>
                        <span className="text-sm text-gray-500">Applied on: {appliedOnDate}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Period:</span> {formattedStartDate} to {formattedEndDate}
                      </p>
                      {plan.enrollmentNumber && (
                        <p className="text-xs text-gray-500 mb-2">Enrollment No: {plan.enrollmentNumber}</p>
                      )}
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => handleAction(plan.id, 'approve')}
                          disabled={actionInProgressId === plan.id}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionInProgressId === plan.id ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(plan.id, 'reject')}
                          disabled={actionInProgressId === plan.id}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionInProgressId === plan.id ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No pending mess plan approvals.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities - Placeholder/Removed for now */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Recent Activities</h3>
          </div>

          <div className="p-4 py-8 text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Recent activities feature is currently unavailable.</p>
            <p className="mt-2 text-sm">This section will display real-time updates from the system soon!</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
