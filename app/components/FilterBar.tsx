'use client';

import { Group, TextInput, Paper } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { type ReactNode } from 'react';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
}: FilterBarProps) {
  return (
    <Paper
      p="md"
      mb="md"
      withBorder
      radius="md"
      shadow="xs"
    >
      <Group justify="space-between" wrap="wrap" gap="md">
        {/* Search Input */}
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          w={{ base: '100%', md: 384 }}
          styles={{
            input: {
              backgroundColor: 'var(--mantine-color-gray-0)',
            },
          }}
        />

        {/* Additional filters */}
        <Group gap="sm" wrap="wrap">
          {children}
        </Group>
      </Group>
    </Paper>
  );
}
