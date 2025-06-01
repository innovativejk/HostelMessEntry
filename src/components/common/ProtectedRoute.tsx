import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // सुनिश्चित करें कि यह सही पाथ है
import Spinner from '../common/Spinner'; // यह सुनिश्चित करें कि यह आपके Spinner घटक का सही पाथ है

// AuthContext में परिभाषित User इंटरफ़ेस का उपयोग करें
// यह सुनिश्चित करने के लिए कि भूमिकाएँ सही ढंग से टाइप की गई हैं
interface User {
  id: number; // या string, जैसा कि आपके बैकएंड में है
  email: string;
  name?: string;
  role: 'student' | 'staff' | 'admin'; // सटीक भूमिकाएँ
  status: 'pending' | 'approved' | 'suspended';
  // अन्य वैकल्पिक फ़ील्ड
  phone?: string;
  studentId?: number;
  course?: string;
  year?: string;
  branch?: string;
  enrollmentNumber?: string;
  rollNo?: string;
  staffId?: number;
  employeeId?: string;
  position?: string;
}

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: User['role'][]; // User के 'role' टाइप का उपयोग करें
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading, isAuthenticated } = useAuth(); // isAuthenticated को भी डीस्ट्रक्चर करें
  const location = useLocation();

  if (loading) {
    // AuthContext से डेटा लोड होने तक एक फुल-स्क्रीन स्पिनर दिखाएं
    return <Spinner />;
  }

  // यदि कोई उपयोगकर्ता लॉग इन नहीं है
  if (!isAuthenticated) { // !user के बजाय isAuthenticated का उपयोग करें
    // लॉगिन पेज पर रीडायरेक्ट करें, ताकि सफलतापूर्वक लॉगिन होने पर वापस उसी पेज पर आ सकें
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // यदि उपयोगकर्ता लॉग इन है लेकिन उसकी भूमिका अनुमत नहीं है
  if (user && !allowedRoles.includes(user.role)) {
    console.warn(`Access denied: User ${user.email} (role: ${user.role}) attempted to access a route requiring roles: ${allowedRoles.join(', ')}`);
    
    // अनधिकृत एक्सेस के लिए एक विशिष्ट पेज पर रीडायरेक्ट करें
    // आप एक `/unauthorized` पेज बना सकते हैं जहाँ आप एक स्पष्ट संदेश दिखा सकते हैं।
    // या आप उन्हें सीधे उनके डैशबोर्ड पर रीडायरेक्ट कर सकते हैं यदि आप उन्हें पूरी तरह से रोकना नहीं चाहते हैं।
    // एक `/unauthorized` पेज बनाना अधिक पेशेवर है।
    return <Navigate to="/unauthorized" replace />;
  }

  // यदि उपयोगकर्ता लॉग इन है और भूमिका अनुमत है, तो बच्चे घटकों को रेंडर करें
  return <>{children}</>;
};

export default ProtectedRoute;