import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const { user } = useAuth();
  
  // Determine dashboard route based on user role
  const dashboardRoute = (() => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'student': return '/student';
      case 'staff': return '/staff';
      case 'admin': return '/admin';
      default: return '/login';
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <QrCode className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          to={dashboardRoute}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Home className="h-5 w-5 mr-2" />
          {user ? 'Back to Dashboard' : 'Go to Login'}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;