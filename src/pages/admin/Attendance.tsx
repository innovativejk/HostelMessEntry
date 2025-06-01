// src/pages/admin/Attendance.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format, parseISO, startOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Loader2, Download } from 'lucide-react'; // Download icon for export buttons

// Define interfaces for attendance data (ADJUSTED TO MATCH BACKEND ALIASES)
interface AttendanceRecord {
  id: number;
  userId: number; // Matches backend 'userId' alias
  userName: string; // Matches backend 'userName' alias
  rollNo: string; // Matches backend 'rollNo' alias
  enrollmentNo: string; // Matches backend 'enrollmentNo' alias
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner'; // Matches backend 'mealType' alias
  markedAt: string | null; // Matches backend 'markedAt' alias (ISO string, can be null/undefined)
  markedByUserName: string; // Matches backend 'markedByUserName' alias
  ipAddress: string;
  deviceInfo: string;
  isManualEntry: boolean;
  notes: string | null;
  createdAt: string;
}

interface AttendanceSummary {
  totalApprovedStudents: number;
  todayAttendedMeals: number;
  todayAttendedStudents: number;
  thisWeekAttendedMeals: number;
  thisMonthAttendedMeals: number;
}

const AdminAttendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false); // State for export loading

  // Filter states (REMOVED mealType and studentId)
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    searchQuery: '', // For name, roll_no, enrollment_no
  });

  const fetchAttendanceRecords = useCallback(async () => {
    if (!user) return;
    setLoadingRecords(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        searchQuery: filters.searchQuery || undefined,
      };
      const response = await axios.get('/api/admin/attendance', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (response.data.success) {
        setAttendanceRecords(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch attendance records.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error fetching attendance records.');
      setAttendanceRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [user, filters]);

  const fetchAttendanceSummary = useCallback(async () => {
    if (!user) return;
    setLoadingSummary(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/attendance/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSummary(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch attendance summary.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error fetching attendance summary.');
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  useEffect(() => {
    fetchAttendanceSummary();
  }, [fetchAttendanceSummary]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchAttendanceRecords();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      searchQuery: '',
    });
  };

  // handleExport function for PDF ONLY
  const handleExport = useCallback(async (formatType: 'pdf') => { // Only 'pdf' allowed now
    if (!user) {
      toast.error('Authentication required for export.');
      return;
    }
    setExporting(true);
    toast.loading(`Generating ${formatType.toUpperCase()} report...`, { id: 'exportToast' });

    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        searchQuery: filters.searchQuery || undefined,
        format: formatType, // Add format type for backend endpoint
      };

      const response = await axios.get('/api/admin/attendance/export', { // Use the export endpoint
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob', // Important for file downloads
      });

      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] });

      // Create a link element, set the download attribute, and click it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from Content-Disposition header if available, otherwise create one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `admin_attendance_report.${formatType}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object

      // Enhanced toast message to inform about download location
      toast.success(`${formatType.toUpperCase()} report generated successfully! Please check your downloads folder.`, { id: 'exportToast' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate report.';
      toast.error(`Export failed: ${errorMsg}`, { id: 'exportToast' });
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [user, filters]);


  return (
    <Layout title="Admin Attendance Overview">
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Admin Attendance Overview</h2>

        {/* Attendance Summary */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Overall Attendance Summary</h3>
          {loadingSummary ? (
            <p className="text-blue-500 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading summary...</p>
          ) : error && !summary ? (
            <p className="text-red-500">{error}</p>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-3xl font-bold text-blue-600">{summary.totalApprovedStudents}</p>
                <p className="text-gray-600">Total Approved Students</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-3xl font-bold text-green-600">{summary.todayAttendedStudents}</p>
                <p className="text-gray-600">Students Attended Today</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-3xl font-bold text-green-600">{summary.todayAttendedMeals}</p>
                <p className="text-gray-600">Meals Marked Today</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-3xl font-bold text-purple-600">{summary.thisWeekAttendedMeals}</p>
                <p className="text-gray-600">Meals This Week</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-3xl font-bold text-orange-600">{summary.thisMonthAttendedMeals}</p>
                <p className="text-gray-600">Meals This Month</p>
              </div>
            </div>
          ) : (
            <p>No summary data available.</p>
          )}
        </div>

        {/* Filters Section (Meal Type and Student filters removed) */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Filter Attendance Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Adjusted grid columns */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="lg:col-span-1"> {/* Adjusted span */}
              <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700">Search (Name, Roll, Enrollment)</label>
              <input
                type="text"
                id="searchQuery"
                name="searchQuery"
                value={filters.searchQuery}
                onChange={handleFilterChange}
                placeholder="Search student..."
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Filtered Attendance Records</h3>
          {loadingRecords ? (
            <p className="text-blue-500 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading records...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-gray-600">No attendance records found for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                        {record.userName} {/* Changed to match backend alias */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.rollNo || 'N/A'} {/* Changed to match backend alias */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(record.date), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {record.mealType} {/* Changed to match backend alias */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Safely parse markedAt, check if it exists and is valid */}
                        {record.markedAt ? format(parseISO(record.markedAt), 'hh:mm:ss a') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.markedByUserName || 'N/A'} {/* Changed to match backend alias */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Section (Only PDF remains) */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Export Filtered Attendance</h3>
          <p className="text-gray-600 mb-3">Exports will apply the current date range filter and search query.</p>
          <div className="flex gap-4">
            <button
              onClick={() => handleExport('pdf')} // Only PDF export remains
              disabled={exporting}
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

export default AdminAttendance;
