'use client';

import { Text, Center } from '@mantine/core';
import VirtualTable from '@components/VirtualTable';

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
    <VirtualTable
      data={data}
      columns={[
        { label: 'Name', key: 'fullName', width: '40%' },
        { label: 'Trigger Type', key: 'triggerType', width: '30%' },
        {
          label: 'Actions',
          key: 'actions',
          width: '30%',
          render: (item: Workflow) => `${item.actions?.length || 0} Actions`,
        },
      ]}
      emptyMessage="No Workflows found."
    />
  );
}
