'use client';

import { Box, Loader, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase client automatically parses the hash fragment to get the session
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!data.session) {
          // If no session found immediately, listen for auth state change (sometimes takes a moment)
          const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              await setSessionAndRedirect(session);
              listener.subscription.unsubscribe();
            }
          });
          return;
        }

        await setSessionAndRedirect(data.session);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast.error('Authentication failed');
        router.push('/login');
      }
    };

    const setSessionAndRedirect = async (session: any) => {
      try {
        // Send session to server to set cookies
        const res = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to set server session');
        }

        const data = await res.json();

        toast.success('Successfully logged in!');

        // Force a hard reload to ensure cookies are sent and AuthProvider re-initializes
        // Redirect to onboarding if user has no organization
        if (data.hasOrganization) {
          window.location.href = '/';
        } else {
          window.location.href = '/onboarding';
        }
      } catch (err) {
        console.error('Set session error:', err);
        setError('Failed to establish session');
        toast.error('Failed to establish session');
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Text c="red">Authentication Error: {error}</Text>
        <Text size="sm" c="dimmed" mt="xs">
          Redirecting to login...
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Loader size="lg" />
      <Text mt="md">Finalizing login...</Text>
    </Box>
  );
}
