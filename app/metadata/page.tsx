'use client';

import EmptyState from '@components/EmptyState';
import FieldAnalysisTable from '@components/FieldAnalysisTable';
import OrgHeader, { type Connection } from '@components/OrgHeader';
import SearchableDropdown from '@components/SearchableDropdown';
import { Box, Container, Group, Paper, Stack, Tabs, Text } from '@mantine/core';
import { IconBox } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Co-located components
import ApexClassesTable from './components/ApexClassesTable';
import FieldsTable from './components/FieldsTable';
import TriggersTable from './components/TriggersTable';
import ValidationRulesTable from './components/ValidationRulesTable';
import WorkflowsTable from './components/WorkflowsTable';

interface TableObject {
  name: string;
  label: string;
  keyPrefix?: string;
  [key: string]: unknown;
}

interface Field {
  [key: string]: unknown;
}

interface ValidationRule {
  fullName: string;
  active?: boolean;
  description?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

interface Trigger {
  Name: string;
  Status?: string;
  [key: string]: unknown;
}

interface ApexClass {
  Name: string;
  ApiVersion?: string;
  Status?: string;
  [key: string]: unknown;
}

interface Workflow {
  fullName: string;
  triggerType?: string;
  actions?: unknown[];
  [key: string]: unknown;
}

const ALL_METADATA_KEYS = [
  'label',
  'ApiName',
  'type',
  'length',
  'precision',
  'scale',
  'digits',
  'byteLength',
  'DBOrder',
  'soapType',
  'extraTypeInfo',
  'defaultValue',
  'defaultValueFormula',
  'compoundFieldName',
  'controllerName',
  'filteredLookupInfo',
  'mask',
  'maskType',
  'referenceTo',
  'referenceTargetField',
  'relationshipName',
  'relationshipOrder',
  'aggregatable',
  'aiPredictionField',
  'autoNumber',
  'calculated',
  'cascadeDelete',
  'cascadeDeleteSpecified',
  'caseSensitive',
  'custom',
  'dataTranslationEnabled',
  'dataTranslationEnabledSpecified',
  'defaultedOnCreate',
  'dependentPicklist',
  'dependentPicklistSpecified',
  'deprecatedAndHidden',
  'displayLocationInDecimal',
  'displayLocationInDecimalSpecified',
  'encrypted',
  'encryptedSpecified',
  'externalId',
  'externalIdSpecified',
  'filterable',
  'formulaTreatNullNumberAsZero',
  'formulaTreatNullNumberAsZeroSpecified',
  'groupable',
  'highScaleNumber',
  'highScaleNumberSpecified',
  'htmlFormatted',
  'htmlFormattedSpecified',
  'idLookup',
  'nameField',
  'namePointing',
  'namePointingSpecified',
  'permissionable',
  'polymorphicForeignKey',
  'queryByDistance',
  'relationshipOrderSpecified',
  'restrictedDelete',
  'restrictedDeleteSpecified',
  'restrictedPicklist',
  'searchPrefilterable',
  'sortable',
  'sortableSpecified',
  'unique',
  'writeRequiresMasterRead',
  'writeRequiresMasterReadSpecified',
  'Salesforce Data Type',
  'MSSQL Data Type',
  'Oracle Data Type',
  'MySQL Data Type',
  'Properties',
  'Nullable',
  'Createable',
  'Updateable',
  'On Page Layout',
  'PicklistValues',
  'Category',
  'Description',
  'Help Text',
  'Formula',
];

/**
 * Tab registry — maps connection type to available metadata tabs.
 * 'Fields' is always present. Provider-specific tabs are appended.
 * Adding a new provider? Just add an entry here.
 */
const TAB_REGISTRY: Record<string, string[]> = {
  salesforce: [
    'Fields',
    'Field Analysis',
    'Validation Rules',
    'Triggers',
    'Apex Classes',
    'Workflows',
  ],
  snowflake: ['Fields', 'Field Analysis', 'Constraints'],
};

export default function MetadataPage() {
  const [activeTab, setActiveTab] = useState<string | null>('Fields');

  // ── Connection state ──
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  /** Derive connection type from the selected connection */
  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === selectedConnectionId) ?? null,
    [connections, selectedConnectionId]
  );
  const connectionType = selectedConnection?.connection_type ?? '';
  const tabs = TAB_REGISTRY[connectionType] ?? ['Fields'];

  // ── Object state ──
  const [objects, setObjects] = useState<TableObject[]>([]);
  const [objectsLoading, setObjectsLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState('');

  // ── Metadata state ──
  const [recordCounts, setRecordCounts] = useState<Record<string, number | string>>({});
  const [fieldsData, setFieldsData] = useState<Record<string, Field[]>>({});
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [apexClasses, setApexClasses] = useState<ApexClass[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [constraints, setConstraints] = useState<Record<string, unknown>[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // ── Load connections on mount ──
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success && Array.isArray(data.connections)) {
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Failed to load connections', error);
      toast.error('Failed to load connections');
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
      const conn = connections.find((c) => c.id === connectionId);
      if (!conn) return;

      const toastId = toast.loading(`Connecting to ${conn.display_name}...`);

      setSelectedConnectionId(connectionId);
      // Reset object state
      setObjects([]);
      setSelectedObject('');
      setFieldsData({});
      setValidationRules([]);
      setTriggers([]);
      setApexClasses([]);
      setWorkflows([]);
      setConstraints([]);
      setRecordCounts({});

      try {
        // Health check (also initialises SF session server-side)
        const res = await fetch(`/api/connections/${connectionId}`);
        const data = await res.json();
        if (data.success && data.connection?.healthy) {
          toast.success(`Connected to ${conn.display_name}`, { id: toastId });
        } else {
          toast.error('Connection unhealthy — check credentials', { id: toastId });
        }
      } catch {
        toast.error('Failed to verify connection', { id: toastId });
      }
    },
    [connections]
  );

  // ── Fetch objects/tables when connection is selected ──
  useEffect(() => {
    const fetchObjects = async () => {
      if (!selectedConnectionId) return;
      setObjectsLoading(true);
      try {
        const res = await fetch(`/api/connections/${selectedConnectionId}/tables`);
        const data = await res.json();
        if (data.success) {
          setObjects(data.tables || []);
        } else {
          toast.error('Failed to fetch objects');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching objects');
      } finally {
        setObjectsLoading(false);
      }
    };

    fetchObjects();
  }, [selectedConnectionId]);

  // ── Fetch fields + record count when object is selected ──
  useEffect(() => {
    if (!selectedObject || !selectedConnectionId) return;

    const fetchFieldsAndCount = async () => {
      if (fieldsData[selectedObject]) return;
      setLoadingMetadata(true);
      try {
        // Fetch detailed fields
        const fieldsRes = await fetch(`/api/connections/${selectedConnectionId}/fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objects: [selectedObject] }),
        });
        const fieldsPayload = await fieldsRes.json();
        if (fieldsPayload.success) {
          setFieldsData((prev) => ({ ...prev, ...fieldsPayload.data }));
        }

        // Fetch record count
        const countRes = await fetch(
          `/api/connections/${selectedConnectionId}/record-count?object=${encodeURIComponent(selectedObject)}`
        );
        const countData = await countRes.json();
        setRecordCounts((prev) => ({
          ...prev,
          [selectedObject]: countData.success ? countData.count : 'N/A',
        }));
      } catch (err) {
        console.error(err);
        toast.error('Error fetching metadata');
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchFieldsAndCount();

    // Clear provider-specific metadata when object changes
    setValidationRules([]);
    setTriggers([]);
    setApexClasses([]);
    setWorkflows([]);
    setConstraints([]);
    setActiveTab('Fields');
  }, [selectedObject, selectedConnectionId, fieldsData]);

  // ── Fetch other metadata types on tab switch ──
  const fetchMetadataByType = useCallback(
    async (type: string) => {
      if (!selectedConnectionId || !selectedObject) return;

      // Guard against re-fetching cached data
      if (type === 'validationRules' && validationRules.length > 0) return;
      if (type === 'triggers' && triggers.length > 0) return;
      if (type === 'apexClasses' && apexClasses.length > 0) return;
      if (type === 'workflows' && workflows.length > 0) return;
      if (type === 'constraints' && constraints.length > 0) return;

      try {
        const res = await fetch(
          `/api/connections/${selectedConnectionId}/metadata?object=${encodeURIComponent(selectedObject)}&type=${encodeURIComponent(type)}`
        );
        const data = await res.json();
        if (data.success) {
          switch (type) {
            case 'validationRules':
              setValidationRules(data.data);
              break;
            case 'triggers':
              setTriggers(data.data);
              break;
            case 'apexClasses':
              setApexClasses(data.data);
              break;
            case 'workflows':
              setWorkflows(data.data);
              break;
            case 'constraints':
              setConstraints(data.data);
              break;
          }
        }
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);
      }
    },
    [
      selectedConnectionId,
      selectedObject,
      validationRules,
      triggers,
      apexClasses,
      workflows,
      constraints,
    ]
  );

  useEffect(() => {
    if (activeTab === 'Validation Rules') fetchMetadataByType('validationRules');
    else if (activeTab === 'Triggers') fetchMetadataByType('triggers');
    else if (activeTab === 'Apex Classes') fetchMetadataByType('apexClasses');
    else if (activeTab === 'Workflows') fetchMetadataByType('workflows');
    else if (activeTab === 'Constraints') fetchMetadataByType('constraints');
  }, [activeTab, selectedObject, fetchMetadataByType]);

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      }}
      p="lg"
    >
      <Container size="xl">
        <Paper radius="xl" shadow="xl" p="xl" withBorder>
          <Stack gap="lg">
            <OrgHeader
              title="Metadata Explorer"
              description="Analyze objects, fields, and automation in your connected data sources."
              connections={connections}
              connectionsLoading={connectionsLoading}
              selectedConnectionId={selectedConnectionId}
              onSelectConnection={selectConnection}
            />

            {/* Object Selection + Info Section */}
            <Paper radius="lg" p="lg" withBorder>
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Box w={300}>
                  <SearchableDropdown
                    label="Select Object"
                    options={objects.map((o) => ({
                      label: `${o.label} (${o.name})`,
                      value: o.name,
                    }))}
                    value={selectedObject}
                    onChange={(val: string | string[]) =>
                      setSelectedObject(Array.isArray(val) ? val[0] || '' : val)
                    }
                    placeholder={objectsLoading ? 'Loading Objects...' : '— Choose Object —'}
                    disabled={!selectedConnectionId || objectsLoading}
                  />
                </Box>

                {selectedObject && (
                  <Group gap="md">
                    <Paper radius="lg" p="md" bg="blue.0" withBorder>
                      <Text size="xs" tt="uppercase" c="dimmed">
                        Key Prefix
                      </Text>
                      <Text fw={600} c="blue.7">
                        {objects.find((o) => o.name === selectedObject)?.keyPrefix || '—'}
                      </Text>
                    </Paper>

                    <Paper radius="lg" p="md" bg="indigo.0" withBorder>
                      <Text size="xs" tt="uppercase" c="dimmed">
                        Fields
                      </Text>
                      <Text fw={600} c="indigo.7">
                        {fieldsData[selectedObject]?.length || (loadingMetadata ? '...' : 0)}
                      </Text>
                    </Paper>

                    <Paper radius="lg" p="md" bg="green.0" withBorder>
                      <Text size="xs" tt="uppercase" c="dimmed">
                        Records
                      </Text>
                      <Text fw={600} c="green.7">
                        {recordCounts[selectedObject] || (loadingMetadata ? '...' : '—')}
                      </Text>
                    </Paper>
                  </Group>
                )}
              </Group>
            </Paper>

            {/* Tabs — content changes by provider */}
            {selectedObject && (
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                  {tabs.map((tab) => (
                    <Tabs.Tab key={tab} value={tab}>
                      {tab}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>

                <Box>
                  <Tabs.Panel value="Fields" h="100%">
                    <FieldsTable
                      selectedObject={selectedObject}
                      selectedObjects={[selectedObject]}
                      fieldsData={fieldsData}
                      allMetadataKeys={ALL_METADATA_KEYS}
                      objects={objects}
                      connectionId={selectedConnectionId || ''}
                    />
                  </Tabs.Panel>

                  <Tabs.Panel value="Field Analysis" h="100%">
                    <FieldAnalysisTable
                      fields={fieldsData[selectedObject] || []}
                      objectName={selectedObject}
                      connectionId={selectedConnectionId || ''}
                    />
                  </Tabs.Panel>

                  {connectionType === 'salesforce' && (
                    <>
                      <Tabs.Panel value="Validation Rules" h="100%">
                        <ValidationRulesTable data={validationRules} />
                      </Tabs.Panel>

                      <Tabs.Panel value="Triggers" h="100%">
                        <TriggersTable data={triggers} />
                      </Tabs.Panel>

                      <Tabs.Panel value="Apex Classes" h="100%">
                        <ApexClassesTable data={apexClasses} />
                      </Tabs.Panel>

                      <Tabs.Panel value="Workflows" h="100%">
                        <WorkflowsTable data={workflows} />
                      </Tabs.Panel>
                    </>
                  )}

                  {connectionType === 'snowflake' && (
                    <Tabs.Panel value="Constraints" h="100%">
                      {constraints.length > 0 ? (
                        <Box style={{ overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                {(constraints[0] ? Object.keys(constraints[0]) : []).map((key) => (
                                  <th
                                    key={key}
                                    style={{
                                      padding: '8px 12px',
                                      textAlign: 'left',
                                      borderBottom: '2px solid #dee2e6',
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {constraints.map((row, i) => (
                                <tr key={i}>
                                  {Object.values(row).map((val, j) => (
                                    <td
                                      key={j}
                                      style={{
                                        padding: '6px 12px',
                                        borderBottom: '1px solid #eee',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {String(val ?? '—')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      ) : (
                        <EmptyState
                          title="No Constraints"
                          description="No constraints found for this table."
                        />
                      )}
                    </Tabs.Panel>
                  )}
                </Box>
              </Tabs>
            )}

            {!selectedObject && !objectsLoading && (
              <EmptyState
                title="No Object Selected"
                description="Select an object from the dropdown above to view its metadata, fields, and rules."
                icon={IconBox}
              />
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
