'use client';

import EmptyState from '@components/EmptyState';
import OrgHeader, { type Connection } from '@components/OrgHeader';
import VirtualTable from '@components/VirtualTable';
import {
  Badge,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconClipboardList,
  IconCloud,
  IconDatabase,
  IconMap,
  IconServer,
  IconTransform,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import MappingDetailModal from './components/MappingDetailModal';
import ObjectDetailModal from './components/ObjectDetailModal';
import RuntimeDetailModal from './components/RuntimeDetailModal';
import StatCard from './components/StatCard';
import TaskflowDetailModal from './components/TaskflowDetailModal';

// ── Tab configuration ──
const TABS = [
  { value: 'objects', label: 'Objects', icon: IconDatabase },
  { value: 'mappings', label: 'Taskflows', icon: IconMap },
  { value: 'tasks', label: 'Tasks', icon: IconTransform },
  { value: 'schedules', label: 'Schedules', icon: IconCalendarEvent },
  { value: 'runtimeEnvironments', label: 'Runtime Environments', icon: IconServer },
  { value: 'auditLogs', label: 'Audit Logs', icon: IconClipboardList },
] as const;

type TabValue = (typeof TABS)[number]['value'];
type TabValueOrNull = TabValue | null;

// ── Main page ──

export default function IICSPage() {
  // Connection state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Tab state — null by default, user must select
  const [activeTab, setActiveTab] = useState<TabValueOrNull>(null);

  // Data state
  const [objects, setObjects] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [runtimeEnvs, setRuntimeEnvs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Loading state per tab
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});

  // ── Detail Modal state (Objects) ──
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);

  // ── Mapping Detail Modal state ──
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<any>(null);
  const [mappingDetail, setMappingDetail] = useState<any>(null);
  const [objectDetail, setObjectDetail] = useState<any>(null);

  // ── Taskflow Detail Modal state ──
  const [taskflowModalOpen, setTaskflowModalOpen] = useState(false);
  const [taskflowLoading, setTaskflowLoading] = useState(false);
  const [selectedTaskflow, setSelectedTaskflow] = useState<any>(null);
  const [taskflowDetail, setTaskflowDetail] = useState<any>(null);

  // ── Runtime Detail Modal state ──
  const [runtimeModalOpen, setRuntimeModalOpen] = useState(false);
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const [selectedRuntime, setSelectedRuntime] = useState<any>(null);
  const [runtimeDetail, setRuntimeDetail] = useState<any>(null);

  // ── Load connections (IICS only) ──

  useEffect(() => {
    async function load() {
      setConnectionsLoading(true);
      try {
        const res = await fetch('/api/connections');
        const data = await res.json();
        const all: Connection[] = data.connections || [];
        const iicsOnly = all.filter((c) => c.connection_type === 'iics');
        setConnections(iicsOnly);
      } catch {
        toast.error('Failed to load connections');
      } finally {
        setConnectionsLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset data and tab when connection changes ──

  useEffect(() => {
    setObjects([]);
    setMappings([]);
    setTasks([]);
    setSchedules([]);
    setRuntimeEnvs([]);
    setAuditLogs([]);
    setActiveTab(null);
  }, [selectedConnectionId]);

  // ── Fetch tab data using existing provider-based routes ──

  const fetchTabData = useCallback(
    async (tab: TabValue, forceRefresh = false) => {
      if (!selectedConnectionId) return;

      // Skip if data already loaded (unless forced refresh)
      if (!forceRefresh) {
        const existing = {
          objects,
          mappings,
          tasks,
          schedules,
          runtimeEnvironments: runtimeEnvs,
          auditLogs,
        }[tab];
        if (existing && (existing as any[]).length > 0) return;
      }

      setTabLoading((prev) => ({ ...prev, [tab]: true }));

      try {
        let url: string;
        switch (tab) {
          case 'objects':
            url = `/api/connections/${selectedConnectionId}/tables`;
            break;
          case 'mappings':
            url = `/api/connections/${selectedConnectionId}/metadata?object=_&type=mappings`;
            break;
          case 'tasks':
            url = `/api/connections/${selectedConnectionId}/metadata?object=_&type=tasks`;
            break;
          case 'schedules':
            url = `/api/connections/${selectedConnectionId}/metadata?object=_&type=schedules`;
            break;
          case 'runtimeEnvironments':
            url = `/api/connections/${selectedConnectionId}/metadata?object=_&type=runtimeEnvironments`;
            break;
          case 'auditLogs':
            url = `/api/connections/${selectedConnectionId}/metadata?object=_&type=auditLogs`;
            break;
        }

        const res = await fetch(url);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch data');
        }

        switch (tab) {
          case 'objects':
            setObjects(json.tables || []);
            break;
          case 'mappings':
            setMappings(json.data || []);
            break;
          case 'tasks':
            setTasks(json.data || []);
            break;
          case 'schedules':
            setSchedules(json.data || []);
            break;
          case 'runtimeEnvironments':
            setRuntimeEnvs(json.data || []);
            break;
          case 'auditLogs':
            setAuditLogs(json.data || []);
            break;
        }
      } catch (err: any) {
        toast.error(`Failed to fetch ${tab}: ${err.message}`);
      } finally {
        setTabLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [selectedConnectionId, objects, mappings, tasks, schedules, runtimeEnvs, auditLogs]
  );

  // Fetch active tab data when tab changes (cached — won't re-fetch if data exists)
  useEffect(() => {
    if (selectedConnectionId && activeTab) {
      fetchTabData(activeTab);
    }
  }, [activeTab, selectedConnectionId, fetchTabData]);

  // ── Fetch object detail (on click) ──

  const handleObjectClick = useCallback(
    async (obj: any) => {
      if (!selectedConnectionId) return;

      setSelectedObject(obj);
      setObjectDetail(null);
      setDetailModalOpen(true);
      setDetailLoading(true);

      try {
        const objectId = obj.name || obj.label || obj.id;
        const res = await fetch(
          `/api/connections/${selectedConnectionId}/describe?object=${encodeURIComponent(objectId)}`
        );
        const json = await res.json();

        if (json.success) {
          setObjectDetail(json.data);
        } else {
          toast.error(json.error || 'Failed to fetch object details');
        }
      } catch (err: any) {
        toast.error(`Failed to fetch details: ${err.message}`);
      } finally {
        setDetailLoading(false);
      }
    },
    [selectedConnectionId]
  );

  // ── Mapping click handler ──

  const handleMappingClick = useCallback(
    async (mapping: any) => {
      if (!selectedConnectionId) return;

      setSelectedMapping(mapping);
      setMappingDetail(null);
      setMappingModalOpen(true);
      setMappingLoading(true);

      try {
        const res = await fetch(
          `/api/connections/${selectedConnectionId}/mapping-detail?mappingId=${encodeURIComponent(mapping.id)}`
        );
        const json = await res.json();

        if (json.success) {
          setMappingDetail(json.data);
        } else {
          toast.error(json.error || 'Failed to fetch mapping details');
        }
      } catch (err: any) {
        toast.error(`Failed to fetch mapping details: ${err.message}`);
      } finally {
        setMappingLoading(false);
      }
    },
    [selectedConnectionId]
  );

  // ── Taskflow click handler ──

  const handleTaskflowClick = useCallback(
    async (taskflow: any) => {
      if (!selectedConnectionId) return;

      setSelectedTaskflow(taskflow);
      setTaskflowDetail(null);
      setTaskflowModalOpen(true);
      setTaskflowLoading(true);

      try {
        const res = await fetch(
          `/api/connections/${selectedConnectionId}/taskflow-detail?taskflowId=${encodeURIComponent(taskflow.id)}`
        );
        const json = await res.json();

        if (json.success) {
          setTaskflowDetail(json.data);
        } else {
          toast.error(json.error || 'Failed to fetch taskflow details');
        }
      } catch (err: any) {
        toast.error(`Failed to fetch taskflow details: ${err.message}`);
      } finally {
        setTaskflowLoading(false);
      }
    },
    [selectedConnectionId]
  );

  // ── Runtime Env click handler ──

  const handleRuntimeClick = useCallback(
    async (env: any) => {
      if (!selectedConnectionId) return;

      setSelectedRuntime(env);
      setRuntimeDetail(null);
      setRuntimeModalOpen(true);
      setRuntimeLoading(true);

      try {
        const res = await fetch(
          `/api/connections/${selectedConnectionId}/runtime-detail?envId=${encodeURIComponent(env.id)}`
        );
        const json = await res.json();

        if (json.success) {
          setRuntimeDetail(json.data);
        } else {
          toast.error(json.error || 'Failed to fetch runtime details');
        }
      } catch (err: any) {
        toast.error(`Failed to fetch runtime details: ${err.message}`);
      } finally {
        setRuntimeLoading(false);
      }
    },
    [selectedConnectionId]
  );

  // ── Dynamic column generation ──

  /** Convert camelCase/snake_case keys to Title Case headers */
  const toHeader = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

  /** Generate columns dynamically from data keys */
  const generateDynamicColumns = useCallback(
    (data: any[], tab: TabValue): any[] => {
      if (!data || data.length === 0) return [];

      // Collect all unique keys from all items
      const keySet = new Set<string>();
      data.forEach((item) => {
        Object.keys(item).forEach((key) => keySet.add(key));
      });

      // Prioritize common keys first, rest alphabetically
      const priorityKeys = ['name', 'label', 'id', 'description', 'type', 'status', 'path'];
      const sortedKeys = Array.from(keySet).sort((a, b) => {
        const ai = priorityKeys.indexOf(a);
        const bi = priorityKeys.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      });

      return sortedKeys.map((key) => {
        const col: any = {
          header: toHeader(key),
          accessorKey: key,
          size: key === 'name' || key === 'description' || key === 'path' ? 300 : 200,
        };

        // Clickable name column for objects
        if (key === 'name' && tab === 'objects') {
          col.Cell = ({ row }: any) => (
            <UnstyledButton
              onClick={() => handleObjectClick(row.original)}
              style={{
                color: 'var(--mantine-color-blue-7)',
                fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              {row.original.name}
            </UnstyledButton>
          );
        }

        // Clickable name column for taskflows (mappings tab)
        if (key === 'id' && tab === 'mappings') {
          col.Cell = ({ row }: any) => (
            <UnstyledButton
              onClick={() => handleTaskflowClick(row.original)}
              style={{
                color: 'var(--mantine-color-blue-7)',
                fontWeight: 400,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {row.original.name || row.original.path}
            </UnstyledButton>
          );
        }

        // Clickable name column for runtime environments
        if (key === 'name' && tab === 'runtimeEnvironments') {
          col.Cell = ({ row }: any) => (
            <UnstyledButton
              onClick={() => handleRuntimeClick(row.original)}
              style={{
                color: 'var(--mantine-color-blue-7)',
                fontWeight: 400,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {row.original.name}
            </UnstyledButton>
          );
        }

        // Format date/time columns
        if (
          key.toLowerCase().includes('time') ||
          key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('created') ||
          key.toLowerCase().includes('updated')
        ) {
          col.Cell =
            col.Cell ||
            (({ row }: any) => {
              const val = row.original[key];
              if (!val) return '—';
              const d = new Date(val);
              return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
            });
        }

        // Status badge
        if (key === 'status') {
          col.size = 140;
          col.Cell = ({ row }: any) => {
            const status = String(row.original.status || '').toUpperCase();
            const color =
              status === 'ACTIVE' || status === 'STARTED' || status === 'SHARED'
                ? 'green'
                : status === 'STOPPED' || status === 'INACTIVE'
                  ? 'red'
                  : 'gray';
            return (
              <Badge variant="light" color={color} size="sm">
                {status || 'UNKNOWN'}
              </Badge>
            );
          };
        }

        // Skip rendering complex objects/arrays inline — show count or type
        const sample = data.find((d) => d[key] != null)?.[key];
        if (sample && typeof sample === 'object') {
          col.Cell =
            col.Cell ||
            (({ row }: any) => {
              const val = row.original[key];
              if (Array.isArray(val)) return `[${val.length} items]`;
              if (val && typeof val === 'object') return JSON.stringify(val).slice(0, 80) + '…';
              return String(val ?? '—');
            });
        }

        return col;
      });
    },
    [handleObjectClick, handleMappingClick, handleTaskflowClick, handleRuntimeClick]
  );

  // ── Render helpers ──

  const dataMap: Record<TabValue, any[]> = {
    objects,
    mappings,
    tasks,
    schedules,
    runtimeEnvironments: runtimeEnvs,
    auditLogs,
  };

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* Header */}
        <OrgHeader
          title="IICS Explorer"
          description="Browse and manage your Informatica Intelligent Cloud Services assets"
          connections={connections}
          connectionsLoading={connectionsLoading}
          selectedConnectionId={selectedConnectionId}
          onSelectConnection={setSelectedConnectionId}
        />

        {/* Stats Summary */}
        {selectedConnectionId && (
          <Group gap="md" wrap="wrap">
            <StatCard label="Objects" value={objects.length} icon={IconDatabase} color="orange" />
            <StatCard label="Taskflows" value={mappings.length} icon={IconMap} color="blue" />
            <StatCard label="Tasks" value={tasks.length} icon={IconTransform} color="teal" />
            <StatCard
              label="Schedules"
              value={schedules.length}
              icon={IconCalendarEvent}
              color="green"
            />
            <StatCard
              label="Runtime Environments"
              value={runtimeEnvs.length}
              icon={IconServer}
              color="violet"
            />
            <StatCard
              label="Audit Logs"
              value={auditLogs.length}
              icon={IconClipboardList}
              color="gray"
            />
          </Group>
        )}

        {/* Tabs */}
        {!selectedConnectionId ? (
          <Paper p="xl" radius="lg" withBorder>
            <EmptyState
              icon={IconCloud}
              title="Select an IICS Connection"
              description="Choose an IICS connection from the dropdown above to explore your assets."
            />
          </Paper>
        ) : (
          <Paper p="md" radius="lg" withBorder>
            <Tabs
              value={activeTab}
              onChange={(val) => setActiveTab(val as TabValueOrNull)}
              variant="pills"
              radius="md"
            >
              <Tabs.List mb="md">
                {TABS.map((tab) => (
                  <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    leftSection={<tab.icon size={16} />}
                    fw={activeTab === tab.value ? 400 : 400}
                  >
                    {tab.label}
                    {(dataMap[tab.value]?.length ?? 0) > 0 && (
                      <Badge size="xs" variant="light" color="orange" ml={6}>
                        {dataMap[tab.value].length}
                      </Badge>
                    )}
                  </Tabs.Tab>
                ))}
              </Tabs.List>

              {TABS.map((tab) => {
                const tabData = dataMap[tab.value] || [];
                const columns = generateDynamicColumns(tabData, tab.value);
                return (
                  <Tabs.Panel key={tab.value} value={tab.value}>
                    {tabLoading[tab.value] ? (
                      <Center py="xl">
                        <Stack align="center" gap="sm">
                          <Loader color="orange" size="md" />
                          <Text size="sm" c="dimmed">
                            Loading {tab.label}...
                          </Text>
                        </Stack>
                      </Center>
                    ) : tabData.length === 0 ? (
                      <Center py="xl">
                        <Stack align="center" gap="sm">
                          <ThemeIcon size={48} radius="xl" color="gray" variant="light">
                            <tab.icon size={24} />
                          </ThemeIcon>
                          <Title order={4} c="dimmed">
                            No {tab.label} Found
                          </Title>
                          <Text size="sm" c="dimmed" maw={400} ta="center">
                            No {tab.label.toLowerCase()} were found in this IICS organization.
                          </Text>
                        </Stack>
                      </Center>
                    ) : (
                      <VirtualTable
                        data={tabData}
                        columns={columns}
                        title={tab.label}
                        emptyMessage={`No ${tab.label} found.`}
                      />
                    )}
                  </Tabs.Panel>
                );
              })}
            </Tabs>
          </Paper>
        )}
      </Stack>

      {/* ── Modals ── */}
      <ObjectDetailModal
        opened={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedObject(null);
          setObjectDetail(null);
        }}
        loading={detailLoading}
        selectedObject={selectedObject}
        objectDetail={objectDetail}
      />

      <MappingDetailModal
        opened={mappingModalOpen}
        onClose={() => {
          setMappingModalOpen(false);
          setSelectedMapping(null);
          setMappingDetail(null);
        }}
        loading={mappingLoading}
        selectedMapping={selectedMapping}
        mappingDetail={mappingDetail}
      />

      <TaskflowDetailModal
        opened={taskflowModalOpen}
        onClose={() => {
          setTaskflowModalOpen(false);
          setSelectedTaskflow(null);
          setTaskflowDetail(null);
        }}
        loading={taskflowLoading}
        selectedTaskflow={selectedTaskflow}
        taskflowDetail={taskflowDetail}
        connectionId={selectedConnectionId}
      />

      <RuntimeDetailModal
        opened={runtimeModalOpen}
        onClose={() => {
          setRuntimeModalOpen(false);
          setSelectedRuntime(null);
          setRuntimeDetail(null);
        }}
        loading={runtimeLoading}
        selectedRuntime={selectedRuntime}
        runtimeDetail={runtimeDetail}
      />
    </Container>
  );
}
