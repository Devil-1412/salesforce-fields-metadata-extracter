'use client';

import Link from 'next/link';
import { IconMail, IconArrowRight } from '@tabler/icons-react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  ThemeIcon,
  Box,
} from '@mantine/core';

export default function VerifyEmailPage() {
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
              <IconMail size={32} />
            </ThemeIcon>
          </Center>

          <Stack align="center" gap="md" mt="md">
            <Title order={2} ta="center">
              Check Your Email 📧
            </Title>
            <Text c="dimmed" ta="center" size="sm">
              We&apos;ve sent a verification link to your email address. Please click
              the link to verify your account.
            </Text>

            <Text c="dimmed" size="sm" mt="md">
              Once verified, you can log in to your account.
            </Text>

            <Button
              component={Link}
              href="/login"
              fullWidth
              rightSection={<IconArrowRight size={16} />}
              size="md"
            >
              Go to Login
            </Button>

            <Text c="dimmed" size="xs" mt="md">
              Didn&apos;t receive the email? Check your spam folder.
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
