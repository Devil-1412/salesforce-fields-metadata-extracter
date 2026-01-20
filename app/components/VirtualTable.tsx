'use client';

import { Center, Paper, Table, Text } from '@mantine/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, type ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  headerRender?: () => ReactNode;
  render?: (item: T, index: number) => ReactNode;
}

interface VirtualTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  itemSize?: number;
  rowClassName?: string;
  emptyMessage?: string;
  className?: string;
}

export default function VirtualTable<T extends Record<string, unknown>>({
  columns,
  data,
  itemSize = 50,
  emptyMessage = 'No data available',
  className = '',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data ? data.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 5,
  });

  if (!data || data.length === 0) {
    return (
      <Paper
        withBorder
        radius="md"
        className={className}
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Table>
          <Table.Thead style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th
                  key={col.key}
                  style={{
                    width: col.width,
                    color: 'white',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
        </Table>
        <Center style={{ flex: 1, padding: '2.5rem' }}>
          <Text c="dimmed">{emptyMessage}</Text>
        </Center>
      </Paper>
    );
  }

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <Paper
      ref={parentRef}
      withBorder
      radius="md"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <Table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
        <Table.Thead
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Table.Tr style={{ display: 'flex', width: '100%' }}>
            {columns.map((col) => (
              <Table.Th
                key={col.key}
                style={{
                  width: col.width,
                  color: 'white',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {col.headerRender ? col.headerRender() : col.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody
          style={{
            display: 'block',
            width: '100%',
            height: `${totalSize}px`,
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const item = data[virtualRow.index];
            if (!item) return null;
            return (
              <Table.Tr
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  display: 'flex',
                  width: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  borderBottom: '1px solid var(--mantine-color-gray-2)',
                }}
              >
                {columns.map((col) => (
                  <Table.Td
                    key={col.key}
                    style={{
                      width: col.width,
                      padding: '0.75rem 1.5rem',
                      flexShrink: 0,
                      verticalAlign: 'top',
                      wordBreak: 'break-word',
                    }}
                  >
                    {col.render
                      ? col.render(item, virtualRow.index)
                      : item[col.key] !== undefined
                        ? Array.isArray(item[col.key])
                          ? (item[col.key] as unknown[]).join(', ')
                          : String(item[col.key])
                        : '—'}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'var(--mantine-color-gray-0)',
          borderTop: '1px solid var(--mantine-color-gray-2)',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--mantine-color-gray-6)',
          zIndex: 10,
        }}
      >
        Showing {data.length} items
      </div>
    </Paper>
  );
}
