import { env } from '../../config/env';
export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const token = sessionStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: { ...headers, ...customConfig.headers },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${env.VITE_API_URL}${endpoint}`;
  
  let data;
  try {
    const response = await fetch(url, config);
    data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (err) {
    throw err;
  }
}
