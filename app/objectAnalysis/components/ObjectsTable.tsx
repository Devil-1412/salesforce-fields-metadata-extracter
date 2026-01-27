'use client';

import VirtualTable from '@components/VirtualTable';
import { Button, Stack, Text } from '@mantine/core';

interface SalesforceObject {
  name: string;
  label: string;
  custom?: boolean;
  keyPrefix?: string;
  createdDate?: string;
  createdByName?: string;
  lastModifiedDate?: string;
  lastModifiedByName?: string;
  [key: string]: unknown;
}

interface ObjectsTableProps {
  objects: SalesforceObject[];
  counts: Record<string, number | string>;
  countLoadingFor: string;
  onObjectClick: (object: SalesforceObject) => void;
  onFetchCount: (objectName: string) => void;
  formatLargeNumber: (value: number | string | undefined) => string;
}

export default function ObjectsTable({
  objects,
  counts,
  countLoadingFor,
  onObjectClick,
  onFetchCount,
  formatLargeNumber,
}: ObjectsTableProps) {
  return (
    <VirtualTable<SalesforceObject>
      data={objects}
      columns={[
        {
          accessorKey: 'index',
          header: '#',
          enableColumnFilter: false,
          Cell: ({ row }: { row: { index: number } }) => row.index + 1,
        },
        {
          accessorKey: 'label',
          header: 'Label',
          enableColumnFilter: false,
          Cell: ({ row }: { row: { original: SalesforceObject } }) => (
            <Text
              component="button"
              onClick={() => onObjectClick(row.original)}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
              }}
              c="blue"
              fw={500}
              className="hover:underline"
            >
              {row.original.label || row.original.name}
            </Text>
          ),
        },
        {
          id: 'custom',
          accessorFn: (row) => (row.custom ? 'Custom' : 'Standard'),
          header: 'Type',
          filterVariant: 'multi-select',
          Cell: ({ row }: { row: { original: SalesforceObject } }) => (
            <Text size="xs">{row.original.custom ? 'Custom' : 'Standard'}</Text>
          ),
        },
        {
          accessorKey: 'createdDate',
          header: 'Created',
          enableColumnFilter: false,
          Cell: ({ row }: { row: { original: SalesforceObject } }) =>
            row.original.createdDate ? (
              new Date(row.original.createdDate).toLocaleDateString() === '1/1/1970' ? (
                <Text size="xs" fw={500}>
                  —
                </Text>
              ) : (
                <Stack gap={0}>
                  <Text size="xs" fw={500}>
                    {new Date(row.original.createdDate).toLocaleDateString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {row.original.createdByName || 'Unknown'}
                  </Text>
                </Stack>
              )
            ) : (
              <Text c="dimmed">—</Text>
            ),
        },
        {
          accessorKey: 'lastModifiedDate',
          header: 'Last Modified',
          enableColumnFilter: false,
          Cell: ({ row }: { row: { original: SalesforceObject } }) =>
            row.original.lastModifiedDate ? (
              new Date(row.original.lastModifiedDate).toLocaleDateString() === '1/1/1970' ? (
                <Text size="xs" fw={500}>
                  —
                </Text>
              ) : (
                <Stack gap={0}>
                  <Text size="xs" fw={500}>
                    {new Date(row.original.lastModifiedDate).toLocaleDateString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {row.original.lastModifiedByName || 'Unknown'}
                  </Text>
                </Stack>
              )
            ) : (
              <Text c="dimmed">—</Text>
            ),
        },
        {
          accessorKey: 'keyPrefix',
          header: 'Prefix',
          filterVariant: 'multi-select',
        },
        {
          accessorKey: 'records',
          header: 'Records',
          enableColumnFilter: false,
          Cell: ({ row }: { row: { original: SalesforceObject } }) => (
            <Button
              size="xs"
              variant="light"
              radius="xl"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onFetchCount(row.original.name);
              }}
              disabled={countLoadingFor === row.original.name}
              loading={countLoadingFor === row.original.name}
            >
              {counts[row.original.name] !== undefined
                ? formatLargeNumber(counts[row.original.name])
                : 'Get count'}
            </Button>
          ),
        },
      ]}
      saveSettingsProps={{
        enabled: true,
        tableId: 'objects-table',
      }}
      enablePagination={false}
      enableBottomToolbar={false}
      enableStickyHeader={true}
    />
  );
}
