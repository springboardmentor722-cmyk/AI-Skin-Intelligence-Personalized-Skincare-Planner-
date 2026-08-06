import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        const userWithRole = {
          ...response.data.user,
          role_id: userData.role_id
        };
        setUser(userWithRole);
        localStorage.setItem('userRole', userData.role_id);
        
        return { success: true, user: userWithRole };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Registration failed';
      console.error('Registration error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // ✅ SIMPLIFIED LOGIN
  const login = async (email, password) => {
    try {
      console.log('🔐 LOGIN START:', email);
      
      const response = await authAPI.login({ email, password });
      console.log('📦 API RESPONSE:', response.data);
      
      if (response.data?.access_token) {
        console.log('✅ TOKEN RECEIVED');
        
        // Store token
        localStorage.setItem('token', response.data.access_token);
        console.log('💾 TOKEN STORED');
        
        // Get user data
        const userWithRole = response.data.user;
        console.log('👤 USER DATA:', userWithRole);
        
        // Store user in state
        setUser(userWithRole);
        
        // Store role
        localStorage.setItem('userRole', userWithRole.role_id);
        console.log('✅ ROLE STORED:', userWithRole.role_id);
        
        console.log('🎯 RETURNING SUCCESS');
        return { 
          success: true, 
          user: userWithRole 
        };
      } else {
        console.log('❌ NO TOKEN IN RESPONSE');
        return { 
          success: false, 
          error: 'No token received' 
        };
      }
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Login failed';
      setError(errorMsg);
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setError('');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}