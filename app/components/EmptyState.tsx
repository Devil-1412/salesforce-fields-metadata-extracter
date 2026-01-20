'use client';

import { Center, Stack, Text, Paper, ThemeIcon } from '@mantine/core';
import { IconFolderSearch } from '@tabler/icons-react';
import { type LucideIcon } from 'lucide-react';
import { type ComponentType } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon | ComponentType<{ size?: number | string; color?: string }>;
}

export default function EmptyState({
  title = 'No items found',
  description = "Try adjusting your search or filters to find what you're looking for.",
  icon: Icon,
}: EmptyStateProps) {
  return (
    <Paper
      p="xl"
      withBorder
      radius="md"
      style={{
        borderStyle: 'dashed',
        borderColor: 'var(--mantine-color-gray-4)',
      }}
    >
      <Center>
        <Stack align="center" gap="sm">
          <ThemeIcon
            size={64}
            radius="xl"
            variant="light"
            color="blue"
          >
            {Icon ? (
              <Icon size={32} />
            ) : (
              <IconFolderSearch size={32} />
            )}
          </ThemeIcon>
          <Text fw={600} size="lg" c="gray.9">
            {title}
          </Text>
          <Text size="sm" c="dimmed" ta="center" maw={400}>
            {description}
          </Text>
        </Stack>
      </Center>
    </Paper>
  );
}
