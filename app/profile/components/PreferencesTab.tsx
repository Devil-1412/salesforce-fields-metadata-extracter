'use client';

import {
  Paper,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Button,
  Checkbox,
  Select,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconBell,
  IconWorld,
} from '@tabler/icons-react';

interface Preferences {
  theme: string;
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
}

interface PreferencesTabProps {
  preferences: Preferences;
  handleUpdatePreferences: (prefs: Preferences) => void;
}

export default function PreferencesTab({
  preferences,
  handleUpdatePreferences,
}: PreferencesTabProps) {
  return (
    <Stack gap="lg">
      <div>
        <Text size="xl" fw={700}>
          Preferences
        </Text>
        <Text size="sm" c="dimmed">
          Customize your experience
        </Text>
      </div>

      {/* Theme Settings */}
      <Paper radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
            <IconSun size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>Theme</Text>
            <Text size="xs" c="dimmed">
              Choose your preferred theme
            </Text>
          </Stack>
        </Group>

        <Group gap="md">
          <Button
            variant={preferences.theme === 'light' ? 'filled' : 'light'}
            color={preferences.theme === 'light' ? 'blue' : 'gray'}
            leftSection={<IconSun size={18} />}
            onClick={() =>
              handleUpdatePreferences({ ...preferences, theme: 'light' })
            }
            flex={1}
          >
            Light
          </Button>
          <Button
            variant={preferences.theme === 'dark' ? 'filled' : 'light'}
            color={preferences.theme === 'dark' ? 'blue' : 'gray'}
            leftSection={<IconMoon size={18} />}
            onClick={() =>
              handleUpdatePreferences({ ...preferences, theme: 'dark' })
            }
            flex={1}
          >
            Dark
          </Button>
        </Group>
      </Paper>

      {/* Notifications */}
      <Paper radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="blue" size="lg" radius="md">
            <IconBell size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>Notifications</Text>
            <Text size="xs" c="dimmed">
              Manage your notification preferences
            </Text>
          </Stack>
        </Group>

        <Stack gap="sm">
          <Paper p="sm" bg="gray.0" radius="md">
            <Checkbox
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    Email Notifications
                  </Text>
                  <Text size="xs" c="dimmed">
                    Receive updates via email
                  </Text>
                </Stack>
              }
              checked={preferences.emailUpdates}
              onChange={(e) =>
                handleUpdatePreferences({
                  ...preferences,
                  emailUpdates: e.currentTarget.checked,
                })
              }
            />
          </Paper>
          <Paper p="sm" bg="gray.0" radius="md">
            <Checkbox
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    Push Notifications
                  </Text>
                  <Text size="xs" c="dimmed">
                    Receive browser notifications
                  </Text>
                </Stack>
              }
              checked={preferences.notifications}
              onChange={(e) =>
                handleUpdatePreferences({
                  ...preferences,
                  notifications: e.currentTarget.checked,
                })
              }
            />
          </Paper>
        </Stack>
      </Paper>

      {/* Language */}
      <Paper radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="green" size="lg" radius="md">
            <IconWorld size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>Language</Text>
            <Text size="xs" c="dimmed">
              Select your preferred language
            </Text>
          </Stack>
        </Group>

        <Select
          value={preferences.language}
          onChange={(val) =>
            handleUpdatePreferences({
              ...preferences,
              language: val || 'en',
            })
          }
          data={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
          ]}
        />
      </Paper>
    </Stack>
  );
}
