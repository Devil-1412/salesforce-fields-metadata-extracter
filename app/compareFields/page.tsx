'use client';

import { type Connection } from '@components/OrgHeader';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  MultiSelect,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { IconLayoutColumns, IconLayoutGrid, IconPlus } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Co-located components
import ComparisonCard from './components/ComparisonCard';
import ComparisonStats from './components/ComparisonStats';
import FieldsTable from './components/FieldsTable';
import ConnectionSelector from './components/OrgSelector';

/* ── Types ── */
interface ObjectOption {
  name: string;
  label: string;
}

interface Target {
  orgKey: string; // connectionId
  objectName: string;
  orgLabel?: string;
}

interface Comparison {
  id: string;
  name: string;
  sourceOrg: string; // connectionId
  sourceObject: string;
  targets: Target[];
}

interface Participant {
  orgKey: string; // connectionId
  objectName: string;
  orgLabel: string;
  role: string;
}

interface FieldData {
  [key: string]: unknown;
}

interface FieldComparison {
  fieldName: string;
  fieldDataArray: FieldData[];
  diff: boolean;
  diffKeys: string[];
}

interface ComparisonData {
  comparisonId: string;
  comparisonName: string;
  participants: Participant[];
  fields: FieldComparison[];
}

export default function CompareFieldsPage() {
  /* ── Connection state ── */
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<(string | null)[]>([null, null]);

  /* ── Data state ── */
  const [orgObjectsMap, setOrgObjectsMap] = useState<Record<string, ObjectOption[]>>({});
  const [orgsData, setOrgsData] = useState<Record<string, FieldData[]>[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Comparison state ── */
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [activeComparisonId, setActiveComparisonId] = useState('');
  const [fieldData, setFieldData] = useState<ComparisonData[]>([]);

  /* ── Filter state ── */
  const [filter, setFilter] = useState('all');
  const [metadataOptions, setMetadataOptions] = useState<string[]>([]);
  const [selectedMetadata, setSelectedMetadata] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'default' | 'separate'>('default');
  const [scrollLock, setScrollLock] = useState(false);

  /* ── Derived ── */
  const validConnections = useMemo(
    () =>
      selectedSlots
        .map((id) => (id ? (connections.find((c) => c.id === id) ?? null) : null))
        .filter(Boolean) as Connection[],
    [selectedSlots, connections]
  );

  const orgObjectsToLoad = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    validConnections.forEach((conn) => {
      map[conn.id] = new Set();
    });

    comparisons.forEach((cmp) => {
      if (cmp.sourceOrg && cmp.sourceObject) {
        if (!map[cmp.sourceOrg]) map[cmp.sourceOrg] = new Set();
        map[cmp.sourceOrg]!.add(cmp.sourceObject);
      }
      (cmp.targets || []).forEach((t) => {
        if (t.orgKey && t.objectName) {
          if (!map[t.orgKey]) map[t.orgKey] = new Set();
          map[t.orgKey]!.add(t.objectName);
        }
      });
    });

    const result: Record<string, string[]> = {};
    Object.keys(map).forEach((key) => {
      const set = map[key];
      if (set) result[key] = Array.from(set);
    });
    return result;
  }, [validConnections, comparisons]);

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

  /* ── Slot management ── */
  const addSlot = () => setSelectedSlots((prev) => [...prev, null]);

  const removeSlot = (index: number) => {
    if (selectedSlots.length > 2) {
      setSelectedSlots((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const selectSlot = async (index: number, connectionId: string) => {
    if (!connectionId) return;
    const conn = connections.find((c) => c.id === connectionId);
    if (!conn) return;

    const toastId = toast.loading(`Connecting to ${conn.display_name}…`);
    try {
      const res = await fetch(`/api/connections/${connectionId}`);
      const data = await res.json();
      if (data.success && data.connection?.healthy) {
        setSelectedSlots((prev) => {
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

  /* ── Ensure default comparison exists ── */
  useEffect(() => {
    if (!comparisons.length) {
      const defaultComparison: Comparison = {
        id: 'cmp-1',
        name: 'Comparison 1',
        sourceOrg: validConnections[0]?.id || '',
        sourceObject: '',
        targets: [],
      };
      setComparisons([defaultComparison]);
      setActiveComparisonId(defaultComparison.id);
      return;
    }

    if (!comparisons.some((cmp) => cmp.id === activeComparisonId)) {
      setActiveComparisonId(comparisons[0]!.id);
    }
  }, [comparisons, activeComparisonId, validConnections]);

  /* ── Fetch objects for each connected slot ── */
  useEffect(() => {
    if (validConnections.length === 0) {
      setOrgObjectsMap({});
      return;
    }

    let isCancelled = false;

    const fetchOrgObjects = async () => {
      const results = await Promise.all(
        validConnections.map(async (conn) => {
          try {
            const res = await fetch(`/api/connections/${conn.id}/tables`);
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to load objects');
            }
            return { key: conn.id, list: data.tables ?? data.objects ?? [] };
          } catch (error) {
            console.error('Error fetching objects for connection:', conn.id, error);
            return { key: conn.id, list: [] };
          }
        })
      );

      if (isCancelled) return;

      const map = results.reduce(
        (acc, { key, list }) => {
          acc[key] = list;
          return acc;
        },
        {} as Record<string, ObjectOption[]>
      );
      setOrgObjectsMap(map);
    };

    fetchOrgObjects();

    return () => {
      isCancelled = true;
    };
  }, [validConnections]);

  /* ── Fetch field data ── */
  useEffect(() => {
    if (validConnections.length === 0) {
      setLoading(false);
      setOrgsData([]);
      setFieldData([]);
      return;
    }

    const hasSelection = validConnections.some(
      (conn) => (orgObjectsToLoad[conn.id] || []).length > 0
    );

    if (!hasSelection) {
      setLoading(false);
      setOrgsData([]);
      setFieldData([]);
      return;
    }

    const fetchFieldsData = async () => {
      try {
        setLoading(true);
        const responses = await Promise.all(
          validConnections.map(async (conn) => {
            const objects = orgObjectsToLoad[conn.id] || [];
            if (!objects.length) {
              return { success: true, data: {} };
            }
            const res = await fetch(`/api/connections/${conn.id}/fields`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ objects }),
            });
            return await res.json();
          })
        );

        setOrgsData(responses.map((data) => data.data || {}));

        const firstSuccessData = responses.find((data) => data.success && data.data);
        if (firstSuccessData) {
          const dataObj = firstSuccessData.data as Record<string, FieldData[]>;
          const firstObjectFields = Object.values(dataObj)[0] || [];
          const sampleObj = firstObjectFields[0] || {};
          const dynamicKeys = Object.keys(sampleObj);
          setMetadataOptions(dynamicKeys);
          setSelectedMetadata((prev) => (prev.length ? prev : dynamicKeys.slice(0, 4)));
        }
      } catch (err) {
        toast.error('Comparison error: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchFieldsData();
  }, [validConnections, orgObjectsToLoad]);

  /* ── Build field comparison data ── */
  const orgDataMap = useMemo(() => {
    const map: Record<string, Record<string, FieldData[]>> = {};
    validConnections.forEach((conn, idx) => {
      map[conn.id] = orgsData[idx] || {};
    });
    return map;
  }, [validConnections, orgsData]);

  useEffect(() => {
    if (!comparisons.length) {
      setFieldData([]);
      return;
    }

    const connLabelMap = Object.fromEntries(
      validConnections.map((conn) => [conn.id, conn.display_name || 'Untitled'])
    );

    const comparisonData = comparisons.map((comparison) => {
      const participants: Participant[] = [];

      if (comparison.sourceOrg && comparison.sourceObject) {
        participants.push({
          orgKey: comparison.sourceOrg,
          objectName: comparison.sourceObject,
          orgLabel: connLabelMap[comparison.sourceOrg] || comparison.sourceOrg,
          role: 'source',
        });
      }

      (comparison.targets || []).forEach((target) => {
        if (target.orgKey && target.objectName) {
          participants.push({
            orgKey: target.orgKey,
            objectName: target.objectName,
            orgLabel: connLabelMap[target.orgKey] || target.orgKey,
            role: 'target',
          });
        }
      });

      const fieldMaps = participants.map(({ orgKey, objectName }) => {
        if (!objectName) return {};
        const objectFields = orgDataMap[orgKey]?.[objectName] || [];
        return Object.fromEntries((objectFields as FieldData[]).map((f) => [f.ApiName, f]));
      });

      const allFields = new Set<string>();
      fieldMaps.forEach((map) => {
        Object.keys(map).forEach((key) => allFields.add(key));
      });

      const fields = Array.from(allFields).map((fieldName) => {
        const fieldDataArray = fieldMaps.map((map) => map[fieldName] || {});
        const differences = selectedMetadata.reduce((acc: string[], key) => {
          const values = fieldDataArray.map((f) => (f[key] === undefined ? null : f[key]));
          const firstValue = values[0];
          const allSame = values.every((val) => val === firstValue);
          if (!allSame) acc.push(key);
          return acc;
        }, []);

        return {
          fieldName,
          fieldDataArray,
          diff: differences.length > 0,
          diffKeys: differences,
        };
      });

      return {
        comparisonId: comparison.id,
        comparisonName: comparison.name,
        participants,
        fields,
      };
    });

    setFieldData(comparisonData);
  }, [comparisons, orgDataMap, selectedMetadata, validConnections]);

  const activeComparison = fieldData.find((f) => f.comparisonId === activeComparisonId);
  const activeParticipants = activeComparison?.participants || [];

  const filteredFields = useMemo(() => {
    if (!activeComparison) return [];
    return activeComparison.fields.filter((f) =>
      filter === 'all' ? true : filter === 'different' ? f.diff : !f.diff
    );
  }, [filter, activeComparison]);

  const matchingCount = activeComparison?.fields.filter((f) => !f.diff).length || 0;
  const differentCount = activeComparison?.fields.filter((f) => f.diff).length || 0;
  const totalCount = activeComparison?.fields.length || 0;
  const diffPercent = totalCount > 0 ? Math.round((differentCount / totalCount) * 100) : 0;
  const hasActiveData = !!activeComparison && activeParticipants.length >= 2;

  /* ── Comparison handlers ── */
  const handleComparisonChange = (
    comparisonId: string,
    updater: Partial<Comparison> | ((c: Comparison) => Comparison)
  ) => {
    setComparisons((prev) =>
      prev.map((comparison) =>
        comparison.id === comparisonId
          ? typeof updater === 'function'
            ? updater(comparison)
            : { ...comparison, ...updater }
          : comparison
      )
    );
  };

  const addComparison = () => {
    if (!validConnections.length) {
      toast.error('Connect at least one connection before adding comparisons');
      return;
    }
    const newComparison: Comparison = {
      id: `cmp-${Date.now()}`,
      name: `Comparison ${comparisons.length + 1}`,
      sourceOrg: validConnections[0]?.id || '',
      sourceObject: '',
      targets: [],
    };
    setComparisons((prev) => [...prev, newComparison]);
    setActiveComparisonId(newComparison.id);
  };

  const removeComparison = (comparisonId: string) => {
    if (comparisons.length <= 1) {
      toast.error('At least one comparison is required');
      return;
    }
    setComparisons((prev) => prev.filter((cmp) => cmp.id !== comparisonId));
    if (activeComparisonId === comparisonId && comparisons.length > 1) {
      setActiveComparisonId(comparisons.find((c) => c.id !== comparisonId)?.id || '');
    }
  };

  const addComparisonTarget = (comparisonId: string) => {
    handleComparisonChange(comparisonId, (comparison) => {
      if (!validConnections.length) {
        toast.error('No connections available for target mapping');
        return comparison;
      }
      return {
        ...comparison,
        targets: [...comparison.targets, { orgKey: validConnections[0]?.id ?? '', objectName: '' }],
      };
    });
  };

  /* ── Map validConnections for ComparisonCard ── */
  const validConnectionsForCard = useMemo(
    () =>
      validConnections.map((c) => ({
        connectionId: c.id,
        displayName: c.display_name || 'Untitled',
        connectionType: c.connection_type,
      })),
    [validConnections]
  );

  return (
    <Box bg="gray.0" mih="100vh" py="lg" px="md">
      <Container size="xl">
        <Stack gap="lg">
          <Title
            order={2}
            ta="center"
            style={{
              background: 'linear-gradient(135deg, #1e40af, #4f46e5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Field Comparison
          </Title>
          <Text ta="center" c="dimmed">
            Compare fields across{' '}
            {validConnections.length > 0
              ? validConnections.map((conn, idx) => (
                  <span key={idx}>
                    <Text component="span" fw={600} c="blue">
                      {conn.display_name}
                    </Text>
                    {idx < validConnections.length - 1 && ', '}
                  </span>
                ))
              : 'connections'}
          </Text>

          <ConnectionSelector
            connections={connections}
            connectionsLoading={connectionsLoading}
            selectedSlots={selectedSlots}
            onAddSlot={addSlot}
            onRemoveSlot={removeSlot}
            onSelectSlot={selectSlot}
          />

          {validConnections.length >= 2 && (
            <Paper radius="lg" p="lg" shadow="md" withBorder>
              <Stack gap="lg">
                <Group justify="space-between">
                  <Box>
                    <Text fw={600} size="lg">
                      Comparison Logic
                    </Text>
                    <Text size="sm" c="dimmed">
                      Map a source object to target objects for comparison.
                    </Text>
                  </Box>
                  <Button leftSection={<IconPlus size={16} />} onClick={addComparison}>
                    Add Comparison
                  </Button>
                </Group>

                {comparisons.map((comparison, idx) => (
                  <ComparisonCard
                    key={comparison.id}
                    comparison={comparison}
                    index={idx}
                    validConnections={validConnectionsForCard}
                    orgObjectsMap={orgObjectsMap}
                    canRemove={comparisons.length > 1}
                    onRemove={() => removeComparison(comparison.id)}
                    onNameChange={(name) => handleComparisonChange(comparison.id, { name })}
                    onSourceOrgChange={(connectionId) =>
                      handleComparisonChange(comparison.id, {
                        sourceOrg: connectionId,
                        sourceObject: '',
                      })
                    }
                    onSourceObjectChange={(objectName) =>
                      handleComparisonChange(comparison.id, { sourceObject: objectName })
                    }
                    onAddTarget={() => addComparisonTarget(comparison.id)}
                    onRemoveTarget={(targetIdx) =>
                      handleComparisonChange(comparison.id, (c) => ({
                        ...c,
                        targets: c.targets.filter((_, i) => i !== targetIdx),
                      }))
                    }
                    onTargetOrgChange={(targetIdx, connectionId) =>
                      handleComparisonChange(comparison.id, (c) => {
                        const targets = [...c.targets];
                        targets[targetIdx] = { orgKey: connectionId, objectName: '' };
                        return { ...c, targets };
                      })
                    }
                    onTargetObjectChange={(targetIdx, objectName) =>
                      handleComparisonChange(comparison.id, (c) => {
                        const targets = [...c.targets];
                        const existingTarget = targets[targetIdx];
                        targets[targetIdx] = { orgKey: existingTarget?.orgKey ?? '', objectName };
                        return { ...c, targets };
                      })
                    }
                  />
                ))}

                <Paper p="lg" radius="lg" withBorder bg="blue.0">
                  <Group justify="space-between" wrap="wrap">
                    <div>
                      <Text fw={600} c="blue.7">
                        View Comparison
                      </Text>
                      <Select
                        value={activeComparisonId}
                        onChange={(val) => val && setActiveComparisonId(val)}
                        data={comparisons.map((cmp, idx) => ({
                          value: cmp.id,
                          label: cmp.name || `Comparison ${idx + 1}`,
                        }))}
                        mt="xs"
                        style={{ minWidth: 220 }}
                      />
                    </div>
                    <Group>
                      {activeParticipants.map((p, idx) => (
                        <Badge
                          key={`${p.orgKey}-${idx}`}
                          color={p.role === 'source' ? 'blue' : 'grape'}
                          variant="light"
                          size="lg"
                        >
                          {p.orgLabel}: {p.objectName || 'No object'}
                        </Badge>
                      ))}
                    </Group>
                  </Group>
                </Paper>

                <ComparisonStats
                  totalCount={totalCount}
                  matchingCount={matchingCount}
                  differentCount={differentCount}
                  diffPercent={diffPercent}
                />
              </Stack>
            </Paper>
          )}

          {/* Controls */}
          <Group justify="space-between" wrap="wrap">
            <MultiSelect
              label="Compare By"
              value={selectedMetadata}
              onChange={setSelectedMetadata}
              data={metadataOptions}
              placeholder="Select metadata fields"
              maxDropdownHeight={200}
              style={{ minWidth: 250 }}
            />
            <Group>
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                data={[
                  { label: 'All Fields', value: 'all' },
                  { label: 'Only Different', value: 'different' },
                  { label: 'Only Matching', value: 'same' },
                ]}
              />
              <Button
                variant="light"
                leftSection={
                  displayMode === 'default' ? (
                    <IconLayoutColumns size={16} />
                  ) : (
                    <IconLayoutGrid size={16} />
                  )
                }
                onClick={() => setDisplayMode(displayMode === 'default' ? 'separate' : 'default')}
              >
                {displayMode === 'default' ? 'Separate Tables' : 'Side-by-Side'}
              </Button>
              {displayMode === 'separate' && (
                <Switch
                  label="Scroll Lock"
                  checked={scrollLock}
                  onChange={(e) => setScrollLock(e.currentTarget.checked)}
                />
              )}
            </Group>
          </Group>

          {/* Results */}
          {loading ? (
            <Center py="xl">
              <Loader size="lg" />
            </Center>
          ) : hasActiveData ? (
            <FieldsTable
              participants={activeParticipants}
              filteredFields={filteredFields}
              selectedMetadata={selectedMetadata}
              displayMode={displayMode}
              scrollLock={scrollLock}
            />
          ) : (
            <Paper p="xl" radius="lg" withBorder ta="center">
              <Text c="dimmed">Select a comparison with defined objects to view field data.</Text>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
