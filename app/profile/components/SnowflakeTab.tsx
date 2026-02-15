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
import { IconComponents, IconDatabase, IconSnowflake, IconTrash } from '@tabler/icons-react';
import { FormEvent } from 'react';
import toast from 'react-hot-toast';
import SnowflakeForm, { SnowflakeFormData } from './SnowflakeForm';

export interface SnowflakeConnection {
  id: string;
  account_identifier: string;
  username: string;
  warehouse?: string;
  database?: string;
  created_at: string;
}

interface SnowflakeTabProps {
  connections: SnowflakeConnection[];
  form: SnowflakeFormData;
  setForm: (form: SnowflakeFormData) => void;
  onAdd: (e: FormEvent) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function SnowflakeTab({
  connections,
  form,
  setForm,
  onAdd,
  onDelete,
  loading,
}: SnowflakeTabProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Snowflake Connections
          </Text>
          <Text size="sm" c="dimmed">
            Manage your Snowflake database connections
          </Text>
        </div>
        <Button
          leftSection={<IconSnowflake size={16} />}
          variant="gradient"
          gradient={{ from: 'cyan', to: 'blue' }}
          onClick={() => {
            const formElement = document.getElementById('snowflake-form');
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
                  <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
                    <IconSnowflake size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{conn.account_identifier}</Text>
                    <Text size="xs" c="dimmed">
                      {conn.username}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <Badge variant="light" color="cyan">
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
                {conn.warehouse && (
                  <Group gap="xs">
                    <IconComponents size={16} color="gray" />
                    <Text size="sm" c="dimmed">
                      {conn.warehouse}
                    </Text>
                  </Group>
                )}
                {conn.database && (
                  <Group gap="xs">
                    <IconDatabase size={16} color="gray" />
                    <Text size="sm" c="dimmed">
                      {conn.database}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      ) : (
        <Paper radius="lg" p="xl" ta="center" withBorder style={{ borderStyle: 'dashed' }}>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                <IconSnowflake size={32} />
              </ThemeIcon>
              <Text fw={600} size="lg">
                No Snowflake Connections
              </Text>
              <Text size="sm" c="dimmed">
                Connect your Snowflake account to analyze metadata
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Add Connection Form */}
      <Paper id="snowflake-form" radius="lg" p="lg" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="cyan" size="lg" radius="md">
            <IconSnowflake size={18} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            New Snowflake Connection
          </Text>
        </Group>
        <SnowflakeForm form={form} setForm={setForm} onSubmit={onAdd} loading={loading} />
      </Paper>
    </Stack>
  );
}
