import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { API_ENDPOINTS } from '../constants/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Methods
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  
  initialize: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken')
      ]);
      
      if (accessToken && refreshToken) {
        // Fetch user data
        try {
          const response = await apiClient.get(API_ENDPOINTS.USER_ME);
          set({
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user: response.data,
            isInitialized: true
          });
        } catch (error) {
          // Token might be expired, attempt refresh
          try {
            const refreshResponse = await apiClient.post(API_ENDPOINTS.REFRESH_TOKEN, {
              refresh: refreshToken
            });
            
            const newAccessToken = refreshResponse.data.access;
            
            // Save new access token
            await AsyncStorage.setItem('accessToken', newAccessToken);
            
            // Retry fetching user
            const userResponse = await apiClient.get(API_ENDPOINTS.USER_ME, {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            });
            
            set({
              isAuthenticated: true,
              accessToken: newAccessToken,
              refreshToken,
              user: userResponse.data,
              isInitialized: true
            });
          } catch (refreshError) {
            // Failed to refresh, clear tokens
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            set({
              isAuthenticated: false,
              accessToken: null,
              refreshToken: null,
              user: null,
              isInitialized: true
            });
          }
        }
      } else {
        set({
          isInitialized: true,
          isAuthenticated: false
        });
      }
    } catch (error) {
      set({
        isInitialized: true,
        isAuthenticated: false
      });
    }
  },
  
  login: async (username: string, password: string) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
      username,
      password
    });
    
    const { access, refresh } = response.data;
    
    // Store tokens
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    
    // Fetch user data
    const userResponse = await apiClient.get(API_ENDPOINTS.USER_ME, {
      headers: { Authorization: `Bearer ${access}` }
    });
    
    set({
      isAuthenticated: true,
      accessToken: access,
      refreshToken: refresh,
      user: userResponse.data,
    });
  },
  
  register: async (username: string, email: string, password: string) => {
    await apiClient.post(API_ENDPOINTS.REGISTER, {
      username,
      email,
      password
    });
    
    // After registration, login
    await get().login(username, password);
  },
  
  logout: async () => {
    try {
      const refreshToken = get().refreshToken;
      
      if (refreshToken) {
        // Blacklist the refresh token
        await apiClient.post(API_ENDPOINTS.LOGOUT, {
          refresh: refreshToken
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    // Clear tokens from storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    
    // Update state
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  }
})); 