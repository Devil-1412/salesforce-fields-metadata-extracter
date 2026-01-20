'use client';

import {
  Paper,
  Text,
  Group,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Stack,
} from '@mantine/core';
import { IconTrash, IconBookmark } from '@tabler/icons-react';

interface SavedQuery {
  id: string;
  name: string;
  query: string;
}

interface SavedQueriesListProps {
  queries: SavedQuery[];
  onLoad: (query: SavedQuery) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function SavedQueriesList({
  queries,
  onLoad,
  onDelete,
}: SavedQueriesListProps) {
  if (queries.length === 0) return null;

  return (
    <Stack gap="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
      <Group gap="sm">
        <IconBookmark size={16} color="var(--mantine-color-indigo-5)" />
        <Text fw={600} size="sm">
          Saved Queries
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {queries.map((sq) => (
          <Paper
            key={sq.id}
            p="sm"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => onLoad(sq)}
            className="query-card"
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {sq.name}
                </Text>
                <Text size="xs" c="dimmed" ff="monospace" truncate>
                  {sq.query}
                </Text>
              </Stack>
              <Tooltip label="Delete query">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => onDelete(sq.id, e)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <style jsx global>{`
        .query-card:hover {
          border-color: var(--mantine-color-indigo-3);
          background-color: var(--mantine-color-gray-0);
        }
      `}</style>
    </Stack>
  );
}
