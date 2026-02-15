import { Group, Paper, SegmentedControl, Text } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

interface FeedbackFiltersProps {
  filter: string;
  setFilter: (value: string) => void;
}

export function FeedbackFilters({ filter, setFilter }: FeedbackFiltersProps) {
  return (
    <Paper shadow="md" radius="md" p="md" mb="xl">
      <Group justify="space-between">
        <Group gap="xs">
          <IconFilter size={20} color="gray" />
          <Text fw={500} size="sm" c="dimmed">
            Filter by:
          </Text>
        </Group>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Features', value: 'feature_request' },
            { label: 'Bugs', value: 'bug' },
            { label: 'Suggestions', value: 'suggestion' },
          ]}
          radius="md"
          size="sm"
        />
      </Group>
    </Paper>
  );
}
