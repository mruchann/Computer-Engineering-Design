export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/token/`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/token/refresh/`,
  BLACKLIST_TOKEN: `${API_BASE_URL}/auth/token/blacklist/`,
  REGISTER: `${API_BASE_URL}/auth/register/`,
  
  // Users & Groups
  USERS: `${API_BASE_URL}/users/`,
  ALL_GROUPS: `${API_BASE_URL}/groups/`,
  GROUPS: `${API_BASE_URL}/groups/my-groups`,

  // Files
  INDEX_METADATA: `${API_BASE_URL}/index-metadata/`,

  // Search
  SEARCH: `${API_BASE_URL}/search/`,

  // Membership
  MEMBERSHIP_ADD: `${API_BASE_URL}/memberships/Add/`,

  // ACCESS
  ACCESS_ADD: `${API_BASE_URL}/access/`,

  // Virus Scan
  VIRUS_SCAN: `${API_BASE_URL}/virus-scan/`,

  // Shared
  SHARED_JOIN: `${API_BASE_URL}/shared-join/`,
  SHARED_LEAVE: `${API_BASE_URL}/shared-leave/`,
  SHARERS_COUNT: `${API_BASE_URL}/sharers-count/`,

  // Suggestions
  SUGGESTIONS: `${API_BASE_URL}/search/suggestions/`,

  // Comments
  COMMENTS: `${API_BASE_URL}/comments/`,

  // user's files
  USERS_FILES: `${API_BASE_URL}/users-files/`,
  
  // Ratings
  RATINGS: `${API_BASE_URL}/ratings/`,
  RATING_AVERAGE: `${API_BASE_URL}/ratings/average/`,
  USER_RATINGS: `${API_BASE_URL}/ratings/user/`,
  
  // Recommendations
  RECOMMENDATIONS: `${API_BASE_URL}/recommendations/`,

  // Reports
  REPORTS: `${API_BASE_URL}/reports/`,
  REPORT_STATUS: (id) => `${API_BASE_URL}/reports/${id}/status/`,
};
