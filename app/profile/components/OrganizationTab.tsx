'use client';

import { FormEvent } from 'react';
import {
  Paper,
  Text,
  Group,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Button,
  Badge,
  Progress,
  ActionIcon,
  Tooltip,
  Center,
} from '@mantine/core';
import {
  IconBuilding,
  IconMail,
  IconWorld,
  IconCopy,
  IconTrash,
  IconCircleCheck,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import OrganizationForm from './OrganizationForm';

interface ApiUsage {
  used?: number;
  limit?: number;
}

interface Organization {
  id?: string;
  org_name?: string;
  org_email?: string;
  instance_url?: string;
  is_sandbox?: boolean;
  apiUsage?: ApiUsage;
}

interface OrgFormData {
  orgEmail: string;
  orgPassword: string;
  securityToken: string;
  isSandbox: boolean;
}

interface OrganizationTabProps {
  organizations: Organization[] | Organization | null;
  orgForm: OrgFormData;
  setOrgForm: (form: OrgFormData) => void;
  handleAddOrg: (e: FormEvent) => void;
  handleDeleteOrg: (orgId: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export default function OrganizationTab({
  organizations,
  orgForm,
  setOrgForm,
  handleAddOrg,
  handleDeleteOrg,
  showPassword,
  setShowPassword,
}: OrganizationTabProps) {
  const orgList = organizations
    ? Array.isArray(organizations)
      ? organizations
      : [organizations]
    : [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Connected Organizations
          </Text>
          <Text size="sm" c="dimmed">
            Manage your Salesforce organization connections
          </Text>
        </div>
        <Button
          leftSection={<IconBuilding size={16} />}
          variant="gradient"
          gradient={{ from: 'blue', to: 'indigo' }}
          onClick={() => {
            const form = document.getElementById('org-form');
            form?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Add Organization
        </Button>
      </Group>

      {/* Existing Organizations */}
      {orgList.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {orgList.map((org, idx) => (
            <Paper key={org.id || idx} radius="lg" p="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ThemeIcon
                    size="lg"
                    radius="md"
                    variant="light"
                    color={org.is_sandbox ? 'yellow' : 'green'}
                  >
                    <IconBuilding size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{org.org_name}</Text>
                    <Text size="xs" c="dimmed">
                      Connected
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <Badge
                    variant="light"
                    color={org.is_sandbox ? 'yellow' : 'green'}
                  >
                    {org.is_sandbox ? 'Sandbox' : 'Production'}
                  </Badge>
                  {org.id && (
                    <Tooltip label="Delete organization">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteOrg(org.id!)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>

              <Stack gap="xs">
                <Group gap="xs">
                  <IconMail size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    {org.org_email}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconWorld size={16} color="gray" />
                  <Text size="sm" c="dimmed" truncate style={{ flex: 1 }}>
                    {org.instance_url || '—'}
                  </Text>
                  {org.instance_url && (
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => copyToClipboard(org.instance_url!)}
                    >
                      <IconCopy size={14} />
                    </ActionIcon>
                  )}
                </Group>

                {org.apiUsage && (
                  <Stack gap="xs" mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        API Usage
                      </Text>
                      <Text size="xs" fw={500}>
                        {org.apiUsage.used?.toLocaleString()} /{' '}
                        {org.apiUsage.limit?.toLocaleString()}
                      </Text>
                    </Group>
                    <Progress
                      value={
                        ((org.apiUsage.used || 0) / (org.apiUsage.limit || 1)) *
                        100
                      }
                      color={
                        (org.apiUsage.used || 0) / (org.apiUsage.limit || 1) >
                        0.9
                          ? 'red'
                          : (org.apiUsage.used || 0) /
                              (org.apiUsage.limit || 1) >
                            0.7
                          ? 'yellow'
                          : 'blue'
                      }
                      size="sm"
                      radius="xl"
                    />
                  </Stack>
                )}
              </Stack>

              <Group gap="xs" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <IconCircleCheck size={16} color="green" />
                <Text size="sm" c="green" fw={500}>
                  Connected Successfully
                </Text>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      ) : (
        <Paper
          radius="lg"
          p="xl"
          ta="center"
          withBorder
          style={{ borderStyle: 'dashed' }}
        >
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                <IconBuilding size={32} />
              </ThemeIcon>
              <Text fw={600} size="lg">
                No Organizations Connected
              </Text>
              <Text size="sm" c="dimmed">
                Connect your first Salesforce organization to get started
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Add Organization Form */}
      <Paper id="org-form" radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="blue" size="lg" radius="md">
            <IconBuilding size={18} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            Connect New Organization
          </Text>
        </Group>
        <OrganizationForm
          orgForm={orgForm}
          setOrgForm={setOrgForm}
          handleAddOrg={handleAddOrg}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      </Paper>
    </Stack>
  );
}
