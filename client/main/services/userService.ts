import axios from 'axios';
import config from '../config';

interface UserInfo {
  id: string;
  username: string;
  email: string;
}

export async function getUserInfo(token: string): Promise<UserInfo> {
  try {
    const response = await axios.get(`${config.DJANGO_SERVER_URL}/api/users/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get user info: ${response.data.detail || 'Unknown error'}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
} 