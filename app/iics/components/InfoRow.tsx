'use client';

import { Box, Text } from '@mantine/core';

export default function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={2}>
        {label}
      </Text>
      <Text size="sm" style={{ wordBreak: 'break-all' }}>
        {value ?? '—'}
      </Text>
    </Box>
  );
}
