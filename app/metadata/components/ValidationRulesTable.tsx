'use client';

import { Text, Center } from '@mantine/core';
import VirtualTable from '@components/VirtualTable';

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
    <VirtualTable
      data={data}
      columns={[
        { label: 'Name', key: 'fullName', width: '25%' },
        {
          label: 'Active',
          key: 'active',
          width: '10%',
          render: (item: ValidationRule) => (item.active ? '✅' : '❌'),
        },
        {
          label: 'Description',
          key: 'description',
          width: '30%',
          render: (item: ValidationRule) => item.description || '—',
        },
        {
          label: 'Error Message',
          key: 'errorMessage',
          width: '35%',
        },
      ]}
      emptyMessage="No Validation Rules found."
    />
  );
}
