import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://web-production-53e0c.up.railway.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased from 10s to 15s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle 401 errors and token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle network errors (no response from server)
    if (!error.response) {
      console.error('❌ Network error:', error.message);
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        const timeoutError = new Error('Request timed out. Please check your internet connection and try again.');
        timeoutError.isTimeout = true;
        return Promise.reject(timeoutError);
      }
      
      // General network error
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    // If 401 error and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (refreshToken) {
          console.log('🔄 Attempting to refresh access token...');
          
          // Try to refresh the token
          const response = await axios.post(
            `${API_BASE_URL}/users/token/refresh/`,
            {refresh: refreshToken},
            {timeout: 10000}, // 10s timeout for refresh
          );

          // Backend returns access_token (with underscore)
          const {access_token} = response.data;

          // Save new access token
          await AsyncStorage.setItem('accessToken', access_token);
          console.log('✅ Access token refreshed successfully');

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } else {
          // No refresh token available
          console.log('⚠️ No refresh token available');
          await handleSessionExpiry();
          
          // Return a user-friendly error
          const sessionError = new Error('Your session has expired. Please login again.');
          sessionError.isSessionExpired = true;
          return Promise.reject(sessionError);
        }
      } catch (refreshError) {
        // Refresh token failed or expired
        console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        await handleSessionExpiry();
        
        // Return a user-friendly error
        const sessionError = new Error('Your session has expired. Please login again.');
        sessionError.isSessionExpired = true;
        return Promise.reject(sessionError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Handle session expiry by clearing tokens and emitting logout event
 */
async function handleSessionExpiry() {
  try {
    // Clear all authentication data
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    console.log('🔒 Session expired - cleared all tokens');
    
    // Emit logout event to AuthContext
    const authEventEmitter = require('./authEventEmitter').default;
    const {AUTH_EVENTS} = require('./authEventEmitter');
    authEventEmitter.emit(AUTH_EVENTS.SESSION_INVALID);
  } catch (error) {
    console.error('Error handling session expiry:', error);
    // Don't throw - this is cleanup, shouldn't crash the app
  }
}

export {API_BASE_URL};
export default api;

