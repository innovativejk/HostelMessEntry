// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Import InternalAxiosRequestConfig and AxiosRequestHeaders
import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { toast } from 'react-hot-toast';
import api from '../utils/api'; // Import the default export

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

// Interceptor setup for the 'api' instance
api.interceptors.request.use(
  // Use InternalAxiosRequestConfig for the config parameter
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure config.headers is initialized as AxiosRequestHeaders
      config.headers = config.headers || {} as AxiosRequestHeaders;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => { // Explicitly type error
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get<{ user: User }>('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password, role });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
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
      // Use the 'api' instance for registration as well
      await api.post<{ message: string }>('/auth/register', {
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