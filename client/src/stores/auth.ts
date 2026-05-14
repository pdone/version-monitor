import { create } from 'zustand';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookie';

const AUTH_COOKIE_NAME = 'vm_auth_verified';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  verify: (password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();

      if (!data.required) {
        set({ isAuthenticated: true, isLoading: false });
        return;
      }

      const cookieValue = getCookie(AUTH_COOKIE_NAME);
      if (cookieValue === 'true') {
        set({ isAuthenticated: true, isLoading: false });
        return;
      }

      set({ isAuthenticated: false, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  verify: async (password: string, remember: boolean) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        if (remember) {
          setCookie(AUTH_COOKIE_NAME, 'true', 30);
        }
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: () => {
    deleteCookie(AUTH_COOKIE_NAME);
    set({ isAuthenticated: false });
  },
}));
