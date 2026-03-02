'use client';

import { Avatar, Divider, Group, NavLink, Paper, Stack, Text } from '@mantine/core';
import {
  IconBuilding,
  IconCloudDataConnection,
  IconLifebuoy,
  IconLogout,
  IconSettings,
  IconShield,
  IconSnowflake,
  IconUser,
} from '@tabler/icons-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface User {
  full_name?: string;
  email?: string;
}

interface ProfileSidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: <IconUser size={18} /> },
  { id: 'organization', label: 'Organization', icon: <IconBuilding size={18} /> },
  { id: 'snowflake', label: 'Snowflake', icon: <IconSnowflake size={18} /> },
  { id: 'iics', label: 'Informatica IICS', icon: <IconCloudDataConnection size={18} /> },
  { id: 'security', label: 'Security', icon: <IconShield size={18} /> },
  { id: 'preferences', label: 'Preferences', icon: <IconSettings size={18} /> },
  { id: 'support', label: 'Support', icon: <IconLifebuoy size={18} /> },
];

export default function ProfileSidebar({
  user,
  activeTab,
  setActiveTab,
  onLogout,
}: ProfileSidebarProps) {
  return (
    <Paper radius="lg" shadow="md" withBorder style={{ overflow: 'hidden' }}>
      {/* Profile Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
          padding: '1.5rem',
          color: 'white',
        }}
      >
        <Group gap="sm">
          <Avatar
            size="lg"
            radius="xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <IconUser size={24} />
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} truncate>
              {user.full_name || 'User'}
            </Text>
            <Text size="xs" opacity={0.8} truncate>
              {user.email}
            </Text>
          </div>
        </Group>
      </div>

      {/* Navigation */}
      <Stack gap={4} p="md">
        {TABS.map((tab) => (
          <NavLink
            key={tab.id}
            label={tab.label}
            leftSection={tab.icon}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant="light"
            style={{
              borderRadius: 'var(--mantine-radius-md)',
            }}
          />
        ))}
      </Stack>

      <Divider />

      {/* Logout */}
      <Stack p="md">
        <NavLink
          label="Logout"
          leftSection={<IconLogout size={18} />}
          onClick={onLogout}
          color="red"
          variant="subtle"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
          }}
        />
      </Stack>
    </Paper>
  );
}
