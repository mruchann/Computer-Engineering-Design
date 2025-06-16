import { apiGet } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  date_joined?: string;
  groups?: string[];
}

/**
 * Fetches the current user's information and stores it in localStorage
 */
export const fetchAndStoreCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiGet('/api/users/me/');
    const userData = response.data;
    
    // Store the user data in localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

/**
 * Retrieves the current user's information from localStorage
 */
export const getCurrentUser = (): User | null => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error retrieving current user:', error);
    return null;
  }
};

/**
 * Clears the current user's information from localStorage
 */
export const clearCurrentUser = (): void => {
  localStorage.removeItem('userData');
}; 