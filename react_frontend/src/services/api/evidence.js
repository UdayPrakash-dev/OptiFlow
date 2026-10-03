import { apiClient } from './client';

export const list = () => apiClient('/api/evidence');
export const get = (id) => apiClient(`/api/evidence/${id}`);
export const create = (data) => apiClient('/api/evidence', { body: data });
export const update = (id, data) => apiClient(`/api/evidence/${id}`, { method: 'PATCH', body: data });
export const remove = (id) => apiClient(`/api/evidence/${id}`, { method: 'DELETE' });
