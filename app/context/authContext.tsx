'use client';

import { useRouter } from 'next/navigation';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// Define the User interface
export interface User {
  id: string;
  email: string;
  name?: string;
  // Add other user properties as needed
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  logout: (sessionExpired?: boolean) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  refreshUser: () => Promise<User | null>;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Inactivity timeout (30 minutes in milliseconds)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  // Token refresh threshold (12 minutes - refresh before 15 min expiry)
  const REFRESH_INTERVAL = 12 * 60 * 1000;

  // Use refs for timers to avoid dependency loops if we needed to access them in effects,
  // but here we just use closure variables or state if needed.
  // Actually, for global singletons in React, refs are better than local vars if re-renders happen.
  // Converting to refs to be safe across renders.
  const inactivityTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Logout function
  const logout = useCallback(
    async (sessionExpired = false) => {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      }

      // Clear timers
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

      setIsAuthenticated(false);
      setUser(null);

      if (sessionExpired) {
        router.push('/login?expired=true');
      } else {
        router.push('/login');
      }
    },
    [router]
  );

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    console.log('Session expired due to inactivity');
    await logout(true);
  }, [logout]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (isAuthenticated) {
      inactivityTimerRef.current = setTimeout(() => {
        handleSessionExpired();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, handleSessionExpired, INACTIVITY_TIMEOUT]);

  // Refresh access token
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // console.log('Token refreshed successfully');
        resetInactivityTimer();
        return true;
      } else {
        const data = await response.json();
        if (data.requiresLogin) {
          console.log('Refresh token expired, redirecting to login');
          await logout(true);
        }
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, [logout, resetInactivityTimer]);

  // Set up automatic token refresh
  const startTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Refresh token every 12 minutes (before 15 min expiry)
    refreshTimerRef.current = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);
  }, [refreshToken, REFRESH_INTERVAL]);

  // Function to manually refresh user data (e.g. after profile update)
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
    return null;
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to call a protected endpoint to verify authentication
        const response = await fetch('/api/profile', {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setIsAuthenticated(true);
          setUser(data.user); // Store user data
          // Start timers only if authenticated
          // We can call these directly here or rely on the state change if we had an effect for it,
          // but direct call is safer for init.
          // Note: resetInactivityTimer depends on 'isAuthenticated' state which might not be updated yet in closure.
          // So we might want to trigger these via a separate effect or pass flag.
          // For now, let's trust the logic flow or rely on the separate effect below.
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Effect to manage timers when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
      startTokenRefresh();

      // Set up activity listeners
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetInactivityTimer();

      activityEvents.forEach((event) => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleActivity);
        });
      };
    } else {
      // If not authenticated, clear everything
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    }
  }, [isAuthenticated, resetInactivityTimer, startTokenRefresh]);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    logout,
    refreshToken,
    refreshUser,
    resetInactivityTimer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
