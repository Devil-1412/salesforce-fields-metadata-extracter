"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // Add user state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
    // Inactivity timeout (30 minutes in milliseconds)
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
    // Token refresh threshold (12 minutes - refresh before 15 min expiry)
    const REFRESH_INTERVAL = 12 * 60 * 1000;
    
    let inactivityTimer = null;
    let refreshTimer = null;

    // Reset inactivity timer on user activity
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        
        inactivityTimer = setTimeout(() => {
            handleSessionExpired();
        }, INACTIVITY_TIMEOUT);
    }, []);

    // Handle session expiration
    const handleSessionExpired = useCallback(async () => {
        console.log('Session expired due to inactivity');
        await logout(true);
    }, []);

    // Refresh access token
    const refreshToken = useCallback(async () => {
        try {
            const response = await fetch('/api/refresh', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                console.log('Token refreshed successfully');
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
    }, [resetInactivityTimer]);

    // Set up automatic token refresh
    const startTokenRefresh = useCallback(() => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }

        // Refresh token every 12 minutes (before 15 min expiry)
        refreshTimer = setInterval(() => {
            refreshToken();
        }, REFRESH_INTERVAL);
    }, [refreshToken]);

    // Logout function
    const logout = useCallback(async (sessionExpired = false) => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear timers
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (refreshTimer) clearInterval(refreshTimer);

        setIsAuthenticated(false);
        setUser(null);
        
        if (sessionExpired) {
            router.push('/login?expired=true');
        } else {
            router.push('/login');
        }
    }, [router]);

    // Function to manually refresh user data (e.g. after profile update)
    const refreshUser = useCallback(async () => {
         try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                credentials: 'include'
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
                    credentials: 'include'
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    setIsAuthenticated(true);
                    setUser(data.user); // Store user data
                    resetInactivityTimer();
                    startTokenRefresh();
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

        // Set up activity listeners
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        // Cleanup
        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            if (refreshTimer) clearInterval(refreshTimer);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
        };
    }, []);

    const value = {
        isAuthenticated,
        user,
        isLoading,
        logout,
        refreshToken,
        refreshUser,
        resetInactivityTimer
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
