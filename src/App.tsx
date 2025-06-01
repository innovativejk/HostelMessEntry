// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute'; // This component now handles the loading spinner
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentMessPlan from './pages/student/MessPlan';
import StudentAttendance from './pages/student/Attendance';
import StaffDashboard from './pages/staff/Dashboard';
import StaffAttendance from './pages/staff/Attendance';
import StaffQRCodeScannerPage from './pages/staff/QRCodeScanner';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminMessPlans from './pages/admin/MessPlans';
import AdminAttendance from './pages/admin/Attendance';
import NotFound from './pages/NotFound';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Add a route for unauthorized access if needed */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/mess-plan" element={<ProtectedRoute allowedRoles={['student']}><StudentMessPlan /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />

          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={['staff']}><StaffAttendance /></ProtectedRoute>} />
          <Route path="/staff/scanner" element={<ProtectedRoute allowedRoles={['staff']}><StaffQRCodeScannerPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/mess-plans" element={<ProtectedRoute allowedRoles={['admin']}><AdminMessPlans /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendance /></ProtectedRoute>} />

          {/* Redirect to login if path doesn't match and not handled by other routes */}
          {/* IMPORTANT: This should be before the 404 if you want unmatched paths to go to login first */}
          {/* Consider if you want this to redirect or just rely on ProtectedRoute */}
          {/* A better approach for root would be: */}
          <Route path="/" element={<Navigate to="/login" replace />} /> {/* This should ideally be at the very end */}


          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;