'use client';

import EmptyState from '@components/EmptyState';
import FilterBar from '@components/FilterBar';
import OrgHeader, { type Connection } from '@components/OrgHeader';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Co-located components
import ObjectDetailsModal from './components/ObjectDetailsModal';
import ObjectFilter from './components/ObjectFilter';
import ObjectsTable from './components/ObjectsTable';
import StatsCards from './components/StatsCards';

interface TableObject {
  name: string;
  label: string;
  custom?: boolean;
  keyPrefix?: string;
  schema?: string;
  rowCount?: number;
  comment?: string;
  createdDate?: string;
  createdByName?: string;
  lastModifiedDate?: string;
  lastModifiedByName?: string;
  [key: string]: unknown;
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All objects' },
  { key: 'custom', label: 'Custom objects' },
  { key: 'standard', label: 'Standard objects' },
];

function formatLargeNumber(value: number | string | undefined): string {
  if (typeof value !== 'number') return String(value ?? '—');
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export default function ObjectAnalysisPage() {
  const router = useRouter();

  // ── Connection state ──
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionsError, setConnectionsError] = useState('');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // ── Data state ──
  const [objects, setObjects] = useState<TableObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [counts, setCounts] = useState<Record<string, number | string>>({});
  const [countLoadingFor, setCountLoadingFor] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedObject, setSelectedObject] = useState<TableObject | null>(null);

  // ── Load connections on mount ──
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    setConnectionsError('');
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.connections)) {
        throw new Error(data.error || 'Could not fetch connections.');
      }
      setConnections(data.connections);
    } catch (error) {
      const message = (error as Error)?.message || 'Unable to load connections.';
      setConnectionsError(message);
      toast.error(message);
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // ── Select connection ──
  const selectConnection = useCallback(
    async (connectionId: string) => {
      if (!connectionId) return;
      const conn = connections.find((c) => c.id === connectionId);
      if (!conn) return;

      setSelectedConnectionId(connectionId);
      setCounts({});
      setObjects([]);
      setSelectedObject(null);

      // For Salesforce connections, initialise the session server-side
      if (conn.connection_type === 'salesforce') {
        const toastId = toast.loading(`Connecting to ${conn.display_name}...`);
        try {
          const res = await fetch(`/api/connections/${connectionId}`, { method: 'GET' });
          const data = await res.json();
          if (data.success && data.connection?.healthy) {
            toast.success(`Connected to ${conn.display_name}`, { id: toastId });
          } else {
            toast.error('Connection unhealthy — check credentials', { id: toastId });
          }
        } catch {
          toast.error('Failed to verify connection', { id: toastId });
        }
      } else {
        toast.success(`Selected ${conn.display_name}`);
      }
    },
    [connections]
  );

  // ── Load objects/tables ──
  const loadObjects = useCallback(
    async ({ showToast = false } = {}) => {
      if (!selectedConnectionId) {
        setObjects([]);
        return;
      }
      setLoading(true);
      setFetchError('');
      try {
        const res = await fetch(`/api/connections/${selectedConnectionId}/tables`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Could not load objects.');
        }
        setObjects(Array.isArray(data.tables) ? data.tables : []);
        if (showToast) toast.success('Object list refreshed');
      } catch (error) {
        const message = (error as Error)?.message || 'Unable to load objects.';
        setFetchError(message);
        setObjects([]);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [selectedConnectionId]
  );

  useEffect(() => {
    if (selectedConnectionId) loadObjects();
  }, [selectedConnectionId, loadObjects]);

  // ── Filtering ──
  const filteredObjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return objects.filter((object) => {
      const label = (object.label || '').toLowerCase();
      const name = (object.name || '').toLowerCase();
      const matchesSearch = !query || label.includes(query) || name.includes(query);
      const matchesFilter =
        filter === 'all' ? true : filter === 'custom' ? object.custom : !object.custom;
      return matchesSearch && matchesFilter;
    });
  }, [objects, search, filter]);

  const stats = useMemo(() => {
    const total = objects.length;
    const custom = objects.filter((obj) => obj.custom).length;
    const standard = total - custom;
    return { total, custom, standard };
  }, [objects]);

  // ── Fetch record count ──
  const fetchRecordCount = useCallback(
    async (objectName: string) => {
      if (!selectedConnectionId) {
        toast.error('Select a connection before fetching record counts.');
        return;
      }
      setCountLoadingFor(objectName);
      try {
        const res = await fetch(
          `/api/connections/${selectedConnectionId}/record-count?object=${encodeURIComponent(objectName)}`
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch record count.');
        }
        const value = typeof data.count === 'number' ? data.count : (data.count ?? 0);
        setCounts((prev) => ({ ...prev, [objectName]: value }));
      } catch (error) {
        const message = (error as Error)?.message || 'Unable to fetch record count.';
        toast.error(message);
        setCounts((prev) => ({ ...prev, [objectName]: 'Error' }));
      } finally {
        setCountLoadingFor('');
      }
    },
    [selectedConnectionId]
  );

  // ── Fetch object details (describe) ──
  const handleObjectClick = async (object: TableObject) => {
    if (!selectedConnectionId) return;

    const toastId = toast.loading(`Fetching details for ${object.label}...`);

    try {
      const res = await fetch(
        `/api/connections/${selectedConnectionId}/describe?object=${encodeURIComponent(object.name)}`
      );
      const data = await res.json();

      if (data.success) {
        setSelectedObject({ ...object, ...data.data });
        toast.success('Details loaded', { id: toastId });
      } else {
        throw new Error(data.error || 'Failed to fetch details');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${(err as Error).message}`, { id: toastId });
    }
  };

  // ── Handle connection reset ──
  const resetState = () => {
    setSelectedConnectionId(null);
    setObjects([]);
    setCounts({});
    setSelectedObject(null);
    setSearch('');
    setFilter('all');
  };

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }} py="md" px="sm">
      <Container size="xl">
        <Stack gap="md">
          <OrgHeader
            title="Object Analysis"
            description="Browse your sObjects or tables, understand their structure, and extract metadata for analysis."
            connections={connections}
            connectionsLoading={connectionsLoading}
            selectedConnectionId={selectedConnectionId}
            onSelectConnection={selectConnection}
          />

          {connectionsError && (
            <Alert color="red" radius="lg">
              {connectionsError}{' '}
              {!connectionsLoading && !connections.length && (
                <Anchor onClick={() => router.push('/profile')}>Add one in your profile</Anchor>
              )}
            </Alert>
          )}

          <Paper radius="xl" shadow="md" p="lg">
            <Stack gap="md">
              <StatsCards total={stats.total} custom={stats.custom} standard={stats.standard} />
              <Group>
                <Button
                  onClick={() => loadObjects({ showToast: true })}
                  disabled={!selectedConnectionId || loading}
                  loading={loading}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'indigo' }}
                  radius="lg"
                >
                  {loading ? 'Refreshing...' : 'Refresh objects'}
                </Button>
              </Group>
            </Stack>
          </Paper>

          <Paper radius="xl" shadow="md" p="lg">
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by API name or label"
            >
              <ObjectFilter filter={filter} onFilterChange={setFilter} options={FILTER_OPTIONS} />
            </FilterBar>

            {fetchError && (
              <Alert color="red" radius="lg" mt="md">
                {fetchError}
              </Alert>
            )}

            <Box mt="md" style={{ overflow: 'auto' }}>
              {loading ? (
                <Center py="xl">
                  <Loader />
                  <Text ml="sm" c="dimmed">
                    Loading objects…
                  </Text>
                </Center>
              ) : filteredObjects.length > 0 ? (
                <ObjectsTable
                  objects={filteredObjects}
                  counts={counts}
                  countLoadingFor={countLoadingFor}
                  onObjectClick={handleObjectClick}
                  onFetchCount={fetchRecordCount}
                  formatLargeNumber={formatLargeNumber}
                />
              ) : (
                <EmptyState
                  title="No objects found"
                  description="Try adjusting your search or filter."
                />
              )}
            </Box>
          </Paper>
        </Stack>
      </Container>

      {selectedObject && (
        <ObjectDetailsModal object={selectedObject} onClose={() => setSelectedObject(null)} />
      )}
    </Box>
  );
}
