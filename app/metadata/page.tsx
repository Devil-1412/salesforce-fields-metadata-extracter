'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Container,
  Paper,
  Stack,
  Group,
  Text,
  Tabs,
  Box,
  Loader,
  Center,
} from '@mantine/core';
import { IconBox } from '@tabler/icons-react';
import SearchableDropdown from '@components/SearchableDropdown';
import OrgHeader from '@components/OrgHeader';
import EmptyState from '@components/EmptyState';
import FieldAnalysisTable from '@components/FieldAnalysisTable';

// Co-located components
import FieldsTable from './components/FieldsTable';
import ValidationRulesTable from './components/ValidationRulesTable';
import TriggersTable from './components/TriggersTable';
import ApexClassesTable from './components/ApexClassesTable';
import WorkflowsTable from './components/WorkflowsTable';

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
  'label', 'ApiName', 'type', 'length', 'precision', 'scale', 'digits', 'byteLength',
  'DBOrder', 'soapType', 'extraTypeInfo', 'defaultValue', 'defaultValueFormula',
  'compoundFieldName', 'controllerName', 'filteredLookupInfo', 'mask', 'maskType',
  'referenceTo', 'referenceTargetField', 'relationshipName', 'relationshipOrder',
  'aggregatable', 'aiPredictionField', 'autoNumber', 'calculated', 'cascadeDelete',
  'cascadeDeleteSpecified', 'caseSensitive', 'custom', 'dataTranslationEnabled',
  'dataTranslationEnabledSpecified', 'defaultedOnCreate', 'dependentPicklist',
  'dependentPicklistSpecified', 'deprecatedAndHidden', 'displayLocationInDecimal',
  'displayLocationInDecimalSpecified', 'encrypted', 'encryptedSpecified', 'externalId',
  'externalIdSpecified', 'filterable', 'formulaTreatNullNumberAsZero',
  'formulaTreatNullNumberAsZeroSpecified', 'groupable', 'highScaleNumber',
  'highScaleNumberSpecified', 'htmlFormatted', 'htmlFormattedSpecified', 'idLookup',
  'nameField', 'namePointing', 'namePointingSpecified', 'permissionable',
  'polymorphicForeignKey', 'queryByDistance', 'relationshipOrderSpecified',
  'restrictedDelete', 'restrictedDeleteSpecified', 'restrictedPicklist',
  'searchPrefilterable', 'sortable', 'sortableSpecified', 'unique',
  'writeRequiresMasterRead', 'writeRequiresMasterReadSpecified',
  'Salesforce Data Type', 'MSSQL Data Type', 'Oracle Data Type', 'MySQL Data Type',
  'Properties', 'Nullable', 'Createable', 'Updateable', 'On Page Layout',
  'PicklistValues', 'Category', 'Description', 'Help Text', 'Formula',
];

const TABS = ['Fields', 'Field Analysis', 'Validation Rules', 'Triggers', 'Apex Classes', 'Workflows'];

export default function MetadataPage() {
  const [activeTab, setActiveTab] = useState<string | null>('Fields');

  // Org State
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedOrgMeta, setSelectedOrgMeta] = useState<OrgMeta | null>(null);
  const [token, setToken] = useState('');
  const [instanceUrl, setInstanceUrl] = useState('');

  // Object State
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [objectsLoading, setObjectsLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState('');

  // Metadata State
  const [recordCounts, setRecordCounts] = useState<Record<string, number | string>>({});
  const [fieldsData, setFieldsData] = useState<Record<string, Field[]>>({});
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [apexClasses, setApexClasses] = useState<ApexClass[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load Orgs on Mount
  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    try {
      const res = await fetch('/api/listAllOrgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.organizations)) {
        setOrgs(data.organizations);
      }
    } catch (error) {
      console.error('Failed to load orgs', error);
      toast.error('Failed to load organizations');
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  // Select Org Logic
  const selectOrg = useCallback(
    async (instanceValue: string) => {
      const org = orgs.find(
        (item) => item.instance_url === instanceValue || item.instanceUrl === instanceValue
      );
      if (!org) return;

      const targetInstanceUrl = org.instance_url || org.instanceUrl || '';
      const toastId = toast.loading(`Logging in to ${org.org_name || 'Salesforce'}...`);

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

          // Reset object state
          setObjects([]);
          setSelectedObject('');
          setFieldsData({});
          setValidationRules([]);
          setTriggers([]);
          setApexClasses([]);
          setWorkflows([]);
          setRecordCounts({});

          toast.success(`Connected to ${data.orgName || 'Salesforce Org'}`, { id: toastId });
        } else {
          toast.error(data.error || 'Login failed', { id: toastId });
        }
      } catch (err) {
        console.error('Login Error:', err);
        toast.error('Login failed', { id: toastId });
      }
    },
    [orgs]
  );

  // Fetch Objects when Org is Selected
  useEffect(() => {
    const fetchObjects = async () => {
      if (!instanceUrl || !token) return;
      setObjectsLoading(true);
      try {
        const res = await fetch('/api/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token, instanceUrl }),
        });
        const data = await res.json();
        if (data.success) {
          setObjects(data.object);
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
  }, [instanceUrl, token]);

  // Fetch Metadata when Object is Selected
  useEffect(() => {
    if (!selectedObject || !instanceUrl || !token) return;

    const fetchFields = async () => {
      if (fieldsData[selectedObject]) return;
      setLoadingMetadata(true);
      try {
        const fieldsRes = await fetch('/api/fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token, instanceUrl, objects: [selectedObject] }),
        });
        const fieldsPayload = await fieldsRes.json();
        if (fieldsPayload.success) {
          setFieldsData((prev) => ({ ...prev, ...fieldsPayload.data }));
        }

        const countRes = await fetch('/api/getRecordCount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token, instanceUrl, objectName: selectedObject }),
        });
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

    fetchFields();

    // Clear other tabs data when object changes
    setValidationRules([]);
    setTriggers([]);
    setApexClasses([]);
    setWorkflows([]);
    setActiveTab('Fields');
  }, [selectedObject, instanceUrl, token, fieldsData]);

  // Fetch other metadata types on tab switch
  const fetchMetadataByType = useCallback(
    async (type: string) => {
      if (!token || !instanceUrl || !selectedObject) return;

      if (type === 'validationRules' && validationRules.length > 0) return;
      if (type === 'triggers' && triggers.length > 0) return;
      if (type === 'apexClasses' && apexClasses.length > 0) return;
      if (type === 'workflows' && workflows.length > 0) return;

      try {
        const res = await fetch('/api/objectMetadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token, instanceUrl, selectedObject, type }),
        });
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
          }
        }
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);
      }
    },
    [token, instanceUrl, selectedObject, validationRules, triggers, apexClasses, workflows]
  );

  useEffect(() => {
    if (activeTab === 'Validation Rules') fetchMetadataByType('validationRules');
    else if (activeTab === 'Triggers') fetchMetadataByType('triggers');
    else if (activeTab === 'Apex Classes') fetchMetadataByType('apexClasses');
    else if (activeTab === 'Workflows') fetchMetadataByType('workflows');
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
              title="Salesforce Metadata Explorer"
              description="Analyze objects, fields, and automation in your Salesforce org."
              orgs={orgs}
              selectedOrgId={selectedOrgId}
              onSelectOrg={selectOrg}
              orgLoading={orgLoading}
              selectedOrgMeta={selectedOrgMeta}
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
                    onChange={(val: string | string[]) => setSelectedObject(Array.isArray(val) ? val[0] || '' : val)}
                    placeholder={objectsLoading ? 'Loading Objects...' : '— Choose Object —'}
                    disabled={!selectedOrgId || objectsLoading}
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

            {/* Tabs */}
            {selectedObject && (
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                  {TABS.map((tab) => (
                    <Tabs.Tab key={tab} value={tab}>
                      {tab}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>

                <Box h={600}>
                  <Tabs.Panel value="Fields" h="100%">
                    <FieldsTable
                      selectedObject={selectedObject}
                      selectedObjects={[selectedObject]}
                      fieldsData={fieldsData}
                      allMetadataKeys={ALL_METADATA_KEYS}
                      objects={objects}
                      token={token}
                      instanceUrl={instanceUrl}
                    />
                  </Tabs.Panel>

                  <Tabs.Panel value="Field Analysis" h="100%">
                    <FieldAnalysisTable
                      fields={fieldsData[selectedObject] || []}
                      objectName={selectedObject}
                      token={token}
                      instanceUrl={instanceUrl}
                    />
                  </Tabs.Panel>

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
