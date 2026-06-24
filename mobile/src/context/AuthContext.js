import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL as DEFAULT_API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  useEffect(() => {
    // Load persisted auth data and custom API URL
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        const storedEmployee = await AsyncStorage.getItem('employeeData');
        const storedApiUrl = await AsyncStorage.getItem('apiUrl');

        if (storedApiUrl) {
          setApiUrl(storedApiUrl);
        }
        if (storedToken && storedUser && storedEmployee) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setEmployee(JSON.parse(storedEmployee));
        }
      } catch (e) {
        console.error('Failed to load login state:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const updateApiUrl = async (newUrl) => {
    try {
      await AsyncStorage.setItem('apiUrl', newUrl);
      setApiUrl(newUrl);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('employeeData', JSON.stringify(data.employee));

        setToken(data.token);
        setUser(data.user);
        setEmployee(data.employee);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      return { 
        success: false, 
        message: 'Could not connect to API server. Please check your API Server IP address or connection.' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('employeeData');
      setToken(null);
      setUser(null);
      setEmployee(null);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, employee, token, loading, apiUrl, updateApiUrl, login, logout, setEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};
