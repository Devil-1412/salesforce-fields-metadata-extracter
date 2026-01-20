'use client';

import { FormEvent, useState } from 'react';
import {
  Paper,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Button,
  Switch,
  Badge,
  PasswordInput,
  Checkbox,
} from '@mantine/core';
import {
  IconKey,
  IconShield,
  IconWorld,
  IconLock,
} from '@tabler/icons-react';

interface Session {
  id: string;
  device_info?: string;
  user_agent?: string;
  ip_address?: string;
  last_activity: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  profileVisible: boolean;
  dataSharing: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecurityTabProps {
  securitySettings: SecuritySettings;
  sessions: Session[];
  showPasswordChange: boolean;
  setShowPasswordChange: (show: boolean) => void;
  passwordForm: PasswordForm;
  setPasswordForm: (form: PasswordForm) => void;
  handleChangePassword: (e: FormEvent) => void;
  handleToggle2FA: (enabled: boolean) => void;
  handleUpdatePrivacy: (field: string, value: boolean) => void;
  handleRevokeAllSessions: () => void;
}

export default function SecurityTab({
  securitySettings,
  sessions,
  showPasswordChange,
  setShowPasswordChange,
  passwordForm,
  setPasswordForm,
  handleChangePassword,
  handleToggle2FA,
  handleUpdatePrivacy,
  handleRevokeAllSessions,
}: SecurityTabProps) {
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  return (
    <Stack gap="lg">
      <div>
        <Text size="xl" fw={700}>
          Security Settings
        </Text>
        <Text size="sm" c="dimmed">
          Manage your account security and privacy
        </Text>
      </div>

      {/* Password Section */}
      <Paper radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="blue" size="lg" radius="md">
            <IconKey size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>Password</Text>
            <Text size="xs" c="dimmed">
              Update your account password
            </Text>
          </Stack>
        </Group>

        {showPasswordChange ? (
          <form onSubmit={handleChangePassword}>
            <Stack gap="md">
              <PasswordInput
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                visible={showPasswordFields.current}
                onVisibilityChange={(v) =>
                  setShowPasswordFields({ ...showPasswordFields, current: v })
                }
                required
              />
              <PasswordInput
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                visible={showPasswordFields.new}
                onVisibilityChange={(v) =>
                  setShowPasswordFields({ ...showPasswordFields, new: v })
                }
                required
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                visible={showPasswordFields.confirm}
                onVisibilityChange={(v) =>
                  setShowPasswordFields({ ...showPasswordFields, confirm: v })
                }
                required
              />
              <Group gap="sm">
                <Button type="submit">Update Password</Button>
                <Button
                  variant="light"
                  color="gray"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Button onClick={() => setShowPasswordChange(true)}>
            Change Password
          </Button>
        )}
      </Paper>

      {/* Two-Factor Authentication */}
      <Paper radius="lg" p="lg" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="sm">
            <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
              <IconShield size={18} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={600}>Two-Factor Authentication</Text>
              <Text size="xs" c="dimmed">
                Add an extra layer of security
              </Text>
            </Stack>
          </Group>
          <Switch
            checked={securitySettings.twoFactorEnabled}
            onChange={(e) => handleToggle2FA(e.currentTarget.checked)}
          />
        </Group>
        <Text size="xs" c="dimmed">
          Enable 2FA to protect your account from unauthorized access
        </Text>
      </Paper>

      {/* Active Sessions */}
      <Paper radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="green" size="lg" radius="md">
            <IconWorld size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>Active Sessions</Text>
            <Text size="xs" c="dimmed">
              Manage your active login sessions
            </Text>
          </Stack>
        </Group>

        <Stack gap="sm">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <Paper key={session.id} p="sm" bg="gray.0" radius="md">
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {session.device_info || 'Unknown Device'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {session.user_agent || 'Unknown Browser'} •{' '}
                      {new Date(session.last_activity).toLocaleString()}
                    </Text>
                    {session.ip_address && (
                      <Text size="xs" c="dimmed">
                        IP: {session.ip_address}
                      </Text>
                    )}
                  </Stack>
                  <Badge variant="light" color="green">
                    Active
                  </Badge>
                </Group>
              </Paper>
            ))
          ) : (
            <Paper p="sm" bg="gray.0" radius="md">
              <Group justify="space-between">
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    Current Session
                  </Text>
                  <Text size="xs" c="dimmed">
                    Chrome on Windows • {new Date().toLocaleString()}
                  </Text>
                </Stack>
                <Badge variant="light" color="green">
                  Active
                </Badge>
              </Group>
            </Paper>
          )}
        </Stack>

        <Button
          variant="subtle"
          color="red"
          size="sm"
          mt="md"
          onClick={handleRevokeAllSessions}
        >
          Sign out from all devices
        </Button>
      </Paper>

      {/* Privacy Settings */}
      <Paper radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="purple" size="lg" radius="md">
            <IconLock size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>Privacy</Text>
            <Text size="xs" c="dimmed">
              Control your data visibility
            </Text>
          </Stack>
        </Group>

        <Stack gap="sm">
          <Paper p="sm" bg="gray.0" radius="md">
            <Checkbox
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    Profile Visibility
                  </Text>
                  <Text size="xs" c="dimmed">
                    Make your profile visible to others
                  </Text>
                </Stack>
              }
              checked={securitySettings.profileVisible}
              onChange={(e) =>
                handleUpdatePrivacy('profileVisible', e.currentTarget.checked)
              }
            />
          </Paper>
          <Paper p="sm" bg="gray.0" radius="md">
            <Checkbox
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    Data Sharing
                  </Text>
                  <Text size="xs" c="dimmed">
                    Allow analytics data collection
                  </Text>
                </Stack>
              }
              checked={securitySettings.dataSharing}
              onChange={(e) =>
                handleUpdatePrivacy('dataSharing', e.currentTarget.checked)
              }
            />
          </Paper>
        </Stack>
      </Paper>
    </Stack>
  );
}
