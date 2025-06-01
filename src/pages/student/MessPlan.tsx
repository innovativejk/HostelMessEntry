import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  format,
  addDays,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isPast,
  isSameDay,
  isBefore,
  isAfter,
  differenceInDays,
  startOfDay,
  subDays,
} from 'date-fns';
import { Calendar, Check, X, Loader2, IndianRupee } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define the daily mess rate
const DAILY_MESS_RATE = 100; // Rs. 100 per day

// Define the type for a MessPlan object
interface MessPlan {
  id: number;
  userId: number;
  startDate: string; //YYYY-MM-DD
  endDate: string;   //YYYY-MM-DD
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string | null;
}

// Define API response structures
interface MessPlanApiResponse {
  success: boolean;
  message?: string;
  data?: MessPlan[];
}

interface SubmitMessPlanApiResponse {
  success: boolean;
  message?: string;
  data?: MessPlan;
}

const StudentMessPlan: React.FC = () => {
  const { user } = useAuth();

  // State for calendar date selection
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for mess plans and loading
  const [messPlans, setMessPlans] = useState<MessPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const totalAmount = useMemo(() => {
    if (selectedStartDate && selectedEndDate) {
      const days = differenceInDays(selectedEndDate, selectedStartDate) + 1;
      return days * DAILY_MESS_RATE;
    }
    return 0;
  }, [selectedStartDate, selectedEndDate]);

  const fetchMessPlans = useCallback(async () => {
    if (!user?.id) {
      setLoadingPlans(false);
      return;
    }
    setLoadingPlans(true);
    try {
      const token = localStorage.getItem('token'); // Get token
      if (!token) {
        toast.error('Authentication token not found. Please log in.');
        setLoadingPlans(false);
        return;
      }

      const response = await axios.get<MessPlanApiResponse>(`/api/student/mess-plans`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      });
      if (response.data.success && response.data.data) {
        setMessPlans(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch mess plans.');
      }
    } catch (error) {
      console.error('Error fetching mess plans:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'An error occurred while fetching mess plans.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setLoadingPlans(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMessPlans();
  }, [fetchMessPlans]);

  const handleDateClick = (day: Date) => {
    if (isPast(startOfDay(day)) && !isSameDay(day, startOfDay(new Date()))) {
      toast.error("You cannot select a past date.");
      return;
    }

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(day);
      setSelectedEndDate(null);
    } else if (isBefore(day, selectedStartDate)) {
      toast.error("End date cannot be before start date.");
    } else {
      setSelectedEndDate(day);
    }
  };

  const getDayClasses = (day: Date) => {
    let classes = 'p-2 text-center border rounded-md cursor-pointer transition-colors duration-200';

    if (!isSameMonth(day, currentMonth)) {
      classes += ' text-gray-400 bg-gray-50'; // Days outside current month
    } else {
      classes += ' bg-white hover:bg-blue-100'; // Days in current month
    }

    // Highlight selected range
    if (selectedStartDate && isSameDay(day, selectedStartDate)) {
      classes += ' bg-blue-500 text-white font-bold';
    } else if (selectedEndDate && isSameDay(day, selectedEndDate)) {
      classes += ' bg-blue-500 text-white font-bold';
    } else if (selectedStartDate && selectedEndDate && isAfter(day, selectedStartDate) && isBefore(day, selectedEndDate)) {
      classes += ' bg-blue-200';
    }

    // Indicate past dates (excluding today)
    if (isPast(startOfDay(day)) && !isSameDay(day, startOfDay(new Date()))) {
      classes += ' text-gray-300 cursor-not-allowed'; // Grey out past dates
    }

    // Highlight today
    if (isSameDay(day, new Date())) {
      classes += ' ring-2 ring-indigo-500';
    }

    // Highlight dates covered by approved/pending plans
    const hasPlan = messPlans.some(plan => {
      const planStartDate = startOfDay(new Date(plan.startDate));
      const planEndDate = startOfDay(new Date(plan.endDate));
      return (
        (plan.status === 'approved' || plan.status === 'pending') &&
        (isAfter(day, subDays(planStartDate, 1)) && isBefore(day, addDays(planEndDate, 1)))
      );
    });

    if (hasPlan && isSameMonth(day, currentMonth) && !isPast(startOfDay(day))) {
      classes += ' bg-yellow-100 border-yellow-400';
    }

    return classes;
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday...

  const handleSubmit = async () => {
    if (!selectedStartDate || !selectedEndDate) {
      toast.error("Please select both a start and end date for your mess plan.");
      return;
    }
    if (!user?.id) {
      toast.error("User not logged in. Please log in to submit a mess plan.");
      return;
    }

    setSubmittingPlan(true);
    try {
      const token = localStorage.getItem('token'); // Get token
      if (!token) {
        toast.error('Authentication token not found. Please log in.');
        setSubmittingPlan(false);
        return;
      }

      const response = await axios.post<SubmitMessPlanApiResponse>('/api/student/mess-plans', {
        startDate: format(selectedStartDate, 'yyyy-MM-dd'),
        endDate: format(selectedEndDate, 'yyyy-MM-dd'),
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Mess plan request submitted successfully!');
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        fetchMessPlans(); // Refresh the list of plans
      } else {
        toast.error(response.data.message || 'Failed to submit mess plan request.');
      }
    } catch (error) {
      console.error('Error submitting mess plan:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'An error occurred while submitting mess plan.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setSubmittingPlan(false);
    }
  };

  const renderPlanStatus = (plan: MessPlan) => {
    switch (plan.status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Loader2 className="animate-spin h-3 w-3 mr-1" /> Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" /> Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <Layout title="Student Mess Plan">
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Your Mess Plan</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Section */}
            <div className="lg:col-span-2 bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Your Mess Plan Dates</h2>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setCurrentMonth(prev => subDays(startOfMonth(prev), 1))}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  &lt;
                </button>
                <h3 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
                <button
                  onClick={() => setCurrentMonth(prev => addDays(endOfMonth(prev), 1))}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  &gt;
                </button>
              </div>

              <div className="grid grid-cols-7 text-center font-medium text-gray-600 mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayIndex }).map((_, index) => (
                  <div key={`empty-${index}`} className="p-2"></div>
                ))}
                {daysInMonth.map((day, index) => (
                  <div
                    key={index}
                    className={getDayClasses(day)}
                    onClick={() => handleDateClick(day)}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Selected Dates:</h3>
                {selectedStartDate && selectedEndDate ? (
                  <>
                    <p className="text-blue-700">
                      From: <span className="font-medium">{format(selectedStartDate, 'dd MMMM yyyy')}</span>
                    </p>
                    <p className="text-blue-700 mt-1">
                      To: <span className="font-medium">{format(selectedEndDate, 'dd MMMM yyyy')}</span>
                    </p>
                    <p className="text-blue-700 mt-2 flex items-center">
                      Total Amount: <IndianRupee className="h-4 w-4 ml-1 mr-0.5" /> <span className="font-bold text-xl">{totalAmount}</span>
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={submittingPlan}
                      className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submittingPlan ? (
                        <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Submitting...</>
                      ) : (
                        'Submit Mess Plan Request'
                      )}
                    </button>
                    <button
                      onClick={() => { setSelectedStartDate(null); setSelectedEndDate(null); }}
                      className="mt-2 w-full bg-gray-300 text-gray-800 py-2 px-4 rounded-md shadow hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                      Clear Selection
                    </button>
                  </>
                ) : selectedStartDate ? (
                  <p className="text-blue-700">Select an end date for your plan.</p>
                ) : (
                  <p className="text-blue-700">Please select a start date on the calendar.</p>
                )}
              </div>
            </div>

            {/* Existing Plans Section */}
            <div className="lg:col-span-1 bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Existing Mess Plans</h2>
              {loadingPlans ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading plans...
                </div>
              ) : messPlans.length > 0 ? (
                <div className="space-y-4">
                  {messPlans.map((plan) => {
                    const formattedPlanStartDate = format(new Date(plan.startDate), 'dd MMM yyyy');
                    const formattedPlanEndDate = format(new Date(plan.endDate), 'dd MMM yyyy');
                    const isPlanActive = isAfter(new Date(plan.endDate), subDays(new Date(), 1)) && isBefore(new Date(plan.startDate), addDays(new Date(), 1)) && plan.status === 'approved';
                    const isPlanUpcoming = isBefore(new Date(), new Date(plan.startDate)) && plan.status === 'approved';

                    return (
                      <div key={plan.id} className={`border rounded-lg overflow-hidden ${
                        isPlanActive ? 'border-green-500 bg-green-50' :
                        isPlanUpcoming ? 'border-indigo-400 bg-indigo-50' :
                        plan.status === 'pending' ? 'border-yellow-400 bg-yellow-50' :
                        plan.status === 'rejected' ? 'border-red-400 bg-red-50' :
                        'border-gray-200'
                      }`}>
                        <div className={`p-3 flex justify-between items-center ${
                          isPlanActive ? 'bg-green-100' :
                          isPlanUpcoming ? 'bg-indigo-100' :
                          plan.status === 'pending' ? 'bg-yellow-100' :
                          plan.status === 'rejected' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          <span className="font-medium text-gray-800 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" /> Mess Plan
                          </span>
                          {renderPlanStatus(plan)}
                        </div>
                        <div className="p-4">
                          <div className="mb-2">
                            <span className="text-sm text-gray-500">Period:</span>
                            <p className="text-gray-700 font-medium">
                              {formattedPlanStartDate} to {formattedPlanEndDate}
                            </p>
                          </div>

                          {plan.status === 'rejected' && plan.rejectionReason && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                              <span className="font-semibold">Reason: </span>
                              {plan.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500 text-lg">You haven't made any mess plan requests yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Start by selecting dates on the calendar!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentMessPlan;
