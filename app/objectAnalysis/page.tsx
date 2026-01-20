'use client';

import EmptyState from '@components/EmptyState';
import FilterBar from '@components/FilterBar';
import OrgHeader from '@components/OrgHeader';
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

interface Org {
  instance_url?: string;
  instanceUrl?: string;
  org_name?: string;
  orgName?: string;
}

interface OrgMeta {
  accessToken: string;
  instanceUrl: string;
  [key: string]: unknown;
}

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
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedOrgMeta, setSelectedOrgMeta] = useState<OrgMeta | null>(null);
  const [instanceUrl, setInstanceUrl] = useState('');
  const [token, setToken] = useState('');
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [counts, setCounts] = useState<Record<string, number | string>>({});
  const [countLoadingFor, setCountLoadingFor] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedObject, setSelectedObject] = useState<SalesforceObject | null>(null);

  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    setOrgError('');
    try {
      const res = await fetch('/api/listAllOrgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.organizations)) {
        throw new Error(data.error || 'Could not fetch organizations.');
      }
      setOrgs(data.organizations);
    } catch (error) {
      const message = (error as Error)?.message || 'Unable to load organizations.';
      setOrgError(message);
      toast.error(message);
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const selectOrg = useCallback(
    async (instanceValue: string, { silent = false } = {}) => {
      if (!instanceValue) return;
      const org = orgs.find(
        (item) => item.instance_url === instanceValue || item.instanceUrl === instanceValue
      );
      if (!org) return;

      const targetInstanceUrl = org.instance_url || org.instanceUrl || '';
      const toastId = !silent
        ? toast.loading(`Logging in to ${org.org_name || 'Salesforce'}...`)
        : null;

      try {
        const res = await fetch('/api/salesforceLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceUrl: targetInstanceUrl }),
        });
        const data = await res.json();

        if (data.success) {
          setSelectedOrgId(targetInstanceUrl);
          setSelectedOrgMeta({
            ...org,
            accessToken: data.accessToken,
            instanceUrl: targetInstanceUrl,
          } as OrgMeta);
          setToken(data.accessToken);
          setInstanceUrl(targetInstanceUrl);
          setCounts({});
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('instanceUrl', targetInstanceUrl);

          if (!silent && toastId) {
            toast.success(
              `Loaded ${data.orgName && data.orgName !== 'None' ? data.orgName : 'Salesforce organization'}`,
              { id: toastId }
            );
          }
        } else {
          if (toastId) toast.error(data.error || 'Login failed', { id: toastId });
        }
      } catch (err) {
        console.error('Login failed', err);
        if (toastId) toast.error('Login failed', { id: toastId });
      }
    },
    [orgs]
  );

  const loadObjects = useCallback(
    async ({ showToast = false } = {}) => {
      if (!instanceUrl || !token) {
        setObjects([]);
        return;
      }
      setLoading(true);
      setFetchError('');
      try {
        const res = await fetch('/api/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token, instanceUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Could not load objects.');
        }
        setObjects(Array.isArray(data.object) ? data.object : []);
        if (showToast) {
          toast.success('Object list refreshed');
        }
      } catch (error) {
        const message = (error as Error)?.message || 'Unable to load objects.';
        setFetchError(message);
        setObjects([]);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [instanceUrl, token]
  );

  useEffect(() => {
    if (instanceUrl && token) {
      loadObjects();
    }
  }, [instanceUrl, token, loadObjects]);

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

  const fetchRecordCount = useCallback(
    async (objectName: string) => {
      if (!instanceUrl || !token) {
        toast.error('Select an organization before fetching record counts.');
        return;
      }
      setCountLoadingFor(objectName);
      try {
        const res = await fetch('/api/getRecordCount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceUrl, accessToken: token, objectName }),
        });
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
    [instanceUrl, token]
  );

  const handleObjectClick = async (object: SalesforceObject) => {
    if (!instanceUrl || !token) return;

    const toastId = toast.loading(`Fetching details for ${object.label}...`);

    try {
      const res = await fetch('/api/getObjectDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          instanceUrl,
          objectName: object.name,
        }),
      });
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

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }} py="md" px="sm">
      <Container size="xl">
        <Stack gap="md">
          <OrgHeader
            title="Salesforce Object Analysis"
            description="Browse your Salesforce sObjects, understand their origin, and quickly extract metadata for analysis."
            orgs={orgs}
            selectedOrgId={selectedOrgId}
            onSelectOrg={selectOrg}
            orgLoading={orgLoading}
            selectedOrgMeta={selectedOrgMeta}
          />

          {orgError && (
            <Alert color="red" radius="lg">
              {orgError}{' '}
              {!orgLoading && !orgs.length && (
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
                  disabled={!selectedOrgId || loading}
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

            <Box mt="md" h={'80vh'} style={{ overflow: 'auto' }}>
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
