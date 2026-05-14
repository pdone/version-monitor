import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Repository {
  id: number;
  owner: string;
  repo: string;
  description: string | null;
  htmlUrl: string | null;
  isActive: boolean;
  useGlobalCron: boolean;
  cronExpression: string;
  localVersion: string | null;
  latestVersion: string | null;
  latestVersionUrl: string | null;
  hasUpdate: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const repoApi = {
  getAll: () => api.get<Repository[]>('/repos').then(res => res.data),
  getById: (id: number) => api.get<Repository>(`/repos/${id}`).then(res => res.data),
  create: (data: { owner: string; repo: string; useGlobalCron?: boolean; cronExpression?: string }) =>
    api.post<Repository>('/repos', data).then(res => res.data),
  update: (id: number, data: Partial<Repository>) =>
    api.put<Repository>(`/repos/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/repos/${id}`),
  markUpdated: (id: number) =>
    api.post<Repository>(`/repos/${id}/mark-updated`).then(res => res.data),
  triggerCheck: (id: number) =>
    api.post<Repository>(`/repos/${id}/check`).then(res => res.data),
};

export const settingsApi = {
  get: () => api.get<Record<string, string>>('/settings').then(res => res.data),
  getDefaults: () => api.get<Record<string, string>>('/settings/defaults').then(res => res.data),
  update: (data: Record<string, string>) =>
    api.put<Record<string, string>>('/settings', data).then(res => res.data),
  testNotification: (channel?: string, templates?: Record<string, string>) =>
    api.post<{ message: string; errors?: string[] }>('/settings/test-notification', { channel, templates }).then(res => res.data),
};

export default api;
