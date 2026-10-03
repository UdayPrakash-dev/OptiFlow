// WHY: Centralizing fetch logic here ensures every request across the app 
// automatically includes the auth token and handles errors (like 401 Unauthorized) 
// the exact same way, preventing duplicate code in every API call.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Step 6 requirement: Clear session and redirect on 401
    if (response.status === 401) {
      sessionStorage.removeItem('authToken');
      window.location.href = '/login'; 
    }
    // Step 6 requirement: Throw readable error from message
    throw new Error(data?.message || `Error ${response.status}: Request failed`);
  }

  // Step 6 requirement: unwrap { success, data }
  return data?.data || data; 
};
