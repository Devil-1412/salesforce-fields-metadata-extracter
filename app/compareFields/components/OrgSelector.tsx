'use client';

import { type Connection } from '@components/OrgHeader';
import { Badge, Button, Group, Paper, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMemo } from 'react';

interface ConnectionSelectorProps {
  connections: Connection[];
  connectionsLoading: boolean;
  /** One connection ID per comparison slot (min 2) */
  selectedSlots: (string | null)[];
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onSelectSlot: (index: number, connectionId: string) => void;
}

/** Build grouped options for the connection selector */
function buildGroupedOptions(connections: Connection[]) {
  const groups: Record<string, { value: string; label: string }[]> = {};
  (connections || []).forEach((c) => {
    if (!c) return;
    const type = c.connection_type.charAt(0).toUpperCase() + c.connection_type.slice(1);
    if (!groups[type]) groups[type] = [];
    groups[type].push({ value: c.id, label: c.display_name || 'Untitled' });
  });
  return Object.entries(groups).map(([group, items]) => ({ group, items }));
}

export default function ConnectionSelector({
  connections,
  connectionsLoading,
  selectedSlots,
  onAddSlot,
  onRemoveSlot,
  onSelectSlot,
}: ConnectionSelectorProps) {
  const groupedOptions = useMemo(() => buildGroupedOptions(connections), [connections]);

  return (
    <Paper radius="lg" p="lg" shadow="md" withBorder mb="lg">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="lg">
          Connections
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={onAddSlot} size="sm">
          Add Connection
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
        {selectedSlots.map((slotId, index) => {
          const conn = slotId ? (connections.find((c) => c.id === slotId) ?? null) : null;
          return (
            <Paper key={index} p="sm" withBorder radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Connection {index + 1}
                  </Text>
                  {selectedSlots.length > 2 && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => onRemoveSlot(index)}
                    >
                      Remove
                    </Button>
                  )}
                </Group>
                <Select
                  value={slotId}
                  onChange={(val) => val && onSelectSlot(index, val)}
                  data={groupedOptions}
                  placeholder={connectionsLoading ? 'Loading…' : 'Select a connection'}
                  searchable
                  disabled={connectionsLoading}
                />
                {conn && (
                  <Group gap="xs">
                    <Badge size="xs" variant="light">
                      {conn.connection_type.toUpperCase()}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {conn.display_name}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
}
