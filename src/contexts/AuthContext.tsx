import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'staff' | 'admin';
  status: 'pending' | 'approved' | 'suspended';
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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // यह आपके API बेस URL से मेल खाना चाहिए
  withCredentials: true, // कुकीज़ भेजने/प्राप्त करने के लिए महत्वपूर्ण
});

authAxios.interceptors.request.use(
  (config) => {
    // यदि आपका बैकएंड HttpOnly कुकीज़ पर निर्भर करता है, तो localStorage से टोकन की आवश्यकता नहीं है।
    // यदि आपका बैकएंड JWT को रिस्पांस बॉडी में भेजता है और आप उसे localStorage में स्टोर करते हैं,
    // तो यह आवश्यक होगा। मौजूदा कॉन्फ़िगरेशन को बनाए रखा गया है।
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // प्रारंभिक लोडिंग स्थिति
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // उपयोगकर्ता डेटा प्राप्त करने और प्रमाणीकरण स्थिति सेट करने के लिए फ़ंक्शन
  const fetchUser = useCallback(async () => {
    try {
      // बैकएंड से उपयोगकर्ता डेटा प्राप्त करने का प्रयास करें।
      // यदि एक HttpOnly कुकी मौजूद है, तो बैकएंड इसे मान्य करेगा।
      const response = await authAxios.get<{ user: User }>('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      // यदि प्रमाणीकरण विफल हो जाता है (जैसे, कोई वैध कुकी नहीं, टोकन समाप्त हो गया),
      // किसी भी लोकल स्टोरेज आइटम को साफ़ करें और उपयोगकर्ता को null पर सेट करें।
      localStorage.removeItem('token'); // यदि आप इसे स्टोर करते हैं, तो बस मामले में
      setUser(null);
      setIsAuthenticated(false);
      console.error("Failed to re-authenticate user session:", error);
    } finally {
      setLoading(false); // प्रमाणीकरण जांच पूरी हो गई है
    }
  }, []); // खाली निर्भरता सरणी सुनिश्चित करती है कि यह एक बार बनाई गई है

  // घटक माउंट पर प्रारंभिक प्रमाणीकरण जांच
  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // माउंट पर एक बार fetchUser को कॉल करें

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      // बैकएंड को HttpOnly कुकी सेट करनी चाहिए और बॉडी में उपयोगकर्ता डेटा वापस कर सकता है
      const response = await authAxios.post<{ token?: string; user: User }>('/auth/login', { email, password, role });

      // यदि बैकएंड रिस्पांस बॉडी में टोकन देता है, तो उसे स्टोर करें।
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      // रिस्पांस से उपयोगकर्ता डेटा सेट करें
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Login failed. Please check your credentials.');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
      throw new Error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      await authAxios.post<{ message: string }>('/auth/register', {
        ...userData,
        role: 'student',
      });
      toast.success('Registration successful! Please wait for admin approval.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data.errors) {
          const validationErrors = error.response.data.errors.map((err: { msg: string }) => err.msg).join(', ');
          throw new Error(validationErrors);
        }
        toast.error(error.response.data.message || 'Registration failed.');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed.');
      }
      throw new Error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token'); // टोकन हटा दें यदि स्टोर किया गया हो
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully!');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};