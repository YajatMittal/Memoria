import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { api, ApiError, Session, setAuthToken, setUnauthorizedHandler, User } from '@/api';

const STORAGE_KEY = 'memoria.session';

// Tokens go in the OS keychain/keystore on devices; web falls back to localStorage.
const storage = {
  get: () => (Platform.OS === 'web' ? AsyncStorage.getItem(STORAGE_KEY) : SecureStore.getItemAsync(STORAGE_KEY)),
  set: (value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(STORAGE_KEY, value) : SecureStore.setItemAsync(STORAGE_KEY, value),
  clear: () =>
    Platform.OS === 'web' ? AsyncStorage.removeItem(STORAGE_KEY) : SecureStore.deleteItemAsync(STORAGE_KEY),
};

type AuthContextValue = {
  user: User | null;
  /** True while the saved session is being restored on launch. */
  restoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  verify: (accountId: number, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);

  const startSession = useCallback(async (session: Session) => {
    setAuthToken(session.token);
    setUser(session.user);
    await storage.set(JSON.stringify(session));
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await storage.clear();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore the saved session, then confirm the token is still valid.
  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.get();
        if (!saved) return;
        const session: Session = JSON.parse(saved);
        setAuthToken(session.token);
        setUser(session.user);
        try {
          const { user: fresh } = await api.auth.me();
          setUser(fresh);
        } catch (err) {
          // Offline is fine (keep the session); a rejected token logs out via the 401 handler.
          if (err instanceof ApiError && err.status === 401) await logout();
        }
      } catch {
        await logout();
      } finally {
        setRestoring(false);
      }
    })();
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      restoring,
      login: async (email, password) => startSession(await api.auth.login(email, password)),
      verify: async (accountId, code) => startSession(await api.auth.verify(accountId, code)),
      logout,
    }),
    [user, restoring, startSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
