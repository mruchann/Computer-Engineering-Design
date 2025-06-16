// API base URL - Change to your server's IP address
// For development using localhost on iOS simulator, you can use localhost
// For physical devices, use your computer's IP address on the same network
export const API_BASE_URL = 'http://localhost:8000/api';  // Server IP address

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/token/`,
  REGISTER: `${API_BASE_URL}/auth/register/`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/token/refresh/`,
  LOGOUT: `${API_BASE_URL}/auth/token/blacklist/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
  
  // User
  USER_ME: `${API_BASE_URL}/users/me/`,
  USERS: `${API_BASE_URL}/users/`,
  
  // Groups
  GROUPS: `${API_BASE_URL}/groups/`,
  MEMBERSHIPS: `${API_BASE_URL}/memberships/`,
  
  // Search
  SEARCH: `${API_BASE_URL}/search/`,
  SUGGESTIONS: `${API_BASE_URL}/search/suggestions/`,
  
  // Files
  MAGNET: `${API_BASE_URL}/magnet/`,
  VIRUS_SCAN: `${API_BASE_URL}/virus-scan/`,
  SHARERS_COUNT: `${API_BASE_URL}/sharers-count/`,
  
  // Shared links
  SHARED_JOIN: `${API_BASE_URL}/shared-join/`,
  SHARED_LEAVE: `${API_BASE_URL}/shared-leave/`,
  
  // Comments and Ratings
  COMMENTS: `${API_BASE_URL}/comments/`,
  RATINGS: `${API_BASE_URL}/ratings/`,
  
  // Recommendations
  RECOMMENDATIONS: `${API_BASE_URL}/recommendations/`,

  // Feedback
  FEEDBACK: `${API_BASE_URL}/feedback/`,
};

// TrackerURL from original app
export const TRACKER_URL = 'ws://144.122.71.171:8080'; 