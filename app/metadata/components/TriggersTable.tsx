'use client';

import VirtualTable from '@components/VirtualTable';
import { Center, Text } from '@mantine/core';

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
    <VirtualTable<Trigger>
      data={data}
      columns={[
        { header: 'Name', accessorKey: 'Name', size: 250 },
        { header: 'Status', accessorKey: 'Status', size: 120 },
        {
          header: 'Usage',
          accessorKey: 'Usage',
          size: 250,
          Cell: ({ row }: { row: { original: Trigger } }) => {
            const item = row.original;
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
