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
  baseURL: '/api',
});

authAxios.interceptors.request.use(
  (config) => {
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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to fetch user details on token presence
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAxios.get<{ user: User }>('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        localStorage.removeItem('token'); // Clear invalid token
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      const response = await authAxios.post<{ token: string; user: User }>('/auth/login', { email, password, role });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error: unknown) {
      setIsAuthenticated(false);
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data.message;
        if (message === 'PENDING_APPROVAL') {
          throw new Error('Your account is pending admin approval. Please wait for approval before logging in.');
        } else if (message === 'INCORRECT_PASSWORD') {
          throw new Error('Incorrect password. Please try again.');
        } else if (message === 'EMAIL_OR_ROLE_MISMATCH') {
          throw new Error('No user found with the provided email and role. Please check your credentials.');
        } else if (message === 'ACCOUNT_SUSPENDED') {
          throw new Error('Your account has been suspended. Please contact the administrator.');
        }
        throw new Error(error.response.data.message || 'Login failed. Please check your credentials.');
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
        throw new Error(error.response.data.message || 'Registration failed.');
      }
      throw new Error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
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