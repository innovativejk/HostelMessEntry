// src/pages/staff/Attendance.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Loader2, Download } from 'lucide-react'; // Added Download icon for export buttons

// Define interfaces for attendance data (Adjusted to match backend response)
interface AttendanceRecord {
  id: number;
  userId: number; // Changed from user_id to userId to match backend alias
  userName: string; // Changed from student_name to userName to match backend alias
  rollNo: string; // Changed from roll_no to rollNo to match backend alias
  enrollmentNo: string; // Changed from enrollment_no to enrollmentNo to match backend alias
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner'; // Changed from meal_type to mealType
  markedAt: string; // Changed from marked_at to markedAt (ISO string, can be null/undefined if not marked)
  markedByUserName: string; // Changed from marked_by_staff_name to markedByUserName
  ipAddress?: string; // Added from backend model
  deviceInfo?: string; // Added from backend model
  isManualEntry?: boolean; // Added from backend model
  notes?: string | null; // Added from backend model
}

interface AttendanceSummary {
  date: string;
  totalMealsMarkedToday: number;
  distinctStudentsMarkedToday: number;
  totalApprovedStudents: number;
}

const StaffAttendance: React.FC = () => {
  const { user } = useAuth(); // Keep user for authentication check
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchAttendanceData = useCallback(async () => {
    setLoadingRecords(true);
    setError(null);
    try {
      const token = localStorage.getItem('token'); // Get token from localStorage
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoadingRecords(false);
        return;
      }

      const response = await axios.get('/api/staff/attendance', {
        params: {
          date: selectedDate,
        },
        headers: {
          Authorization: `Bearer ${token}`, // Use token from localStorage
        },
      });
      setAttendanceRecords(response.data.data);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError('Failed to fetch attendance records. Please try again.');
      toast.error('Failed to load attendance records.');
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedDate]); // Removed user?.token from dependencies as token is from localStorage

  const fetchAttendanceSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const token = localStorage.getItem('token'); // Get token from localStorage
      if (!token) {
        setLoadingSummary(false); // Ensure loading is off if no token
        return;
      }

      const response = await axios.get('/api/staff/attendance/summary', {
        headers: {
          Authorization: `Bearer ${token}`, // Use token from localStorage
        },
      });
      setSummary(response.data.data);
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
      toast.error('Failed to load attendance summary.');
    } finally {
      setLoadingSummary(false);
    }
  }, []); // Removed user?.token from dependencies as token is from localStorage


  useEffect(() => {
    // Only fetch data if user object is available (implies potential login state)
    // The actual token check is now inside fetchAttendanceData and fetchAttendanceSummary
    if (user) {
      fetchAttendanceData();
      fetchAttendanceSummary();
    }
  }, [user, fetchAttendanceData, fetchAttendanceSummary]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token'); // Get token from localStorage
      if (!token) {
        toast.error('Authentication token not found. Please log in.');
        setExporting(false);
        return;
      }

      const response = await axios.get(`/api/staff/attendance/export`, {
        params: {
          format: 'pdf',
          startDate: selectedDate, // Use selectedDate as both start and end for daily report
          endDate: selectedDate,
        },
        headers: {
          Authorization: `Bearer ${token}`, // Use token from localStorage
        },
        responseType: 'blob', // Important for downloading files
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staff_attendance_report_${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report. Please try again.');
    } finally {
      setExporting(false);
    }
  };


  return (
    <Layout title="Staff Attendance"> {/* Added the missing title prop */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Staff Attendance Dashboard</h1>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Approved Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingSummary ? <Loader2 className="animate-spin h-6 w-6 text-indigo-500" /> : summary?.totalApprovedStudents || 0}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Meals Marked Today ({format(new Date(selectedDate), 'MMM dd, yyyy')})</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingSummary ? <Loader2 className="animate-spin h-6 w-6 text-indigo-500" /> : summary?.totalMealsMarkedToday || 0}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Distinct Students Attended Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingSummary ? <Loader2 className="animate-spin h-6 w-6 text-indigo-500" /> : summary?.distinctStudentsMarkedToday || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label htmlFor="selectedDate" className="text-gray-700 font-medium">Select Date:</label>
          <input
            type="date"
            id="selectedDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            onClick={fetchAttendanceData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            disabled={loadingRecords}
          >
            {loadingRecords ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Apply Filter
          </button>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Attendance Records for {format(parseISO(selectedDate), 'PPPP')}</h3>
          </div>
          {loadingRecords ? (
            <div className="p-6 text-center">
              <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mx-auto" />
              <p className="mt-2 text-gray-600">Loading attendance records...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No attendance records found for the selected date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment No.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meal Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marked At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marked By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.enrollmentNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {record.mealType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* FIXED: Check if marked_at is present before formatting */}
                        {record.markedAt ? format(parseISO(record.markedAt), 'hh:mm:ss a') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.markedByUserName || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Export Attendance Records</h3>
          <p className="text-gray-600 mb-3">Exports will generate a PDF report for the currently selected date.</p>
          <div className="flex gap-4">
            <button
              onClick={handleExportPdf}
              disabled={exporting || attendanceRecords.length === 0} // Disable if no records or already exporting
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />} Export PDF
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StaffAttendance;
