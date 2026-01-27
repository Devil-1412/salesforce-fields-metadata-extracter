'use client';
import { ActionIcon, Box, Center, Flex, Text, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsSort,
  IconDeviceFloppy,
  IconRestore,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';
import {
  MantineReactTable,
  MRT_ColumnFiltersState,
  MRT_ColumnOrderState,
  MRT_ColumnPinningState,
  MRT_ColumnSizingState,
  MRT_DensityState,
  MRT_ExpandedState,
  MRT_PaginationState,
  MRT_SortingState,
  MRT_TableOptions,
  MRT_TableState,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import 'mantine-react-table/styles.css';
import { useEffect, useState } from 'react';
import './VirtualTable.css';
type Props<TData extends Record<string, any> = Record<string, any>> = MRT_TableOptions<TData> & {
  data: TData[];
  columns: MRT_ColumnDef<TData>[];
  columnPinning?: { left?: string[]; right?: string[] }; // Support dynamic left & right pinning
  density?: MRT_DensityState;
  saveSettingsProps?: {
    enabled: boolean;
    tableId: string; //unique identifier for table
  };
  pageIndex?: number;
  pageSize?: number;
  title?: string;
  emptyMessage?: string;
};
export default function Table<TData extends Record<string, any> = Record<string, any>>({
  title,
  data,
  columns,
  density = 'md',
  pageIndex = 0,
  pageSize = 10,
  initialState,
  mantineTableHeadCellProps,
  mantineTableProps,
  mantineTableHeadRowProps,
  mantineTableBodyRowProps,
  mantineTableBodyCellProps,
  saveSettingsProps,
  mantineTopToolbarProps,
  ...tableProps
}: Props<TData>) {
  function saveSettingPropsToStorage(state: MRT_TableState<any>) {
    if (saveSettingsProps && saveSettingsProps.enabled) {
      const { tableId } = saveSettingsProps;
      const tableStateKeys: (keyof MRT_TableState<any>)[] = [
        'columnVisibility',
        'columnOrder',
        'columnPinning',
        'sorting',
        'columnFilters',
        'grouping',
        'expanded',
        'density',
        'globalFilter',
        'columnSizing',
      ];
      tableStateKeys.map((key) =>
        localStorage.setItem(`${tableId}.${key}`, JSON.stringify(state[key]))
      );
      notifications.show({
        title: 'Table Settings Saved',
        message: 'Table settings have been saved successfully.',
        color: 'green',
      });
    }
  }

  // Initialize state from localStorage (if enabled) or initialState, falling back to empty defaults
  const getInitialValue = <T,>(key: string, fallback: T): T => {
    if (saveSettingsProps?.enabled) {
      const stored = localStorage.getItem(`${saveSettingsProps.tableId}.${key}`);
      if (stored !== null && stored !== undefined) {
        try {
          // Prevent JSON.parse from throwing on empty string or undefined string
          if (stored === '' || stored === 'undefined') return fallback;
          return JSON.parse(stored) as T;
        } catch (e) {
          console.error(`Error parsing stored value for ${key}:`, e);
          // fallthrough to default
        }
      }
    }
    return (initialState as any)?.[key] ?? fallback;
  };

  const [sorting, setSorting] = useState<MRT_SortingState>(() => getInitialValue('sorting', []));
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(() =>
    getInitialValue('columnFilters', [])
  );
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(() =>
    getInitialValue('columnOrder', [])
  );
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    getInitialValue('columnVisibility', {})
  );
  const [columnPinning, setColumnPinning] = useState<MRT_ColumnPinningState>(() =>
    getInitialValue('columnPinning', {})
  );
  const [columnSizing, setColumnSizing] = useState<MRT_ColumnSizingState>(() =>
    getInitialValue('columnSizing', {})
  );
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: pageIndex,
    pageSize: pageSize,
  });
  const [expanded, setExpanded] = useState<MRT_ExpandedState>({});

  const table = useMantineReactTable({
    columns: columns,
    data: data || [],
    enableColumnPinning: true,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
      columnPinning,
      columnSizing,
      pagination,
      expanded,
    },
    onSortingChange: (sorting) => {
      setSorting(sorting);
    },
    onColumnFiltersChange: (columnFilters) => {
      setColumnFilters(columnFilters);
    },
    onColumnOrderChange: (columnOrder) => {
      setColumnOrder(columnOrder);
    },
    onColumnVisibilityChange: (columnVisibility) => {
      setColumnVisibility(columnVisibility);
    },
    onColumnPinningChange: (columnPinning) => {
      setColumnPinning(columnPinning);
    },
    onColumnSizingChange: (columnSizing) => {
      setColumnSizing(columnSizing);
    },
    onPaginationChange: (pagination) => {
      setPagination(pagination);
    },
    onExpandedChange: (expanded) => {
      setExpanded(expanded);
    },
    mantinePaperProps: {
      shadow: 'sm',
      radius: 'md',
      withBorder: true,
    },
    mantineTableHeadRowProps: {
      style: {
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--mantine-color-gray-0)',
        zIndex: 100,
      },
    },
    mantineTableHeadCellProps: {
      style: {
        fontWeight: 600,
        color: 'var(--mantine-color-text)',
        backgroundColor: 'var(--mantine-color-gray-0)',
        textTransform: 'uppercase',
        fontSize: 'var(--mantine-font-size-xs)',
        borderTop: '2px solid var(--mantine-color-gray-2)',
      },
      ...mantineTableHeadCellProps,
    },
    mantineTableContainerProps: {
      style: {
        height: '70vh',
      },
    },
    mantineTableProps: {
      striped: 'odd',
      highlightOnHover: true,
      withTableBorder: false, // Paper handles the border
      withColumnBorders: true,
      ...mantineTableProps,
    },
    mantineTopToolbarProps: {
      style: {
        padding: '0.5rem',
      },
      ...mantineTopToolbarProps,
    },
    mantineColumnActionsButtonProps: {
      style: { justifySelf: 'end', alignContent: 'end', background: 'transparent' },
    },
    enableStickyHeader: true,
    enableFullScreenToggle: true,
    enableDensityToggle: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,
    enableFacetedValues: true,
    enableRowVirtualization: true,
    enableColumnVirtualization: true,
    enablePagination: false,
    enableBottomToolbar: false,
    ...(saveSettingsProps?.enabled && {
      renderTopToolbarCustomActions: () => (
        <Flex gap="xs" align="center">
          <Tooltip label="Save Settings">
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              onClick={() => {
                const state = table.getState();
                saveSettingPropsToStorage(state);
              }}
              aria-label="Save Settings"
            >
              <IconDeviceFloppy size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset Settings">
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              onClick={() => {
                localStorage.removeItem(`${saveSettingsProps.tableId}`);
                table.reset();
              }}
              aria-label="Reset Settings"
            >
              <IconRestore size={18} />
            </ActionIcon>
          </Tooltip>
        </Flex>
      ),
    }),
    renderEmptyRowsFallback: () => (
      <Center p="xl">
        <Text c="dimmed">{tableProps.emptyMessage || 'No records to display'}</Text>
      </Center>
    ),
    icons: {
      IconSortAscending: () => <IconSortAscending size={16} stroke={1.5} color="black" />,
      IconSortDescending: () => <IconSortDescending size={16} stroke={1.5} color="black" />,
      IconArrowsSort: () => <IconArrowsSort size={16} stroke={1.5} color="black" />,
    },
    ...tableProps,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null; // or a loader
  return (
    <Box style={{ overflowX: 'auto', maxWidth: '100%' }}>
      {title && (
        <Title order={3} mb="10" mt="30">
          {title}
        </Title>
      )}
      <MantineReactTable table={table} />
    </Box>
  );
}
