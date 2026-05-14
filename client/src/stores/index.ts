import { create } from 'zustand';
import { repoApi, settingsApi, Repository } from '@/lib/api';

interface RepoState {
  repos: Repository[];
  loading: boolean;
  error: string | null;
  fetchRepos: () => Promise<void>;
  addRepo: (owner: string, repo: string, cronExpression?: string) => Promise<void>;
  updateRepo: (id: number, data: Partial<Repository>) => Promise<void>;
  deleteRepo: (id: number) => Promise<void>;
  markUpdated: (id: number) => Promise<void>;
  triggerCheck: (id: number) => Promise<void>;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repos: [],
  loading: false,
  error: null,

  fetchRepos: async () => {
    set({ loading: true, error: null });
    try {
      const repos = await repoApi.getAll();
      set({ repos, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch repositories', loading: false });
    }
  },

  addRepo: async (owner: string, repo: string, cronExpression?: string) => {
    set({ loading: true, error: null });
    try {
      await repoApi.create({ owner, repo, cronExpression });
      await get().fetchRepos();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add repository';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateRepo: async (id: number, data: Partial<Repository>) => {
    set({ loading: true, error: null });
    try {
      await repoApi.update(id, data);
      await get().fetchRepos();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update repository';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteRepo: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await repoApi.delete(id);
      await get().fetchRepos();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete repository';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  markUpdated: async (id: number) => {
    try {
      await repoApi.markUpdated(id);
      await get().fetchRepos();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to mark as updated';
      set({ error: message });
      throw new Error(message);
    }
  },

  triggerCheck: async (id: number) => {
    try {
      await repoApi.triggerCheck(id);
      await get().fetchRepos();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to check repository';
      set({ error: message });
      throw new Error(message);
    }
  },
}));

interface SettingsState {
  settings: Record<string, string>;
  defaults: Record<string, string>;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  fetchDefaults: () => Promise<void>;
  updateSettings: (data: Record<string, string>) => Promise<void>;
  testNotification: (channel?: string, templates?: Record<string, string>) => Promise<{ message: string; errors?: string[] }>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  defaults: {},
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.get();
      set({ settings, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch settings', loading: false });
    }
  },

  fetchDefaults: async () => {
    try {
      const defaults = await settingsApi.getDefaults();
      set({ defaults });
    } catch (error) {
      console.error('Failed to fetch defaults', error);
    }
  },

  updateSettings: async (data: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.update(data);
      set({ settings, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update settings';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  testNotification: async (channel?: string, templates?: Record<string, string>) => {
    try {
      return await settingsApi.testNotification(channel, templates);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send test notification';
      throw new Error(message);
    }
  },
}));
