'use client';

import VirtualTable from '@components/VirtualTable';
import { Center, Text } from '@mantine/core';

interface ValidationRule {
  fullName: string;
  active?: boolean;
  description?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

interface ValidationRulesTableProps {
  data: ValidationRule[];
}

export default function ValidationRulesTable({ data }: ValidationRulesTableProps) {
  if (!data || data.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No Validation Rules found.</Text>
      </Center>
    );
  }

  return (
    <VirtualTable<ValidationRule>
      data={data}
      columns={[
        { header: 'Name', accessorKey: 'fullName', size: 200 },
        {
          header: 'Active',
          accessorKey: 'active',
          size: 80,
          Cell: ({ row }: { row: { original: ValidationRule } }) =>
            row.original.active ? '✅' : '❌',
        },
        {
          header: 'Description',
          accessorKey: 'description',
          size: 250,
          Cell: ({ row }: { row: { original: ValidationRule } }) => row.original.description || '—',
        },
        {
          header: 'Error Message',
          accessorKey: 'errorMessage',
          size: 300,
        },
      ]}
      emptyMessage="No Validation Rules found."
    />
  );
}
