'use client';

import {
  Paper,
  Text,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Box,
} from '@mantine/core';
import {
  IconDownload,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';

interface ColumnFilter {
  type: string;
  value: string;
}

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
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  columnFilters: Record<string, ColumnFilter>;
  onOpenFilter: (column: string) => void;
  onRemoveFilter: (column: string) => void;
  onClearAllFilters: () => void;
  onExportCSV: () => void;
  getProcessedResults: () => QueryResults;
}

export default function ResultsTable({
  results,
  sortColumn,
  sortDirection,
  onSort,
  columnFilters,
  onOpenFilter,
  onRemoveFilter,
  onClearAllFilters,
  onExportCSV,
  getProcessedResults,
}: ResultsTableProps) {
  const processedResults = getProcessedResults();
  const columns = results.records?.[0]
    ? Object.keys(results.records[0]).filter((key) => key !== 'attributes')
    : [];

  const hasFilters = Object.keys(columnFilters).length > 0;

  return (
    <Paper radius="lg" p="lg" shadow="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="md">
          <Text size="lg" fw={700}>
            Query Results
          </Text>
          <Badge variant="light" color="indigo">
            {processedResults.totalSize} records
          </Badge>
        </Group>
        <Button
          leftSection={<IconDownload size={16} />}
          color="green"
          onClick={onExportCSV}
        >
          Export CSV
        </Button>
      </Group>

      {/* Active Filters */}
      {hasFilters && (
        <Group gap="xs" mb="md" wrap="wrap">
          <Text size="xs" fw={500} c="dimmed">
            Active Filters:
          </Text>
          {Object.entries(columnFilters).map(([column, filter]) => (
            <Badge
              key={column}
              variant="light"
              color="indigo"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  color="indigo"
                  onClick={() => onRemoveFilter(column)}
                >
                  <IconX size={12} />
                </ActionIcon>
              }
            >
              {column}: {filter.type}
              {filter.value && ` "${filter.value}"`}
            </Badge>
          ))}
          <Button
            variant="subtle"
            color="red"
            size="xs"
            onClick={onClearAllFilters}
          >
            Clear All
          </Button>
        </Group>
      )}

      <ScrollArea h={500} type="auto">
        {results.records && results.records.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead
              style={{
                position: 'sticky',
                top: 0,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                zIndex: 1,
              }}
            >
              <Table.Tr>
                {columns.map((key) => (
                  <Table.Th
                    key={key}
                    style={{ color: 'white', whiteSpace: 'nowrap' }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Box
                        onClick={() => onSort(key)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Text size="xs" fw={700} tt="uppercase">
                          {key}
                        </Text>
                        {sortColumn === key &&
                          (sortDirection === 'asc' ? (
                            <IconSortAscending size={14} />
                          ) : (
                            <IconSortDescending size={14} />
                          ))}
                      </Box>
                      <Tooltip label="Filter column">
                        <ActionIcon
                          variant="transparent"
                          size="xs"
                          color={columnFilters[key] ? 'yellow' : 'white'}
                          onClick={() => onOpenFilter(key)}
                        >
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {processedResults.records.map((record, idx) => (
                <Table.Tr key={idx}>
                  {columns.map((key) => {
                    const value = record[key];
                    let displayValue =
                      typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value ?? '');
                    return (
                      <Table.Td key={key}>
                        <Text size="sm" truncate maw={300}>
                          {displayValue}
                        </Text>
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Box ta="center" py="xl" c="dimmed">
            No records found.
          </Box>
        )}
      </ScrollArea>
    </Paper>
  );
}
