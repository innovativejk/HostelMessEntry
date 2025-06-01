// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios'; // AxiosHeaders इम्पोर्ट करें
import { toast } from 'react-hot-toast';
import api from '../utils/api';

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

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        // config.headers को AxiosHeaders इंस्टेंस के रूप में इनिशियलाइज़ करें
        config.headers = new AxiosHeaders();
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get<{ user: User }>('/api/auth/me');
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            console.error('Error fetching user data:', error);
          }
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
        role,
      });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.success(`Welcome back, ${response.data.user.name || response.data.user.email}!`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          throw new Error('Incorrect email or password.');
        }
        if (error.response.status === 403) {
            throw new Error(error.response.data.message || 'Access denied. Your account may be pending approval or suspended.');
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
      await api.post<{ message: string }>('/api/auth/register', {
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