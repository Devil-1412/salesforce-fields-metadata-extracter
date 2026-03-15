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
import { IconDatabase, IconServerCog, IconTrash } from '@tabler/icons-react';
import { FormEvent } from 'react';
import toast from 'react-hot-toast';
import OracleForm, { OracleFormData } from './OracleForm';
import OracleAgentSetup from './OracleAgentSetup';

export interface OracleConnection {
  id: string;
  display_name: string;
  agent_id: string | null;
  created_at: string;
}

interface OracleTabProps {
  connections: OracleConnection[];
  form: OracleFormData;
  setForm: (form: OracleFormData) => void;
  onAdd: (e: FormEvent) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function OracleTab({
  connections,
  form,
  setForm,
  onAdd,
  onDelete,
  loading,
}: OracleTabProps) {
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Oracle Local Agent Connections
          </Text>
          <Text size="sm" c="dimmed">
            Manage your on-premise Oracle database connections
          </Text>
        </div>
        <Button
          leftSection={<IconDatabase size={16} />}
          variant="gradient"
          gradient={{ from: 'orange', to: 'red' }}
          onClick={() => {
            const formElement = document.getElementById('oracle-form');
            formElement?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Add Connection
        </Button>
      </Group>

      <OracleAgentSetup />

      {/* Existing Connections */}
      {connections.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {connections.map((conn) => (
            <Paper key={conn.id} radius="lg" p="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                    <IconDatabase size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{conn.display_name}</Text>
                    <Text size="xs" c="dimmed">
                      Agent ID: ...{conn.agent_id?.slice(-8) || 'unlinked'}
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
                  <IconServerCog size={16} color="gray" />
                  <Text size="sm" c="dimmed" truncate style={{ flex: 1 }}>
                    {conn.agent_id || 'No linked agent'}
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
                <IconDatabase size={32} />
              </ThemeIcon>
              <Text fw={600} size="lg">
                No Oracle Connections
              </Text>
              <Text size="sm" c="dimmed">
                Pair a local agent and add a connection to analyze metadata
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Add Connection Form */}
      <Paper id="oracle-form" radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="orange" size="lg" radius="md">
            <IconDatabase size={18} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            New Oracle Connection
          </Text>
        </Group>
        <OracleForm form={form} setForm={setForm} onSubmit={onAdd} loading={loading} />
      </Paper>
    </Stack>
  );
}
