// src/pages/student/Attendance.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format, parseISO, startOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Loader2, Download } from 'lucide-react';

interface StudentAttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  marked_at: string;
}

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false); // State for export loading

  // Filter states for student's own view
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchStudentAttendance = useCallback(async () => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/student/${user.id}/attendance/range`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      if (response.data.success) {
        setAttendanceRecords(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch your attendance records.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error fetching attendance records.');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchStudentAttendance();
  }, [fetchStudentAttendance]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prevRange) => ({
      ...prevRange,
      [name]: value,
    }));
  };

  // handleExport function for PDF ONLY
  const handleExport = useCallback(async (formatType: 'pdf') => { // Only 'pdf' allowed now
    if (!user || !user.id) {
      toast.error('Authentication required for export.');
      return;
    }
    setExporting(true); // Set exporting state to true
    toast.loading(`Generating ${formatType.toUpperCase()} report...`, { id: 'exportToast' });
    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: formatType,
      };
      const response = await axios.get(`/api/student/${user.id}/attendance/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from Content-Disposition header if available, otherwise create one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `your_attendance_report.${formatType}`;
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
      window.URL.revokeObjectURL(url);
      toast.success(`${formatType.toUpperCase()} report generated successfully! Please check your downloads folder.`, { id: 'exportToast' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate report.';
      toast.error(`Export failed: ${errorMsg}`, { id: 'exportToast' });
      console.error('Export error:', err);
    } finally {
      setExporting(false); // Reset exporting state
    }
  }, [user, dateRange]);

  return (
    <Layout title="My Attendance History">
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">My Attendance History</h2>

        {/* Date Range Filter */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">View Attendance By Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
              <button
                onClick={() => fetchStudentAttendance()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading} // Disable apply button while loading records
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Apply Date Range
              </button>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Attendance Records</h3>
          {loading ? (
            <p className="text-blue-500 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your records...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-gray-600">No attendance records found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marked At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(parseISO(record.date), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {record.meal_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Safely parse marked_at, check if it exists and is valid */}
                        {record.marked_at ? format(parseISO(record.marked_at), 'hh:mm:ss a') : 'N/A'}
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
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Export Your Attendance</h3>
          <p className="text-gray-600 mb-3">Exports will generate a PDF report for the current date range filter.</p>
          <div className="flex gap-4">
            <button
              onClick={() => handleExport('pdf')} // Only PDF export remains
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

export default StudentAttendance;
