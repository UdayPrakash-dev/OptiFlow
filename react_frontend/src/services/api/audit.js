import { apiClient } from './client';

export const list = () => apiClient('/api/audit');
export const get = (id) => apiClient(`/api/audit/${id}`);
export const create = (data) => apiClient('/api/audit', { body: data });
export const update = (id, data) => apiClient(`/api/audit/${id}`, { method: 'PATCH', body: data });
export const remove = (id) => apiClient(`/api/audit/${id}`, { method: 'DELETE' });
