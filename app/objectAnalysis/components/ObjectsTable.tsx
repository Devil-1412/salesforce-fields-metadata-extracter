'use client';

import VirtualTable from '@components/VirtualTable';
import { Badge, Button, Stack, Text } from '@mantine/core';

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
    <VirtualTable
      data={objects}
      columns={[
        {
          key: 'index',
          label: '#',
          width: '10%',
          render: (_: SalesforceObject, i: number) => i + 1,
        },
        {
          key: 'label',
          label: 'Label',
          width: '20%',
          render: (object: SalesforceObject) => (
            <Text
              component="button"
              onClick={() => onObjectClick(object)}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
              }}
              c="blue"
              fw={500}
              className="hover:underline"
            >
              {object.label || object.name}
            </Text>
          ),
        },
        { key: 'name', label: 'API Name', width: '20%' },
        {
          key: 'custom',
          label: 'Type',
          width: '10%',
          render: (object: SalesforceObject) => (
            <Badge size="sm" variant="light" color={object.custom ? 'blue' : 'gray'}>
              {object.custom ? 'Custom' : 'Standard'}
            </Badge>
          ),
        },
        {
          key: 'createdDate',
          label: 'Created',
          width: '15%',
          render: (object: SalesforceObject) =>
            object.createdDate ? (
              <Stack gap={0}>
                <Text size="xs" fw={500}>
                  {new Date(object.createdDate).toLocaleDateString() === '1/1/1970'
                    ? '—'
                    : new Date(object.createdDate).toLocaleDateString()}
                </Text>
                <Text size="xs" c="dimmed">
                  {object.createdByName || 'Unknown'}
                </Text>
              </Stack>
            ) : (
              <Text c="dimmed">—</Text>
            ),
        },
        {
          key: 'lastModifiedDate',
          label: 'Last Modified',
          width: '15%',
          render: (object: SalesforceObject) =>
            object.lastModifiedDate ? (
              <Stack gap={0}>
                <Text size="xs" fw={500}>
                  {new Date(object.lastModifiedDate).toLocaleDateString() === '1/1/1970'
                    ? '—'
                    : new Date(object.lastModifiedDate).toLocaleDateString()}
                </Text>
                <Text size="xs" c="dimmed">
                  {object.lastModifiedByName || 'Unknown'}
                </Text>
              </Stack>
            ) : (
              <Text c="dimmed">—</Text>
            ),
        },
        { key: 'keyPrefix', label: 'Prefix', width: '10%' },
        {
          key: 'records',
          label: 'Records',
          width: '10%',
          render: (object: SalesforceObject) => (
            <Button
              size="xs"
              variant="light"
              radius="xl"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onFetchCount(object.name);
              }}
              disabled={countLoadingFor === object.name}
              loading={countLoadingFor === object.name}
            >
              {counts[object.name] !== undefined
                ? formatLargeNumber(counts[object.name])
                : 'Get count'}
            </Button>
          ),
        },
      ]}
    />
  );
}
