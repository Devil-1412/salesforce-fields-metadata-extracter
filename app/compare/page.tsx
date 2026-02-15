'use client';

import { type Connection } from '@components/OrgHeader';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

/* ── Types ── */
interface OrgPresence {
  present: boolean;
  label: string;
  custom: boolean;
}

interface ComparisonRow {
  objectName: string;
  keyPrefix: string;
  orgs: OrgPresence[];
}

/* ── Helpers ── */
/** Build grouped options for the connection selector */
function buildGroupedOptions(connections: Connection[]) {
  const groups: Record<string, { value: string; label: string }[]> = {};
  (connections || []).forEach((c) => {
    if (!c) return;
    const type = c.connection_type.charAt(0).toUpperCase() + c.connection_type.slice(1);
    if (!groups[type]) groups[type] = [];
    groups[type].push({ value: c.id, label: c.display_name || 'Untitled' });
  });
  return Object.entries(groups).map(([group, items]) => ({ group, items }));
}

export default function ComparePage() {
  /* ── Connection state ── */
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  /** IDs of the connections chosen per slot (min 2 slots) */
  const [slots, setSlots] = useState<(string | null)[]>([null, null]);

  /* ── Comparison state ── */
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Derived ── */
  const groupedOptions = useMemo(() => buildGroupedOptions(connections), [connections]);

  const resolvedSlots = useMemo(
    () => slots.map((id) => (id ? (connections.find((c) => c.id === id) ?? null) : null)),
    [slots, connections]
  );

  const validSlots = useMemo(() => resolvedSlots.filter(Boolean) as Connection[], [resolvedSlots]);

  /* ── Load connections on mount ── */
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success && Array.isArray(data.connections)) {
        setConnections(data.connections);
      }
    } catch (err) {
      console.error('Failed to load connections', err);
      toast.error('Failed to load connections');
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  /* ── Fetch & compare objects when 2+ valid slots ── */
  useEffect(() => {
    if (validSlots.length < 2) {
      setComparison([]);
      setLoading(false);
      return;
    }

    const fetchAndCompare = async () => {
      setLoading(true);
      setError('');
      try {
        const objectLists = await Promise.all(
          validSlots.map(async (conn) => {
            try {
              const res = await fetch(`/api/connections/${conn.id}/tables`);
              const data = await res.json();
              if (data.success) return data.tables ?? data.objects ?? [];
              throw new Error(data.error || 'Failed to fetch');
            } catch (err) {
              toast.error(
                `Error fetching objects for ${conn.display_name}: ${(err as Error).message}`
              );
              return [];
            }
          })
        );

        const allNames = Array.from(
          new Set(objectLists.flat().map((o: { name: string }) => o.name))
        );

        const comparisonData: ComparisonRow[] = allNames.map((name) => ({
          objectName: name,
          keyPrefix:
            objectLists
              .find((list) => list.some((o: { name: string }) => o.name === name))
              ?.find((o: { name: string }) => o.name === name)?.keyPrefix || '',
          orgs: validSlots.map((_, idx) => {
            const obj = objectLists[idx].find((o: { name: string }) => o.name === name);
            return {
              present: !!obj,
              label: obj?.label || name,
              custom: obj?.custom || false,
            };
          }),
        }));
        setComparison(comparisonData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchAndCompare();
  }, [validSlots]);

  /* ── Slot management ── */
  const addSlot = () => setSlots((prev) => [...prev, null]);

  const removeSlot = (index: number) => {
    if (slots.length > 2) {
      setSlots((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const selectSlot = async (index: number, connectionId: string | null) => {
    if (!connectionId) return;
    const conn = connections.find((c) => c.id === connectionId);
    if (!conn) return;

    // Health check
    const toastId = toast.loading(`Connecting to ${conn.display_name}…`);
    try {
      const res = await fetch(`/api/connections/${connectionId}`);
      const data = await res.json();
      if (data.success && data.connection?.healthy) {
        setSlots((prev) => {
          const next = [...prev];
          next[index] = connectionId;
          return next;
        });
        toast.success(`Connected to ${conn.display_name}`, { id: toastId });
      } else {
        toast.error(data.error || 'Connection unhealthy', { id: toastId });
      }
    } catch {
      toast.error('Connection failed', { id: toastId });
    }
  };

  /* ── Filter ── */
  const filteredComparison = comparison.filter((obj) => {
    if (search && !obj.objectName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'both') return obj.orgs.every((o) => o.present);
    if (filter === 'different') return obj.orgs.some((o) => !o.present);
    if (filter === 'custom') return obj.orgs.some((o) => o.custom);
    return true;
  });

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }} p="md">
      <Container size="xl">
        <Stack gap="lg">
          <Title
            order={2}
            ta="center"
            style={{
              background: 'linear-gradient(to right, #1d4ed8, #4f46e5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Connection Comparison
          </Title>

          {/* Connection Selection */}
          <Paper radius="lg" shadow="sm" p="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Select Connections</Title>
              <Button leftSection={<IconPlus size={16} />} size="sm" onClick={addSlot}>
                Add Connection
              </Button>
            </Group>

            <Group grow>
              {slots.map((slotId, index) => {
                const conn = slotId ? (connections.find((c) => c.id === slotId) ?? null) : null;
                return (
                  <Paper key={index} withBorder radius="md" p="sm">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={600}>
                        Connection {index + 1}
                      </Text>
                      {slots.length > 2 && (
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="sm"
                          onClick={() => removeSlot(index)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                    <Select
                      placeholder={connectionsLoading ? 'Loading…' : 'Select a connection'}
                      value={slotId}
                      onChange={(val) => selectSlot(index, val)}
                      data={groupedOptions}
                      disabled={connectionsLoading}
                      searchable
                    />
                    {conn && (
                      <Group gap="xs" mt="xs">
                        <Badge size="xs" variant="light">
                          {conn.connection_type.toUpperCase()}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {conn.display_name}
                        </Text>
                      </Group>
                    )}
                  </Paper>
                );
              })}
            </Group>
          </Paper>

          {/* Main Content */}
          {validSlots.length < 2 ? (
            <Center py="xl">
              <Text c="dimmed">Select at least 2 connections to compare…</Text>
            </Center>
          ) : loading ? (
            <Center py="xl">
              <Loader />
              <Text c="dimmed" ml="sm">
                Fetching objects from connections…
              </Text>
            </Center>
          ) : error ? (
            <Center py="xl">
              <Text c="red">{error}</Text>
            </Center>
          ) : (
            <>
              {/* Filters */}
              <Group justify="space-between">
                <TextInput
                  placeholder="Search object…"
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  style={{ width: 300 }}
                />
                <SegmentedControl
                  value={filter}
                  onChange={setFilter}
                  data={[
                    { label: 'Show All', value: 'all' },
                    { label: 'In All', value: 'both' },
                    { label: 'Different', value: 'different' },
                    { label: 'Custom Only', value: 'custom' },
                  ]}
                />
              </Group>

              {/* Results Table */}
              <Paper radius="lg" shadow="md" withBorder style={{ overflow: 'hidden' }}>
                <ScrollArea h={500}>
                  <Table striped highlightOnHover>
                    <Table.Thead
                      style={{
                        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                      }}
                    >
                      <Table.Tr>
                        <Table.Th c="white">Object Name</Table.Th>
                        <Table.Th c="white">Key Prefix</Table.Th>
                        {validSlots.map((conn, idx) => (
                          <Table.Th key={idx} c="white">
                            {conn.display_name}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredComparison.map((obj) => {
                        const hasMissing = obj.orgs.some((o) => !o.present);
                        return (
                          <Table.Tr key={obj.objectName} bg={hasMissing ? 'red.0' : undefined}>
                            <Table.Td fw={500}>{obj.objectName}</Table.Td>
                            <Table.Td>{obj.keyPrefix}</Table.Td>
                            {obj.orgs.map((o, orgIdx) => (
                              <Table.Td key={orgIdx}>
                                {o.present ? (
                                  <Text size="sm">{o.label}</Text>
                                ) : (
                                  <Text c="dimmed">—</Text>
                                )}
                              </Table.Td>
                            ))}
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
