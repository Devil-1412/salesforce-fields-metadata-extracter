'use client';

import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconLock, IconLogin } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { GoogleIcon } from '../components/GoogleIcon';
import { useAuth } from '../context/authContext';
import { getPublicAppUrl } from '../utils/getPublicAppUrl';
import { supabase } from '../utils/supabase';

function LoginForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Logged in successfully!');

        // Wait for auth state to be updated before navigating
        await refreshUser();

        // Prioritize redirect path if it exists
        if (redirectPath) {
          router.push(redirectPath);
          return;
        }

        // Default routing logic
        if (data.hasOrganization) {
          router.push('/');
        } else {
          router.push('/onboarding');
        }
      } else {
        toast.error(`${data.error || 'Login failed. Please Try again.'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <Container size="xs" style={{ width: '100%' }}>
        <Paper
          radius="xl"
          shadow="xl"
          p="xl"
          withBorder
          style={{ position: 'relative', paddingTop: '3rem' }}
        >
          {/* Floating Icon */}
          <Center
            style={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <ThemeIcon size={64} radius="xl" variant="filled" color="blue">
              <IconLock size={32} />
            </ThemeIcon>
          </Center>

          <Title order={2} ta="center" mt="md">
            Welcome Back 👋
          </Title>
          <Text c="dimmed" ta="center" mt="xs" size="sm">
            Sign in to your Salesforce Metadata Extractor account
          </Text>

          <form onSubmit={handleLogin}>
            <Stack mt="xl" gap="md">
              <TextInput
                name="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
              />

              <PasswordInput name="password" label="Password" placeholder="••••••••" required />

              <Group justify="space-between">
                <Anchor component={Link} href="#" size="xs">
                  Forgot password?
                </Anchor>
              </Group>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                leftSection={!loading && <IconLogin size={18} />}
                size="md"
              >
                {loading ? 'Connecting to Salesforce...' : 'Sign In'}
              </Button>

              <Divider label="Or continue with" labelPosition="center" my="sm" />

              <Button
                fullWidth
                variant="default"
                c="gray"
                leftSection={<GoogleIcon />}
                onClick={async () => {
                  try {
                    const redirectTo = `${getPublicAppUrl()}/auth/callback`;
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo,
                      },
                    });
                    if (error) throw error;
                  } catch (error) {
                    console.error('Google login error:', error);
                    toast.error('Could not initiate Google Login');
                  }
                }}
              >
                Login with Google
              </Button>
            </Stack>
          </form>

          <Text ta="center" c="dimmed" size="sm" mt="xl">
            Don&apos;t have an account?{' '}
            <Anchor component={Link} href="/signup" fw={600}>
              Sign up
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader size="lg" />
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
