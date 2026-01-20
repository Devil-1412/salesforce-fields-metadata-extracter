'use client';

import {
  Paper,
  Text,
  Group,
  SimpleGrid,
  ThemeIcon,
  Stack,
  Avatar,
  TextInput,
  Button,
  Badge,
} from '@mantine/core';
import {
  IconUser,
  IconBuilding,
  IconCircleCheck,
  IconCalendar,
  IconMail,
  IconShield,
} from '@tabler/icons-react';

interface User {
  full_name?: string;
  email?: string;
}

interface Organization {
  id?: string;
  org_name?: string;
  [key: string]: unknown;
}

interface ProfileTabProps {
  user: User;
  organizations: Organization[] | Organization | null;
  editingProfile: boolean;
  setEditingProfile: (editing: boolean) => void;
  profileForm: { full_name: string };
  setProfileForm: (form: { full_name: string }) => void;
  handleUpdateProfile: () => void;
}

export default function ProfileTab({
  user,
  organizations,
  editingProfile,
  setEditingProfile,
  profileForm,
  setProfileForm,
  handleUpdateProfile,
}: ProfileTabProps) {
  const orgCount = organizations
    ? Array.isArray(organizations)
      ? organizations.length
      : 1
    : 0;

  return (
    <Stack gap="lg">
      {/* Profile Header */}
      <Paper
        radius="lg"
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
          color: 'white',
        }}
      >
        <Group gap="lg">
          <Avatar
            size={96}
            radius="xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '4px solid rgba(255,255,255,0.3)',
            }}
          >
            <IconUser size={48} />
          </Avatar>
          <Stack gap="xs">
            <Text size="xl" fw={700}>
              {user.full_name || 'User Profile'}
            </Text>
            <Group gap="xs">
              <IconMail size={16} opacity={0.8} />
              <Text size="sm" opacity={0.9}>
                {user.email}
              </Text>
            </Group>
            <Group gap="xs">
              <IconCalendar size={16} opacity={0.8} />
              <Text size="sm" opacity={0.9}>
                Member since{' '}
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </Group>
          </Stack>
        </Group>
      </Paper>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper radius="lg" p="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Organizations
            </Text>
            <ThemeIcon variant="light" color="blue" size="lg" radius="md">
              <IconBuilding size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>
            {orgCount}
          </Text>
          <Text size="xs" c="dimmed">
            Connected orgs
          </Text>
        </Paper>

        <Paper radius="lg" p="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Status
            </Text>
            <ThemeIcon variant="light" color="green" size="lg" radius="md">
              <IconCircleCheck size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>
            Active
          </Text>
          <Text size="xs" c="dimmed">
            Account verified
          </Text>
        </Paper>

        <Paper radius="lg" p="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Last Login
            </Text>
            <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
              <IconCalendar size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>
            Today
          </Text>
          <Text size="xs" c="dimmed">
            Just now
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Profile Details */}
      <Paper radius="lg" p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={600} size="lg">
            Profile Information
          </Text>
          {!editingProfile && (
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setEditingProfile(true)}
            >
              Edit
            </Button>
          )}
        </Group>

        {editingProfile ? (
          <Stack gap="md">
            <TextInput
              label="Full Name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ full_name: e.target.value })}
              placeholder="Enter your full name"
            />
            <Group gap="sm" align="center">
              <IconMail size={18} color="gray" />
              <Text size="sm" c="dimmed">
                Email Address
              </Text>
              <Text size="sm" ml="auto">
                {user.email}
              </Text>
            </Group>
            <Group gap="sm">
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
              <Button
                variant="light"
                color="gray"
                onClick={() => {
                  setEditingProfile(false);
                  setProfileForm({ full_name: user.full_name || '' });
                }}
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md">
            <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Group gap="sm">
                <IconMail size={18} color="gray" />
                <Text size="sm" c="dimmed">
                  Email Address
                </Text>
              </Group>
              <Text size="sm">{user.email}</Text>
            </Group>
            <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Group gap="sm">
                <IconUser size={18} color="gray" />
                <Text size="sm" c="dimmed">
                  Full Name
                </Text>
              </Group>
              <Text size="sm">{user.full_name || 'Not set'}</Text>
            </Group>
            <Group justify="space-between" py="sm">
              <Group gap="sm">
                <IconShield size={18} color="gray" />
                <Text size="sm" c="dimmed">
                  Account Type
                </Text>
              </Group>
              <Badge variant="light" color="blue">
                Standard
              </Badge>
            </Group>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
