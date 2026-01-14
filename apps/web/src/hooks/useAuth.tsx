'use client';

/**
 * Auth Hook
 *
 * React hook for authentication state management.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { apiClient, auth as authApi } from '@/lib/api';
import type { User, AuthResponse } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: { code: string; message: string } | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  telegramLogin: (initData: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getToken();

      if (token) {
        try {
          const response = await authApi.me();

          if (response.success && response.data) {
            setState({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          }
        } catch {
          // Token invalid, clear it
          apiClient.clearAuth();
        }
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    };

    initAuth();
  }, []);

  const handleAuthResponse = useCallback((response: { success: boolean; data?: AuthResponse; error?: { code: string; message: string } }) => {
    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      setState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } else if (response.error) {
      setState((prev) => ({
        ...prev,
        error: response.error!,
        isLoading: false,
      }));
      return false;
    }
    return false;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await authApi.login(email, password);
      return handleAuthResponse(response);
    },
    [handleAuthResponse]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await authApi.register(email, password);
      return handleAuthResponse(response);
    },
    [handleAuthResponse]
  );

  const telegramLogin = useCallback(
    async (initData: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await authApi.telegramLogin(initData);
      return handleAuthResponse(response);
    },
    [handleAuthResponse]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    apiClient.clearAuth();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await authApi.me();
    if (response.success && response.data) {
      setState((prev) => ({ ...prev, user: response.data! }));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        telegramLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default useAuth;
