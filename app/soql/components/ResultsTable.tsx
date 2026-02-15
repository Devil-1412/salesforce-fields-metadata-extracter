'use client';

import Table from '@components/VirtualTable';
import { Code, Text } from '@mantine/core';
import type { MRT_ColumnDef } from 'mantine-react-table';
import { useMemo } from 'react';

interface QueryRecord {
  attributes?: unknown;
  [key: string]: unknown;
}

interface QueryResults {
  records: QueryRecord[];
  totalSize: number;
}

interface ResultsTableProps {
  results: QueryResults;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  // Build dynamic columns from query result keys
  const columns = useMemo<MRT_ColumnDef<Record<string, unknown>>[]>(() => {
    if (!results?.records?.length) return [];
    return Object.keys(results.records[0] ?? {})
      .filter((key) => key !== 'attributes')
      .map((key) => ({
        accessorKey: key,
        header: key,
        Cell: ({ cell }: { cell: { getValue: () => unknown } }) => {
          const val = cell.getValue();
          if (val == null)
            return (
              <Text size="sm" c="dimmed" fs="italic">
                null
              </Text>
            );
          if (typeof val === 'object') return <Code>{JSON.stringify(val)}</Code>;
          return String(val);
        },
      }));
  }, [results]);

  return (
    <Table
      title={`Query Results (${results.totalSize} records)`}
      data={results.records as Record<string, unknown>[]}
      columns={columns}
      density="xs"
      pageSize={50}
      emptyMessage="No records found"
    />
  );
}
