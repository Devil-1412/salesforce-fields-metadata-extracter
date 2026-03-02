'use client';

import { Paper, Text, ThemeIcon } from '@mantine/core';

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Paper p="md" radius="md" withBorder style={{ flex: '1 1 140px', minWidth: 140 }}>
      <ThemeIcon size={36} radius="md" color={color} variant="light" mb="xs">
        <Icon size={20} />
      </ThemeIcon>
      <Text size="xl" fw={400}>
        {value}
      </Text>
      <Text size="xs" c="dimmed" fw={400}>
        {label}
      </Text>
    </Paper>
  );
}
