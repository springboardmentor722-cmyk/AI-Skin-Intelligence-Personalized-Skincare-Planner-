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
    console.log('Registration data:', userData);
    
    const payload = {
      email: userData.email,
      password: userData.password,
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role_id: userData.role_id || 1
    };
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    const response = await authAPI.register(payload);
    
    console.log('Register response:', response.data);
    
    // Handle both token and non-token responses
    if (response.data?.access_token) {
      // Admin auto-approved - store token and user
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userRole', response.data.user.role_id);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } else if (response.data?.is_approved === false) {
      // Non-admin pending approval
      return { 
        success: true, 
        user: response.data.user,
        message: response.data.message || 'Registration successful. Awaiting admin approval.'
      };
    } else if (response.data?.message) {
      // Generic success
      return { 
        success: true, 
        message: response.data.message,
        user: response.data.user
      };
    }
    
    return { success: false, error: 'Registration failed' };
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMsg = 'Registration failed';
    
    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        errorMsg = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        errorMsg = error.response.data.detail.map(err => {
          if (typeof err === 'string') return err;
          if (err.msg) return `${err.msg}`;
          return JSON.stringify(err);
        }).join('; ');
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
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