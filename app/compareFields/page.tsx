'use client';

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
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Co-located components
import ComparisonCard from './components/ComparisonCard';
import ComparisonStats from './components/ComparisonStats';
import FieldsTable from './components/FieldsTable';
import OrgSelector from './components/OrgSelector';

interface AvailableOrg {
  instance_url?: string;
  instanceUrl?: string;
  org_name?: string;
  orgName?: string;
}

interface Org {
  orgName?: string;
  org_name?: string;
  accessToken: string | null;
  instanceUrl: string | null;
  instance_url?: string;
}

interface ObjectOption {
  name: string;
  label: string;
}

interface Target {
  orgKey: string;
  objectName: string;
  orgLabel?: string;
}

interface Comparison {
  id: string;
  name: string;
  sourceOrg: string;
  sourceObject: string;
  targets: Target[];
}

interface Participant {
  orgKey: string;
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
  // Org state
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<AvailableOrg[]>([]);
  const [orgObjectsMap, setOrgObjectsMap] = useState<Record<string, ObjectOption[]>>({});
  const [orgsData, setOrgsData] = useState<Record<string, FieldData[]>[]>([]);
  const [loading, setLoading] = useState(true);

  // Comparison state
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [activeComparisonId, setActiveComparisonId] = useState('');
  const [fieldData, setFieldData] = useState<ComparisonData[]>([]);

  // Filter state
  const [filter, setFilter] = useState('all');
  const [metadataOptions, setMetadataOptions] = useState<string[]>([]);
  const [selectedMetadata, setSelectedMetadata] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'default' | 'separate'>('default');
  const [scrollLock, setScrollLock] = useState(false);

  const validOrgs = useMemo(() => orgs.filter((org) => org.accessToken && org.instanceUrl), [orgs]);

  const orgObjectsToLoad = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    validOrgs.forEach((org) => {
      map[org.instanceUrl!] = new Set();
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
      if (set) {
        result[key] = Array.from(set);
      }
    });
    return result;
  }, [validOrgs, comparisons]);

  // Initialize orgs
  useEffect(() => {
    const initialOrgs: Org[] = [
      { orgName: 'Org 1', accessToken: null, instanceUrl: null },
      { orgName: 'Org 2', accessToken: null, instanceUrl: null },
    ];
    setOrgs(initialOrgs);
  }, []);

  // Fetch available orgs
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch('/api/listAllOrgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success) {
          setAvailableOrgs(data.organizations);
        }
      } catch (err) {
        console.error('Error fetching orgs:', err);
      }
    };
    fetchOrgs();
  }, []);

  // Ensure default comparison exists
  useEffect(() => {
    if (!comparisons.length) {
      const defaultComparison: Comparison = {
        id: 'cmp-1',
        name: 'Comparison 1',
        sourceOrg: validOrgs[0]?.instanceUrl || '',
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
  }, [comparisons, activeComparisonId, validOrgs]);

  // Fetch objects for each org
  useEffect(() => {
    if (validOrgs.length === 0) {
      setOrgObjectsMap({});
      return;
    }

    let isCancelled = false;

    const fetchOrgObjects = async () => {
      const results = await Promise.all(
        validOrgs.map(async (org) => {
          try {
            const res = await fetch('/api/objects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: org.accessToken,
                instanceUrl: org.instanceUrl,
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to load objects');
            }
            return { key: org.instanceUrl!, list: data.object || [] };
          } catch (error) {
            console.error('Error fetching objects for org:', org.instanceUrl, error);
            return { key: org.instanceUrl!, list: [] };
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
  }, [validOrgs]);

  // Fetch field data
  useEffect(() => {
    if (validOrgs.length === 0) {
      setLoading(false);
      setOrgsData([]);
      setFieldData([]);
      return;
    }

    const hasSelection = validOrgs.some(
      (org) => (orgObjectsToLoad[org.instanceUrl!] || []).length > 0
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
          validOrgs.map(async (org) => {
            const objects = orgObjectsToLoad[org.instanceUrl!] || [];
            if (!objects.length) {
              return { success: true, data: {} };
            }
            const res = await fetch('/api/fields', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: org.accessToken,
                instanceUrl: org.instanceUrl,
                objects,
              }),
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
  }, [validOrgs, orgObjectsToLoad]);

  // Build field comparison data
  const orgDataMap = useMemo(() => {
    const map: Record<string, Record<string, FieldData[]>> = {};
    validOrgs.forEach((org, idx) => {
      map[org.instanceUrl!] = orgsData[idx] || {};
    });
    return map;
  }, [validOrgs, orgsData]);

  useEffect(() => {
    if (!comparisons.length) {
      setFieldData([]);
      return;
    }

    const orgLabelMap = Object.fromEntries(
      validOrgs.map((org, idx) => [
        org.instanceUrl,
        org.orgName !== 'None' ? org.orgName : `Org ${idx + 1}`,
      ])
    );

    const comparisonData = comparisons.map((comparison) => {
      const participants: Participant[] = [];

      if (comparison.sourceOrg && comparison.sourceObject) {
        participants.push({
          orgKey: comparison.sourceOrg,
          objectName: comparison.sourceObject,
          orgLabel: orgLabelMap[comparison.sourceOrg] || comparison.sourceOrg,
          role: 'source',
        });
      }

      (comparison.targets || []).forEach((target) => {
        if (target.orgKey && target.objectName) {
          participants.push({
            orgKey: target.orgKey,
            objectName: target.objectName,
            orgLabel: orgLabelMap[target.orgKey] || target.orgKey,
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
  }, [comparisons, orgDataMap, selectedMetadata, validOrgs]);

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

  // Handlers
  const addOrg = () => {
    setOrgs([...orgs, { orgName: `Org ${orgs.length + 1}`, accessToken: null, instanceUrl: null }]);
  };

  const removeOrg = (index: number) => {
    if (orgs.length <= 2) {
      toast.error('At least 2 organizations are required');
      return;
    }
    setOrgs(orgs.filter((_, i) => i !== index));
  };

  const updateOrg = (index: number, org: Org) => {
    const updatedOrgs = [...orgs];
    updatedOrgs[index] = org;
    setOrgs(updatedOrgs);
  };

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
    if (!validOrgs.length) {
      toast.error('Connect at least one org before adding comparisons');
      return;
    }
    const newComparison: Comparison = {
      id: `cmp-${Date.now()}`,
      name: `Comparison ${comparisons.length + 1}`,
      sourceOrg: validOrgs[0]?.instanceUrl || '',
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
      // Allow same org to be selected for both source and target
      if (!validOrgs.length) {
        toast.error('No organizations available for target mapping');
        return comparison;
      }
      return {
        ...comparison,
        targets: [
          ...comparison.targets,
          { orgKey: validOrgs[0]?.instanceUrl ?? '', objectName: '' },
        ],
      };
    });
  };

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
            Salesforce Field Comparison
          </Title>
          <Text ta="center" c="dimmed">
            Compare fields across{' '}
            {validOrgs.length > 0
              ? validOrgs.map((org, idx) => (
                  <span key={idx}>
                    <Text component="span" fw={600} c="blue">
                      {org.orgName !== 'None' ? org.orgName : `Org ${idx + 1}`}
                    </Text>
                    {idx < validOrgs.length - 1 && ', '}
                  </span>
                ))
              : 'organizations'}
          </Text>

          <OrgSelector
            orgs={orgs}
            availableOrgs={availableOrgs}
            onAddOrg={addOrg}
            onRemoveOrg={removeOrg}
            onUpdateOrg={updateOrg}
          />

          {validOrgs.length >= 2 && (
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
                    validOrgs={validOrgs.map((org) => ({
                      instanceUrl: org.instanceUrl!,
                      orgName: org.orgName,
                    }))}
                    orgObjectsMap={orgObjectsMap}
                    canRemove={comparisons.length > 1}
                    onRemove={() => removeComparison(comparison.id)}
                    onNameChange={(name) => handleComparisonChange(comparison.id, { name })}
                    onSourceOrgChange={(orgKey) =>
                      handleComparisonChange(comparison.id, {
                        sourceOrg: orgKey,
                        sourceObject: '',
                        // Keep all targets - same org comparison is allowed
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
                    onTargetOrgChange={(targetIdx, orgKey) =>
                      handleComparisonChange(comparison.id, (c) => {
                        const targets = [...c.targets];
                        targets[targetIdx] = { orgKey, objectName: '' };
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
