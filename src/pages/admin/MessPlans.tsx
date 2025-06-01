import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { Check, X, Loader2, AlertCircle, Download, IndianRupee, Info } from 'lucide-react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { format, parseISO, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

// Import for PDF generation
// सुनिश्चित करें कि jspdf को डिफ़ॉल्ट निर्यात के रूप में आयात किया गया है, और jspdf-autotable को jsPDF के बाद आयात किया गया है
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define the daily mess rate (consistent with student view)
const DAILY_MESS_RATE = 100; // Rs. 100 per day

// Define types for MessPlan (Adjusted to number for ID)
interface MessPlan {
  id: number;
  studentId: number;
  studentName: string; // From JOIN with users table
  enrollmentNumber?: string; // From JOIN with students table (optional as some users might not be in students table)
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

// API Response Interfaces
interface MessPlansApiResponse {
  success: boolean;
  message?: string;
  data?: MessPlan[];
}

interface ActionApiResponse {
  success: boolean;
  message?: string;
  data?: MessPlan; // The updated mess plan
}

const AdminMessPlans: React.FC = () => {
  const [allMessPlans, setAllMessPlans] = useState<MessPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof MessPlan; direction: 'ascending' | 'descending' } | null>(null);

  // State for rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [currentActionPlanId, setCurrentActionPlanId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null); // To disable buttons during API call

  // State for report generation (PDF generation के लिए पुनः जोड़ा गया)
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  const fetchMessPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setIsLoading(false);
        return;
      }
      const response: AxiosResponse<MessPlansApiResponse> = await axios.get('/api/admin/mess-plans', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success && response.data.data) {
        setAllMessPlans(response.data.data);
      } else {
        setError((response.data as { message?: string }).message || 'Failed to fetch mess plans.');
        toast.error((response.data as { message?: string }).message || 'Failed to fetch mess plans.');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error fetching mess plans:', axiosError);
      setError((axiosError.response?.data as { message?: string })?.message || 'Error fetching mess plans.');
      toast.error((axiosError.response?.data as { message?: string })?.message || 'Error fetching mess plans.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessPlans();
  }, [fetchMessPlans]);

  const handleAction = async (planId: number, action: 'approve' | 'reject') => {
    setActionInProgressId(planId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in.');
        return;
      }

      let response: AxiosResponse<ActionApiResponse>;
      if (action === 'approve') {
        response = await axios.put(`/api/admin/mess-plans/${planId}/approve`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else { // action === 'reject'
        if (!rejectionReason.trim()) {
          toast.error('Rejection reason cannot be empty.');
          return;
        }
        response = await axios.put(`/api/admin/mess-plans/${planId}/reject`, { rejectionReason }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        closeRejectModal(); // Close modal after successful rejection
      }

      if (response.data.success && response.data.data) {
        setAllMessPlans(prevPlans =>
          prevPlans.map(plan =>
            plan.id === planId ? { ...plan, ...response.data.data! } : plan
          ).sort((a: MessPlan, b: MessPlan) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return 0; // Maintain existing order for same status
          })
        );
        toast.success(`Mess plan ${action}d successfully!`);
        if (action === 'reject') {
          setRejectionReason('');
        }
      } else {
        toast.error((response.data as { message?: string }).message || `Failed to ${action} mess plan.`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error(`Error ${action}ing mess plan:`, axiosError);
      toast.error((axiosError.response?.data as { message?: string })?.message || `Failed to ${action} mess plan.`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const openRejectModal = (planId: number) => {
    setCurrentActionPlanId(planId);
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setCurrentActionPlanId(null);
    setRejectionReason('');
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return differenceInDays(end, start) + 1; // +1 to include both start and end days
  };

  const calculateAmount = (startDate: string, endDate: string): number => {
    return calculateDays(startDate, endDate) * DAILY_MESS_RATE;
  };

  const filteredAndSortedPlans = [...allMessPlans]
    .filter(plan => {
      const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
      const matchesSearchTerm =
        plan.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearchTerm;
    })
    .sort((a: MessPlan, b: MessPlan) => {
      if (sortConfig) {
        const aValue = (a[sortConfig.key] || '').toString();
        const bValue = (b[sortConfig.key] || '').toString();

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
      }
      // Default sorting: pending plans first, then by creation date (newest first)
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
    });

  const requestSort = (key: keyof MessPlan) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof MessPlan) => {
    if (!sortConfig || sortConfig.key !== key) {
      return '';
    }
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  // Function to generate PDF and open in print preview
  const handleExportPdf = async () => {
    setIsGeneratingReport(true);
    toast.loading(`Generating PDF report for preview...`, { id: 'reportGenToast' });
    try {
      const doc = new jsPDF();
      (doc as any).autoTable({
        head: [['ID', 'Student Name', 'Enrollment No.', 'Start Date', 'End Date', 'Days', 'Amount (Rs.)', 'Status', 'Requested On']],
        body: filteredAndSortedPlans.map(plan => [
          plan.id,
          plan.studentName,
          plan.enrollmentNumber || 'N/A',
          format(parseISO(plan.startDate), 'dd MMM yyyy'), // 'yyyy' for year
          format(parseISO(plan.endDate), 'dd MMM yyyy'),   // 'yyyy' for year
          calculateDays(plan.startDate, plan.endDate),
          calculateAmount(plan.startDate, plan.endDate),
          plan.status.charAt(0).toUpperCase() + plan.status.slice(1),
          format(parseISO(plan.createdAt), 'dd MMM yyyy HH:mm'), // 'yyyy' for year
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 100, 200] },
        margin: { top: 20 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 'auto' }, // ID
          1: { cellWidth: 'auto' }, // Student Name
          2: { cellWidth: 'auto' }, // Enrollment No.
          3: { cellWidth: 'auto' }, // Start Date
          4: { cellWidth: 'auto' }, // End Date
          5: { cellWidth: 'auto' }, // Days
          6: { cellWidth: 'auto' }, // Amount
          7: { cellWidth: 'auto' }, // Status
          8: { cellWidth: 'auto' }, // Requested On
        },
        didDrawPage: (_hookData: any) => { // Using _hookData to suppress unused variable warning
          doc.text("Mess Plan Report", 14, 15);
        }
      });

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      // Open a new window for print preview
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Revoke the object URL after a short delay to allow print dialog to open
          // and then clean up memory.
          setTimeout(() => URL.revokeObjectURL(url), 100);
        };
      } else {
        // Fallback if pop-up is blocked
        toast.error('Pop-up blocked. Please allow pop-ups for this site to view the print preview.', { id: 'reportGenToast' });
        // Optionally, offer direct download as a fallback
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mess_plans_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
      toast.success('PDF report generated for preview!', { id: 'reportGenToast' });
    } catch (err) {
      console.error('Error generating PDF report:', err);
      toast.error('Failed to generate PDF report.', { id: 'reportGenToast' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getStatusColor = (status: MessPlan['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout title="Admin Mess Plans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Mess Plans</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <X className="h-5 w-5 text-red-500 cursor-pointer" />
            </span>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by student name or enrollment no."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 pl-3 pr-10 py-2"
            />
          </div>

          {/* Generate Report Button (now uses jspdf) */}
          <div className="flex space-x-3 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingReport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isGeneratingReport ? (
                <span className="flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generating...</span>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Generate PDF Report</>
              )}
            </button>
          </div>
        </div>

        {/* Mess Plans Table */}
        <div id="mess-plans-table-container" className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {filteredAndSortedPlans.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/12"
                      onClick={() => requestSort('id')}
                    >
                      ID {getSortIndicator('id')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-2/12"
                      onClick={() => requestSort('studentName')}
                    >
                      Student Name {getSortIndicator('studentName')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-2/12"
                      onClick={() => requestSort('enrollmentNumber')}
                    >
                      Enrollment No. {getSortIndicator('enrollmentNumber')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-2/12"
                      onClick={() => requestSort('startDate')}
                    >
                      Period {getSortIndicator('startDate')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12"
                    >
                      Days
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-2/12"
                      onClick={() => requestSort('status')}
                    >
                      Status {getSortIndicator('status')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-2/12"
                      onClick={() => requestSort('createdAt')}
                    >
                      Requested On {getSortIndicator('createdAt')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 break-words">
                        {plan.id}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 break-words">
                        {plan.studentName}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 break-words">
                        {plan.enrollmentNumber || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 break-words">
                        {format(parseISO(plan.startDate), 'dd MMM yyyy')} - {format(parseISO(plan.endDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 break-words">
                        {calculateDays(plan.startDate, plan.endDate)} days
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 break-words">
                        <div className="flex items-center font-semibold">
                          <IndianRupee className="h-4 w-4 mr-1 text-gray-600" />{calculateAmount(plan.startDate, plan.endDate)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm break-words">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </span>
                        {plan.status === 'rejected' && plan.rejectionReason && (
                          <div className="mt-1 text-xs text-red-600 flex items-center">
                            {plan.rejectionReason}
                          </div>
                        )}
                        {plan.status === 'pending' && (
                          <div className="flex flex-col items-center justify-center space-y-1 mt-2">
                            <button
                              onClick={() => handleAction(plan.id, 'approve')}
                              disabled={actionInProgressId === plan.id}
                              className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
                            >
                              {actionInProgressId === plan.id ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(plan.id)}
                              disabled={actionInProgressId === plan.id}
                              className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
                            >
                              {actionInProgressId === plan.id ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 break-words">
                        {format(parseISO(plan.createdAt), 'dd MMM yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Info className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No mess plans found.</p>
                <p className="text-sm mt-1">Adjust your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Mess Plan Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" /> Confirm Rejection
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this mess plan request.
            </p>
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700">
                Rejection Reason
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="shadow-sm focus:ring-red-500 focus:border-red-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2 resize-none"
                placeholder="e.g., Request date too short, Invalid reason for leave"
                required
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(currentActionPlanId!, 'reject')}
                disabled={!rejectionReason.trim() || currentActionPlanId === null || actionInProgressId === currentActionPlanId}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionInProgressId === currentActionPlanId ? (
                  <span className="flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" /> Rejecting...</span>
                ) : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminMessPlans;
