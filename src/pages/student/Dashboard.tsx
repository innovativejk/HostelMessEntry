// /Users/jay_mac/Movies/project/src/pages/student/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { format, isValid, parseISO, isPast, setHours, setMinutes, isBefore } from 'date-fns';
import { Calendar, ClipboardList, QrCode, Bell, ArrowRight, Loader2, Info, AlertTriangle } from 'lucide-react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import QRCode from 'react-qr-code';

// --- Type Definitions (Ensure these match your backend API responses accurately) ---

interface MessPlan {
  id: number;
  studentId: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  markedAt: string | null; // Allow markedAt to be null
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type ActiveMeal = 'breakfast' | 'lunch' | 'dinner' | null;

interface QRGeneratePayload {
  userId: number;
  date: string;
  mealType: ActiveMeal;
}

interface QRResponse {
  success: boolean;
  message?: string;
  qrData: string;
}

// Generic API Response types for consistency
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Helper to determine meal window status
// Updated to match backend logic from dashboard.controller.js
const getMealWindowStatus = (mealType: 'breakfast' | 'lunch' | 'dinner'): 'past' | 'active' | 'future' => {
  const now = new Date();
  let mealStartTime: Date;
  let mealEndTime: Date;

  // Define meal start and end times based on dashboard.controller.js
  switch (mealType) {
    case 'breakfast':
      mealStartTime = setMinutes(setHours(now, 7), 0);   // 7:00 AM
      mealEndTime = setMinutes(setHours(now, 10), 30);  // 10:30 AM
      break;
    case 'lunch':
      mealStartTime = setMinutes(setHours(now, 12), 0);  // 12:00 PM
      mealEndTime = setMinutes(setHours(now, 15), 30);  // 3:30 PM
      break;
    case 'dinner':
      mealStartTime = setMinutes(setHours(now, 19), 0);  // 7:00 PM
      mealEndTime = setMinutes(setHours(now, 23), 30);  // 11:30 PM
      break;
    default:
      return 'future'; // Should not happen for defined meal types
  }

  // Check if current time is before the meal start time
  if (isBefore(now, mealStartTime)) {
    return 'future';
  }
  // Check if current time is after the meal end time
  else if (isPast(mealEndTime)) {
    return 'past';
  }
  // If not future and not past, it must be active
  else {
    return 'active';
  }
};


const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  // --- State Variables for Real Data ---
  const [activePlan, setActivePlan] = useState<MessPlan | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [activeMeal, setActiveMeal] = useState<ActiveMeal>(null);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Utility to handle Axios errors and return a consistent ApiResponse structure ---
  const handleApiError = <T,>(err: unknown, defaultMessage: string, defaultData?: T): ApiResponse<T> => {
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
    return { success: false, message, data: defaultData };
  };

  // --- Fetch Dashboard Data ---
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
      const [
        messPlanRes,
        attendanceRes,
        activeMealRes,
        notificationsRes
      ] = await Promise.all([
        axios.get<ApiResponse<MessPlan>>(`/api/student/mess-plan/active`, { headers })
          .then((response: AxiosResponse<ApiResponse<MessPlan>>) => response.data)
          .catch((err: unknown) => handleApiError<MessPlan>(err, "Failed to fetch active mess plan.")),

        axios.get<ApiResponse<AttendanceRecord[]>>(`/api/student/${user.id}/attendance/range?startDate=${today}&endDate=${today}`, { headers })
          .then((response: AxiosResponse<ApiResponse<AttendanceRecord[]>>) => response.data)
          .catch((err: unknown) => handleApiError<AttendanceRecord[]>(err, "Failed to fetch today's attendance.", [])),

        axios.get<ApiResponse<{ mealType: ActiveMeal }>>('/api/general/active-meal', { headers })
          .then((response: AxiosResponse<ApiResponse<{ mealType: ActiveMeal }>>) => response.data)
          .catch((err: unknown) => handleApiError<{ mealType: ActiveMeal }>(err, "Failed to fetch active meal.")),

        axios.get<ApiResponse<Notification[]>>(`/api/student/notifications/recent`, { headers })
          .then((response: AxiosResponse<ApiResponse<Notification[]>>) => response.data)
          .catch((err: unknown) => handleApiError<Notification[]>(err, "Failed to fetch recent notifications.", []))
      ]);

      // Process Mess Plan
      if (messPlanRes.success && messPlanRes.data) {
        setActivePlan(messPlanRes.data);
      } else {
        setActivePlan(null);
        console.warn('Mess Plan fetch failed:', messPlanRes.message);
      }

      // Process Attendance
      if (attendanceRes.success && Array.isArray(attendanceRes.data)) {
        setTodayAttendance(attendanceRes.data);
        console.log("Fetched Today's Attendance Data (Raw):", attendanceRes.data); // Debug log
      } else {
        setTodayAttendance([]);
        console.warn("Today's Attendance fetch failed:", attendanceRes.message);
      }

      // Process Active Meal
      if (activeMealRes.success && activeMealRes.data) {
        setActiveMeal(activeMealRes.data.mealType || null);
      } else {
        setActiveMeal(null);
        console.warn('Active Meal fetch failed:', activeMealRes.message);
      }

      // Process Notifications
      if (notificationsRes.success && Array.isArray(notificationsRes.data)) {
        setRecentNotifications(notificationsRes.data);
      } else {
        setRecentNotifications([]);
        console.warn('Recent Notifications fetch failed:', notificationsRes.message);
      }

    } catch (err: unknown) {
      const axiosError = axios.isAxiosError(err) ? err : null;
      setError(axiosError?.response?.data?.message || axiosError?.message || 'Error fetching dashboard data.');
      console.error('Student Dashboard critical fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, today]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- QR Code Logic ---
  const isQrCodeGenerateable = activePlan && activeMeal &&
                               !todayAttendance.some(a => a.meal_type === activeMeal && a.date === today);

  console.log('--- Student Dashboard Debugging ---');
  console.log('User ID:', user?.id);
  console.log('Active Plan:', activePlan);
  console.log('Active Meal (from API):', activeMeal);
  console.log('Today Attendance (State):', todayAttendance);
  console.log('Is QR Code Generateable?:', isQrCodeGenerateable);
  console.log('Current QR Code Data (state):', qrCodeData);

  const fetchQrCode = useCallback(async () => {
    if (!isQrCodeGenerateable || !user?.id) {
        setQrCodeData(null);
        console.log('QR Code generation skipped: conditions not met or user ID missing.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        setQrCodeData(null);
        console.warn('QR Code generation failed: Authentication token missing.');
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
        const payload: QRGeneratePayload = {
            userId: user.id,
            date: today,
            mealType: activeMeal
        };
        console.log('Attempting to fetch QR with payload:', payload);
        const response = await axios.post<QRResponse>(`/api/student/generate-qr`, payload, {
            headers: headers
        });

        console.log('QR API Response:', response.data);

        if (response.data.success && response.data.qrData) {
            setQrCodeData(response.data.qrData);
            console.log('QR Code Data set successfully:', response.data.qrData);
        } else {
            console.error('Failed to get QR data from API (success false or qrData missing):', response.data.message);
            setQrCodeData(null);
        }
    } catch (err: unknown) {
        const axiosError = axios.isAxiosError(err) ? err : null;
        console.error('Error generating QR code (network/server error):', axiosError?.response?.data?.message || axiosError?.message || err);
        setQrCodeData(null);
    }
  }, [user?.id, today, activeMeal, isQrCodeGenerateable]);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  // --- Render Logic ---
  if (isLoading) {
    return (
      <Layout title="Student Dashboard">
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
          <p className="ml-4 text-gray-600">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Student Dashboard">
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
    <Layout title="Student Dashboard">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-gray-600">
          {format(new Date(), 'EEEE, MMMM do,PPPP')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg">
          <div className="bg-blue-600 px-4 py-3 flex items-center">
            <QrCode className="h-5 w-5 text-white" />
            <h3 className="text-white font-medium ml-2">Meal QR Code</h3>
          </div>
          <div className="p-4 h-64 flex flex-col items-center justify-center">
            {isQrCodeGenerateable && qrCodeData ? (
              <>
                <div className="bg-white p-2 rounded-md mb-3">
                  <QRCode
                    value={qrCodeData}
                    size={150}
                  />
                </div>
                <p className="text-gray-700 font-medium capitalize text-center">
                  {activeMeal} QR Code
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Show this to the mess staff
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-2">
                  {!activePlan
                    ? "You don't have an active mess plan."
                    : !activeMeal
                      ? "No active meal time right now."
                      : todayAttendance.some(a => a.meal_type === activeMeal && a.date === today)
                        ? "You've already checked in for this meal."
                        : "QR code not available."
                  }
                </p>
                {!activePlan && (
                  <button
                    onClick={() => navigate('/student/mess-plan')}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Request mess plan
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                )}
                {activePlan && !activeMeal && (
                     <p className="text-sm text-gray-500 mt-2">QR codes appear during active meal times.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mess Plan Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg">
          <div className="bg-green-600 px-4 py-3 flex items-center">
            <Calendar className="h-5 w-5 text-white" />
            <h3 className="text-white font-medium ml-2">Mess Plan</h3>
          </div>
          <div className="p-4 h-64">
            {activePlan ? (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-600">Start Date:</span>
                    <span className="text-gray-800 font-medium">{activePlan.startDate}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">End Date:</span>
                    <span className="text-gray-800 font-medium">{activePlan.endDate}</span>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4">
                  <p className="text-sm text-blue-700">
                    Your mess plan is active. QR codes will be generated for each meal during your plan period.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/student/mess-plan')}
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View details
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-3">You don't have an active mess plan</p>
                <button
                  onClick={() => navigate('/student/mess-plan')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Request Mess Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg">
          <div className="bg-amber-600 px-4 py-3 flex items-center">
            <ClipboardList className="h-5 w-5 text-white" />
            <h3 className="text-white font-medium ml-2">Today's Attendance</h3>
          </div>
          <div className="p-4 h-64">
            <div className="space-y-4">
              {['breakfast', 'lunch', 'dinner'].map((meal) => {
                const attended = todayAttendance.find(a => a.meal_type === meal);
                const mealWindowStatus = getMealWindowStatus(meal as 'breakfast' | 'lunch' | 'dinner');

                let displayStatus: string;
                let statusColorClass: string;

                if (attended) {
                  const markedAtValue = attended.markedAt;
                  let markedAtDate: Date | null = null;
                  if (typeof markedAtValue === 'string' && markedAtValue) {
                      const parsed = parseISO(markedAtValue);
                      if (isValid(parsed)) {
                          markedAtDate = parsed;
                      }
                  }
                  displayStatus = markedAtDate ? format(markedAtDate, 'h:mm a') : 'Marked (Time N/A)';
                  statusColorClass = 'bg-green-500';
                } else {
                  // Not attended
                  if (mealWindowStatus === 'past') {
                    displayStatus = 'Missed';
                    statusColorClass = 'bg-red-500';
                  } else { // 'active' or 'future'
                    displayStatus = 'Not marked';
                    statusColorClass = 'bg-gray-300';
                  }
                }

                console.log(`Meal: ${meal}, Attended: ${!!attended}, Window Status: ${mealWindowStatus}, Display: ${displayStatus}`); // New debug log

                return (
                  <div key={meal} className="flex items-center justify-between p-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-3 ${statusColorClass}`}></div>
                      <span className="capitalize text-gray-700">{meal}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {displayStatus}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/student/attendance')}
              className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              View All Attendance
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden md:col-span-2 lg:col-span-3 transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg">
          <div className="bg-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-white" />
              <h3 className="text-white font-medium ml-2">Recent Notifications</h3>
            </div>
            {recentNotifications.filter(n => !n.read).length > 0 && (
                <span className="bg-white text-purple-600 text-xs px-2 py-1 rounded-full">
                    {recentNotifications.filter(n => !n.read).length} new
                </span>
            )}
          </div>
          <div className="p-4">
            {recentNotifications.length > 0 ? (
                <div className="space-y-3">
                    {recentNotifications.map(notification => {
                        const notificationDate = parseISO(notification.createdAt);
                        const formattedNotificationTime = isValid(notificationDate)
                            ? format(notificationDate, 'MMM d, h:mm a')
                            : 'N/A';
                        return (
                            <div key={notification.id} className={`p-3 border-l-4 rounded-r-md ${
                                notification.read ? 'border-gray-300 bg-gray-50' : 'border-blue-500 bg-blue-50'
                            }`}>
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-gray-800">{notification.message.split(':')[0]}</h4>
                                    <span className="text-xs text-gray-500">{formattedNotificationTime}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-8 text-center text-gray-500">
                    <Info className="h-6 w-6 mx-auto mb-2 text-gray-400"/>
                    <p>No recent notifications.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
