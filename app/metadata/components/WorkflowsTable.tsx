'use client';

import VirtualTable from '@components/VirtualTable';
import { Center, Text } from '@mantine/core';

interface Workflow {
  fullName: string;
  triggerType?: string;
  actions?: unknown[];
  [key: string]: unknown;
}

interface WorkflowsTableProps {
  data: Workflow[];
}

export default function WorkflowsTable({ data }: WorkflowsTableProps) {
  if (!data || data.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No Workflows found.</Text>
      </Center>
    );
  }

  return (
    <VirtualTable<Workflow>
      data={data}
      columns={[
        { header: 'Name', accessorKey: 'fullName', size: 250 },
        { header: 'Trigger Type', accessorKey: 'triggerType', size: 150 },
        {
          header: 'Actions',
          accessorKey: 'actions',
          size: 150,
          Cell: ({ row }: { row: { original: Workflow } }) =>
            `${(row.original.actions as any[])?.length || 0} Actions`,
        },
      ]}
      emptyMessage="No Workflows found."
    />
  );
}
