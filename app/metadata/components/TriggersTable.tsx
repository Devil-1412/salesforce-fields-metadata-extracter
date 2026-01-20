'use client';

import { Text, Center } from '@mantine/core';
import VirtualTable from '@components/VirtualTable';

interface Trigger {
  Name: string;
  Status?: string;
  UsageBeforeDelete?: boolean;
  UsageAfterInsert?: boolean;
  [key: string]: unknown;
}

interface TriggersTableProps {
  data: Trigger[];
}

export default function TriggersTable({ data }: TriggersTableProps) {
  if (!data || data.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No Triggers found.</Text>
      </Center>
    );
  }

  return (
    <VirtualTable
      data={data}
      columns={[
        { label: 'Name', key: 'Name', width: '40%' },
        { label: 'Status', key: 'Status', width: '20%' },
        {
          label: 'Usage',
          key: 'Usage',
          width: '40%',
          render: (item: Trigger) => {
            const usageParts: string[] = [];
            if (item.UsageBeforeDelete) usageParts.push('Before Delete');
            if (item.UsageAfterInsert) usageParts.push('After Insert');
            return usageParts.length > 0 ? usageParts.join(', ') : '—';
          },
        },
      ]}
      emptyMessage="No Triggers found."
    />
  );
}
