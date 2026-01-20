'use client';

import { Text, Center } from '@mantine/core';
import VirtualTable from '@components/VirtualTable';

interface ApexClass {
  Name: string;
  ApiVersion?: string;
  Status?: string;
  [key: string]: unknown;
}

interface ApexClassesTableProps {
  data: ApexClass[];
}

export default function ApexClassesTable({ data }: ApexClassesTableProps) {
  if (!data || data.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No Apex Classes found.</Text>
      </Center>
    );
  }

  return (
    <VirtualTable
      data={data}
      columns={[
        { label: 'Name', key: 'Name', width: '40%' },
        { label: 'API Version', key: 'ApiVersion', width: '20%' },
        { label: 'Status', key: 'Status', width: '40%' },
      ]}
      emptyMessage="No Apex Classes found."
    />
  );
}
