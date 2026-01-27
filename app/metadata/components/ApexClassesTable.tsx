'use client';

import VirtualTable from '@components/VirtualTable';
import { Center, Text } from '@mantine/core';

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
    <VirtualTable<ApexClass>
      data={data}
      columns={[
        { header: 'Name', accessorKey: 'Name', size: 250 },
        { header: 'API Version', accessorKey: 'ApiVersion', size: 120 },
        { header: 'Status', accessorKey: 'Status', size: 200 },
      ]}
      emptyMessage="No Apex Classes found."
    />
  );
}
