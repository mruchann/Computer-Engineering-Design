import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';


// Create axios instance with base URL
export const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Create a separate axios instance for external API calls
export const externalApi = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'text/html',
  },
});

// Add request interceptor to add authorization header
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API utility functions
export const apiGet = async (url: string) => {
  try {
    const response = await api.get(url);
    return response;
  } catch (error) {
    console.error(`Error in GET request to ${url}:`, error);
    throw error;
  }
};

export const externalApiGet = async (url: string) => {
  try {
    const response = await externalApi.get(url);
    return response;
  } catch (error) {
    console.error(`Error in external GET request to ${url}:`, error);
    throw error;
  }
};

export const apiPost = async (url: string, data: any) => {
  try {
    const response = await api.post(url, data);
    return response;
  } catch (error) {
    console.error(`Error in POST request to ${url}:`, error);
    throw error;
  }
};

export const apiPut = async (url: string, data: any) => {
  try {
    const response = await api.put(url, data);
    return response;
  } catch (error) {
    console.error(`Error in PUT request to ${url}:`, error);
    throw error;
  }
};

export const apiDelete = async (url: string) => {
  try {
    const response = await api.delete(url);
    return response;
  } catch (error) {
    console.error(`Error in DELETE request to ${url}:`, error);
    throw error;
  }
}; 