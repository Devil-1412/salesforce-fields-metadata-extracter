'use client';

import { Paper, Text, Grid } from '@mantine/core';

interface StatsCardsProps {
  total: number;
  custom: number;
  standard: number;
}

export default function StatsCards({ total, custom, standard }: StatsCardsProps) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper radius="lg" p="md" withBorder bg="gray.0">
          <Text size="sm" c="dimmed">
            Total objects
          </Text>
          <Text size="xl" fw={600}>
            {total.toLocaleString()}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper radius="lg" p="md" withBorder bg="gray.0">
          <Text size="sm" c="dimmed">
            Custom objects
          </Text>
          <Text size="xl" fw={600}>
            {custom.toLocaleString()}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper radius="lg" p="md" withBorder bg="gray.0">
          <Text size="sm" c="dimmed">
            Standard objects
          </Text>
          <Text size="xl" fw={600}>
            {standard.toLocaleString()}
          </Text>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}
