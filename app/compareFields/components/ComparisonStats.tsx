'use client';

import { SimpleGrid, Paper, Text, ThemeIcon } from '@mantine/core';
import { IconFileAnalytics, IconCheck, IconX, IconPercentage } from '@tabler/icons-react';

interface ComparisonStatsProps {
  totalCount: number;
  matchingCount: number;
  differentCount: number;
  diffPercent: number;
}

export default function ComparisonStats({
  totalCount,
  matchingCount,
  differentCount,
  diffPercent,
}: ComparisonStatsProps) {
  const stats = [
    {
      label: 'Total Fields',
      value: totalCount,
      color: 'blue',
      icon: IconFileAnalytics,
    },
    {
      label: 'Matching',
      value: matchingCount,
      color: 'green',
      icon: IconCheck,
    },
    {
      label: 'Different',
      value: differentCount,
      color: 'red',
      icon: IconX,
    },
    {
      label: 'Difference %',
      value: `${diffPercent}%`,
      color: 'yellow',
      icon: IconPercentage,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} mt="md">
      {stats.map((stat) => (
        <Paper
          key={stat.label}
          p="md"
          radius="md"
          withBorder
          style={{
            borderColor: `var(--mantine-color-${stat.color}-3)`,
            backgroundColor: `var(--mantine-color-${stat.color}-0)`,
          }}
        >
          <Text size="xs" fw={500} c={`${stat.color}.7`} tt="uppercase">
            {stat.label}
          </Text>
          <Text size="xl" fw={700} c={`${stat.color}.8`}>
            {stat.value}
          </Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
