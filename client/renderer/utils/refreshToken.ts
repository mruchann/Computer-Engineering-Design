import { API_ENDPOINTS } from '../constants/api';
import { useAuthStore } from '../store/useAuthStore';

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    useAuthStore.getState().updateAccessToken(data.access);
    return data.access;
  } catch (error) {
    useAuthStore.getState().logout();
    return null;
  }
} 