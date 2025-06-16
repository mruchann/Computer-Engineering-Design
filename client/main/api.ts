// Create a new file: client/main/api.ts
import { API_ENDPOINTS } from '../renderer/constants/api';

export const fetchGroups = async () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    const authData = authStorage ? JSON.parse(authStorage) : null;
    const accessToken = authData?.state?.accessToken;

    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(API_ENDPOINTS.ALL_GROUPS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return [];
  }
};