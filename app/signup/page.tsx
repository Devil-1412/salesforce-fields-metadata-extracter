'use client';

import { GoogleIcon } from '@components/GoogleIcon';
import {
  Anchor,
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCircleCheck, IconUserPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: name }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Account created successfully! Please verify your email.');
        router.push('/verify-email');
      } else {
        toast.error(`${data.error || 'Signup failed. Try again.'}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #dbeafe 100%)',
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
              <IconUserPlus size={32} />
            </ThemeIcon>
          </Center>

          <Title order={2} ta="center" mt="md">
            Create Your Account 🚀
          </Title>
          <Text c="dimmed" ta="center" mt="xs" size="sm">
            Join Salesforce Metadata Extractor and start exploring today
          </Text>

          {success ? (
            <Stack mt="xl" align="center" gap="md">
              <IconCircleCheck size={48} color="var(--mantine-color-green-6)" />
              <Text fw={600}>Account created successfully!</Text>
              <Text c="dimmed" size="sm">
                You can now log in to your dashboard.
              </Text>
              <Button component={Link} href="/login" fullWidth>
                Go to Login
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSignup}>
              <Stack mt="xl" gap="md">
                <TextInput name="name" label="Full Name" placeholder="John Doe" required />

                <TextInput
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />

                <PasswordInput name="password" label="Password" placeholder="••••••••" required />

                <PasswordInput
                  name="confirm"
                  label="Confirm Password"
                  placeholder="••••••••"
                  required
                />

                <Checkbox
                  required
                  size="xs"
                  label={
                    <Text size="xs" c="dimmed">
                      I agree to the{' '}
                      <Anchor component={Link} href="/terms" size="xs">
                        Terms of Service
                      </Anchor>{' '}
                      and{' '}
                      <Anchor component={Link} href="/privacy" size="xs">
                        Privacy Policy
                      </Anchor>
                    </Text>
                  }
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  leftSection={!loading && <IconUserPlus size={18} />}
                  size="md"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                <Divider label="Or continue with" labelPosition="center" my="sm" />

                <Button
                  fullWidth
                  variant="default"
                  c="gray"
                  leftSection={<GoogleIcon />}
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      });
                      if (error) throw error;
                    } catch (error) {
                      console.error('Google signup error:', error);
                      toast.error('Could not initiate Google Signup');
                    }
                  }}
                >
                  Sign up with Google
                </Button>
              </Stack>
            </form>
          )}

          {!success && (
            <Text ta="center" c="dimmed" size="sm" mt="xl">
              Already have an account?{' '}
              <Anchor component={Link} href="/login" fw={600}>
                Log in
              </Anchor>
            </Text>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
