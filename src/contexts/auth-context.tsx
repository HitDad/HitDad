import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearAuthTokens,
  setAuthTokens,
  setOnAuthFailure,
  setOnTokensRefreshed,
} from '@/services/api';
import {
  authService,
  loadStoredTokens,
  removeStoredTokens,
  saveStoredTokens,
} from '@/services/auth';
import type { AuthUser, LoginBody } from '@/types';

/** In-memory registration draft kept out of navigation route params. */
export interface PendingRegistration {
  username: string;
  password: string;
  displayName: string;
  email: string;
  phone?: string;
}

/** In-memory password recovery draft kept out of navigation route params. */
export interface PendingPasswordReset {
  email: string;
  maskedEmail: string;
  resetToken?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  pendingRegistration: PendingRegistration | null;
  pendingPasswordReset: PendingPasswordReset | null;
  signIn: (body: LoginBody) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setPendingRegistration: (draft: PendingRegistration | null) => void;
  setPendingPasswordReset: (draft: PendingPasswordReset | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [pendingPasswordReset, setPendingPasswordReset] = useState<PendingPasswordReset | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    setOnTokensRefreshed((tokens) => {
      void saveStoredTokens(tokens);
    });
    setOnAuthFailure(() => {
      void removeStoredTokens();
      if (isMounted) {
        setUser(null);
      }
    });

    async function hydrate() {
      try {
        const tokens = await loadStoredTokens();
        if (!tokens) return;

        setAuthTokens(tokens);
        const me = await authService.getMe();
        if (isMounted) {
          setUser(me.user);
        }
      } catch {
        clearAuthTokens();
        await removeStoredTokens();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    void hydrate();

    return () => {
      isMounted = false;
      setOnTokensRefreshed(null);
      setOnAuthFailure(null);
    };
  }, []);

  const signIn = useCallback(async (body: LoginBody): Promise<AuthUser> => {
    const response = await authService.login(body);
    const tokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
    setAuthTokens(tokens);
    await saveStoredTokens(tokens);
    setUser(response.user);
    return response.user;
  }, []);

  const signOut = useCallback(async () => {
    clearAuthTokens();
    await removeStoredTokens();
    setUser(null);
    setPendingRegistration(null);
    setPendingPasswordReset(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isHydrating,
      pendingRegistration,
      pendingPasswordReset,
      signIn,
      signOut,
      refreshUser,
      setPendingRegistration,
      setPendingPasswordReset,
    }),
    [
      user,
      isHydrating,
      pendingRegistration,
      pendingPasswordReset,
      signIn,
      signOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
