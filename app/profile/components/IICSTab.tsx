'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { IconCloudDataConnection, IconMapPin, IconTrash, IconUser } from '@tabler/icons-react';
import { FormEvent } from 'react';
import IICSForm, { IICSFormData } from './IICSForm';

export interface IICSConnection {
  id: string;
  username: string;
  pod_region: string;
  created_at: string;
}

interface IICSTabProps {
  connections: IICSConnection[];
  form: IICSFormData;
  setForm: (form: IICSFormData) => void;
  onAdd: (e: FormEvent) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function IICSTab({
  connections,
  form,
  setForm,
  onAdd,
  onDelete,
  loading,
}: IICSTabProps) {
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Informatica IICS Connections
          </Text>
          <Text size="sm" c="dimmed">
            Manage your Informatica Intelligent Cloud Services connections
          </Text>
        </div>
        <Button
          leftSection={<IconCloudDataConnection size={16} />}
          variant="gradient"
          gradient={{ from: 'orange', to: 'red' }}
          onClick={() => {
            const formElement = document.getElementById('iics-form');
            formElement?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Add Connection
        </Button>
      </Group>

      {/* Existing Connections */}
      {connections.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {connections.map((conn) => (
            <Paper key={conn.id} radius="lg" p="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                    <IconCloudDataConnection size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{conn.username}</Text>
                    <Text size="xs" c="dimmed">
                      {conn.pod_region}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <Badge variant="light" color="orange">
                    Active
                  </Badge>
                  <Tooltip label="Remove connection">
                    <ActionIcon variant="subtle" color="red" onClick={() => onDelete(conn.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Stack gap="xs">
                <Group gap="xs">
                  <IconUser size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    {conn.username}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    {conn.pod_region}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      ) : (
        <Paper radius="lg" p="xl" ta="center" withBorder style={{ borderStyle: 'dashed' }}>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                <IconCloudDataConnection size={32} />
              </ThemeIcon>
              <Text fw={600} size="lg">
                No IICS Connections
              </Text>
              <Text size="sm" c="dimmed">
                Connect your Informatica IICS account to analyze metadata
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Add Connection Form */}
      <Paper id="iics-form" radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="orange" size="lg" radius="md">
            <IconCloudDataConnection size={18} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            New IICS Connection
          </Text>
        </Group>
        <IICSForm form={form} setForm={setForm} onSubmit={onAdd} loading={loading} />
      </Paper>
    </Stack>
  );
}
