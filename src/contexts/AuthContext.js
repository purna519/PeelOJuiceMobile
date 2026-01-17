import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {login as loginAPI, getUserProfile} from '../services/auth';

const AuthContext = createContext({});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
    
    // Listen for session expiry events from API interceptor
    const authEventEmitter = require('../services/authEventEmitter').default;
    const {AUTH_EVENTS} = require('../services/authEventEmitter');
    
    const handleSessionInvalid = () => {
      console.log('🚪 Session invalid - forcing logout');
      setUser(null);
      setIsAuthenticated(false);
    };
    
    authEventEmitter.on(AUTH_EVENTS.SESSION_INVALID, handleSessionInvalid);
    
    // Cleanup listener on unmount
    return () => {
      authEventEmitter.off(AUTH_EVENTS.SESSION_INVALID, handleSessionInvalid);
    };
  }, []);

  const loadUser = async () => {
    try {
      const [accessToken, userData] = await AsyncStorage.multiGet([
        'accessToken',
        'user',
      ]);

      if (accessToken[1] && userData[1]) {
        console.log('✅ User loaded from storage');
        setUser(JSON.parse(userData[1]));
        setIsAuthenticated(true);
      } else {
        console.log('⚠️ No valid session found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext login called with:', email);
      const response = await loginAPI(email, password);
      console.log('Login response:', response);
      
      // Backend returns access_token and refresh_token (with underscores)
      const {access_token, refresh_token, user: userData} = response;

      // Save tokens and user data
      await AsyncStorage.multiSet([
        ['accessToken', access_token],
        ['refreshToken', refresh_token],
        ['user', JSON.stringify(userData)],
      ]);

      setUser(userData);
      setIsAuthenticated(true);

      return {success: true};
    } catch (error) {
      console.error('Login error full:', error);
      console.error('Login error response:', error.response);
      console.error('Login error data:', error.response?.data);
      
      // Try to get error message from different possible locations
      const errorMsg = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        'Login failed';
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getUserProfile();
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
