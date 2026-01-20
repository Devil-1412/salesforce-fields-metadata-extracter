'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import {
  Box,
  Container,
  Paper,
  Text,
  Group,
  Button,
  Stack,
  Center,
  Loader,
  Alert,
  Code,
  Badge,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconDeviceFloppy,
  IconPalette,
  IconKeyboard,
} from '@tabler/icons-react';

import OrgHeader from '@components/OrgHeader';
import ConfirmDialog from '@components/ConfirmDialog';

// Co-located components
import SaveQueryModal from './components/SaveQueryModal';
import FilterModal from './components/FilterModal';
import SavedQueriesList from './components/SavedQueriesList';
import ResultsTable from './components/ResultsTable';
import ThemePickerModal from './components/ThemePickerModal';

const THEMES = [
  { id: 'prism-tomorrow.css', label: 'Tomorrow Night' },
  { id: 'prism-coy.css', label: 'Coy' },
  { id: 'prism-dark.css', label: 'Dark' },
  { id: 'prism-funky.css', label: 'Funky' },
  { id: 'prism-okaidia.css', label: 'Okaidia' },
  { id: 'prism-solarizedlight.css', label: 'Solarized Light' },
  { id: 'prism-twilight.css', label: 'Twilight' },
  { id: 'prism-atom-dark.css', label: 'Atom Dark' },
  { id: 'prism-dracula.css', label: 'Dracula' },
  { id: 'prism-gruvbox-dark.css', label: 'Gruvbox Dark' },
  { id: 'prism-material-dark.css', label: 'Material Dark' },
  { id: 'prism-material-light.css', label: 'Material Light' },
  { id: 'prism-material-oceanic.css', label: 'Material Oceanic' },
  { id: 'prism-night-owl.css', label: 'Night Owl' },
  { id: 'prism-nord.css', label: 'Nord' },
  { id: 'prism-one-dark.css', label: 'One Dark' },
  { id: 'prism-one-light.css', label: 'One Light' },
  { id: 'prism-shades-of-purple.css', label: 'Shades of Purple' },
  { id: 'prism-synthwave84.css', label: "Synthwave '84" },
  { id: 'prism-vs.css', label: 'VS Code' },
  { id: 'prism-vsc-dark-plus.css', label: 'VSC Dark Plus' },
  { id: 'prism.css', label: 'Default' },
];

const SOQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
  'LIMIT', 'OFFSET', 'FOR VIEW', 'FOR REFERENCE',
  'AND', 'OR', 'NOT', 'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES', 'LIKE',
  'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'TRUE', 'FALSE', 'NULL',
  'TODAY', 'YESTERDAY', 'TOMORROW',
  'LAST_WEEK', 'THIS_WEEK', 'NEXT_WEEK',
  'LAST_MONTH', 'THIS_MONTH', 'NEXT_MONTH',
];

interface Org {
  instanceUrl?: string;
  instance_url?: string;
  orgName?: string;
  org_name?: string;
  [key: string]: unknown;
}

interface OrgMeta extends Org {
  accessToken?: string;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
}

interface QueryRecord {
  attributes?: unknown;
  [key: string]: unknown;
}

interface QueryResults {
  records: QueryRecord[];
  totalSize: number;
}

interface ColumnFilter {
  type: string;
  value: string;
}

interface Suggestion {
  text: string;
  label?: string;
  type: string;
}

interface ObjectMeta {
  name: string;
  label: string;
}

interface FieldMeta {
  name: string;
  label: string;
  type: string;
}

export default function SoqlPage() {
  const router = useRouter();
  
  // Org state
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedOrgMeta, setSelectedOrgMeta] = useState<OrgMeta | null>(null);
  const [instanceUrl, setInstanceUrl] = useState('');
  const [token, setToken] = useState('');

  // Query state
  const [query, setQuery] = useState('SELECT Id, Name, CreatedDate FROM Account LIMIT 10');
  const [results, setResults] = useState<QueryResults | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');

  // Theme state
  const [theme, setTheme] = useState('prism-tomorrow.css');
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [originalTheme, setOriginalTheme] = useState('');

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [objectsCache, setObjectsCache] = useState<ObjectMeta[]>([]);
  const [fieldsCache, setFieldsCache] = useState<Record<string, FieldMeta[]>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Saved queries state
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [savingQuery, setSavingQuery] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<SavedQuery | null>(null);

  // Filtering state
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState('contains');
  const [filterValue, setFilterValue] = useState('');

  // Theme effect
  useEffect(() => {
    const linkId = 'prism-theme-link';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = `/themes/${theme}`;
  }, [theme]);

  const openThemePicker = () => {
    setOriginalTheme(theme);
    setIsThemePickerOpen(true);
  };

  const closeThemePicker = (save = false) => {
    if (!save) {
      setTheme(originalTheme);
    }
    setIsThemePickerOpen(false);
  };

  // Load orgs
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
    } catch (err) {
      setOrgError((err as Error)?.message || 'Unable to load organizations.');
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
      const toastId = !silent ? toast.loading(`Logging in to ${org.org_name || 'Salesforce'}...`) : null;

      try {
        const res = await fetch('/api/salesforceLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceUrl: targetInstanceUrl }),
        });
        const data = await res.json();

        if (data.success) {
          setSelectedOrgId(targetInstanceUrl);
          setSelectedOrgMeta({ ...org, accessToken: data.accessToken, instanceUrl: targetInstanceUrl });
          setToken(data.accessToken);
          setInstanceUrl(targetInstanceUrl);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('instanceUrl', targetInstanceUrl);

          if (!silent && toastId) {
            toast.success(`Loaded ${data.orgName || 'Salesforce organization'}`, { id: toastId });
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

  useEffect(() => {
    if (!orgs.length) return;
    const savedInstance = localStorage.getItem('instanceUrl');
    const initialOrg = orgs.find((org) => org.instanceUrl === savedInstance) || orgs[0];
    if (initialOrg) {
      selectOrg(initialOrg.instanceUrl || initialOrg.instance_url || '', { silent: true });
    }
  }, [orgs, selectOrg]);

  // Execute query
  const executeQuery = async () => {
    if (!instanceUrl || !token) {
      toast.error('Please select an organization first.');
      return;
    }
    if (!query.trim()) {
      toast.error('Please enter a SOQL query.');
      return;
    }

    setExecuting(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/soql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, instanceUrl, query }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Query execution failed.');
      }

      setResults(data.data);
      toast.success(`Query executed. Found ${data.data.totalSize} records.`);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setExecuting(false);
    }
  };

  // Sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtering
  const getProcessedResults = (): QueryResults => {
    if (!results || !results.records) return { records: [], totalSize: 0 };

    let filteredRecords = [...results.records];

    // Apply filters
    Object.entries(columnFilters).forEach(([column, filter]) => {
      filteredRecords = filteredRecords.filter((record) => {
        const value = record[column];
        const filterVal = filter.value;

        switch (filter.type) {
          case 'equals':
            return String(value).toLowerCase() === String(filterVal).toLowerCase();
          case 'notEquals':
            return String(value).toLowerCase() !== String(filterVal).toLowerCase();
          case 'contains':
            return String(value).toLowerCase().includes(String(filterVal).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterVal).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterVal).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filterVal);
          case 'lessThan':
            return Number(value) < Number(filterVal);
          case 'isNull':
            return value == null || value === '';
          case 'isNotNull':
            return value != null && value !== '';
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortColumn) {
      filteredRecords.sort((a, b) => {
        let aVal: unknown = a[sortColumn];
        let bVal: unknown = b[sortColumn];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Convert to strings for comparison
        const aStr = typeof aVal === 'object' ? JSON.stringify(aVal) : String(aVal);
        const bStr = typeof bVal === 'object' ? JSON.stringify(bVal) : String(bVal);

        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return { ...results, records: filteredRecords, totalSize: filteredRecords.length };
  };

  const openFilterModal = (column: string) => {
    setActiveFilterColumn(column);
    if (columnFilters[column]) {
      setFilterType(columnFilters[column].type);
      setFilterValue(columnFilters[column].value);
    } else {
      setFilterType('contains');
      setFilterValue('');
    }
    setShowFilterModal(true);
  };

  const applyColumnFilter = () => {
    if (!activeFilterColumn) return;

    const needsValue = !['isNull', 'isNotNull'].includes(filterType);
    if (needsValue && !filterValue.trim()) {
      toast.error('Please enter a filter value');
      return;
    }

    setColumnFilters((prev) => ({
      ...prev,
      [activeFilterColumn]: { type: filterType, value: filterValue },
    }));

    setShowFilterModal(false);
    setActiveFilterColumn(null);
    setFilterValue('');
    toast.success(`Filter applied to ${activeFilterColumn}`);
  };

  const removeColumnFilter = (column: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
    toast.success(`Filter removed from ${column}`);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    toast.success('All filters cleared');
  };

  // Export CSV
  const exportToCSV = () => {
    const processedResults = getProcessedResults();
    if (!processedResults.records?.length) {
      toast.error('No data to export');
      return;
    }

    const records = processedResults.records;
    const columns = Object.keys(records[0]).filter((key) => key !== 'attributes');

    const csvHeader = columns.join(',');
    const csvRows = records.map((record) => {
      return columns
        .map((column) => {
          const value = record[column];
          if (value == null) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `soql_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${records.length} records to CSV`);
  };

  // Fetch objects metadata
  const fetchObjects = useCallback(async () => {
    if (objectsCache.length > 0 || !instanceUrl || !token) return;

    setLoadingMetadata(true);
    try {
      const res = await fetch('/api/metadata/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, instanceUrl, type: 'objects' }),
      });
      const data = await res.json();
      if (data.success) {
        setObjectsCache(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch objects:', err);
    } finally {
      setLoadingMetadata(false);
    }
  }, [instanceUrl, token, objectsCache.length]);

  // Fetch fields for object
  const fetchFields = useCallback(
    async (objectName: string) => {
      if (fieldsCache[objectName] || !instanceUrl || !token) return;

      try {
        const res = await fetch('/api/metadata/describe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token, instanceUrl, type: 'fields', objectName }),
        });
        const data = await res.json();
        if (data.success) {
          setFieldsCache((prev) => ({ ...prev, [objectName]: data.data.fields }));
        }
      } catch (err) {
        console.error(`Failed to fetch fields for ${objectName}:`, err);
      }
    },
    [instanceUrl, token, fieldsCache]
  );

  useEffect(() => {
    if (instanceUrl && token) {
      fetchObjects();
    }
  }, [instanceUrl, token, fetchObjects]);

  // Saved queries
  const fetchSavedQueries = useCallback(async () => {
    try {
      const res = await fetch('/api/queries/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setSavedQueries(data.queries);
      }
    } catch (err) {
      console.error('Error fetching saved queries:', err);
    }
  }, []);

  useEffect(() => {
    fetchSavedQueries();
  }, [fetchSavedQueries]);

  const handleSaveQuery = async () => {
    if (!newQueryName.trim()) {
      toast.error('Please enter a name for the query');
      return;
    }

    setSavingQuery(true);
    try {
      const res = await fetch('/api/queries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQueryName, query }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Query saved successfully');
        setIsSaveModalOpen(false);
        setNewQueryName('');
        fetchSavedQueries();
      } else {
        toast.error(data.error || 'Failed to save query');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save query');
    } finally {
      setSavingQuery(false);
    }
  };

  const handleDeleteQuery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueryToDelete(savedQueries.find((q) => q.id === id) || null);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuery = async () => {
    if (!queryToDelete) return;

    try {
      const res = await fetch('/api/queries/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: queryToDelete.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Query deleted successfully');
        fetchSavedQueries();
      } else {
        toast.error(data.error || 'Failed to delete query');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete query');
    } finally {
      setShowDeleteConfirm(false);
      setQueryToDelete(null);
    }
  };

  const loadSavedQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
    toast.success(`Loaded query: ${savedQuery.name}`);
  };

  // Editor handlers
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <Box bg="gray.0" mih="100vh" py="lg" px="md">
      <Container size="xl">
        <Stack gap="lg">
          <OrgHeader
            title="SOQL Query Editor"
            description="Execute SOQL queries directly against your Salesforce organization."
            orgs={orgs}
            selectedOrgId={selectedOrgId}
            onSelectOrg={selectOrg}
            orgLoading={orgLoading}
            selectedOrgMeta={selectedOrgMeta}
          />

          <Group justify="flex-end">
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPalette size={14} />}
              onClick={openThemePicker}
            >
              Theme: {THEMES.find((t) => t.id === theme)?.label}
            </Button>
          </Group>

          {orgError && (
            <Alert color="red" title="Error">
              {orgError}{' '}
              {!orgLoading && !orgs.length && (
                <Text
                  component="a"
                  td="underline"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push('/profile')}
                >
                  Add one in your profile
                </Text>
              )}
            </Alert>
          )}

          {/* Query Editor Section */}
          <Paper radius="lg" p="lg" shadow="md" withBorder>
            <Stack gap="md">
              <Text size="sm" fw={500}>
                SOQL Query
              </Text>
              <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
                <Editor
                  value={query}
                  onValueChange={setQuery}
                  onKeyDown={handleEditorKeyDown}
                  highlight={(code) => highlight(code, languages.sql || {})}
                  padding={16}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    backgroundColor: '#f8f9fa',
                    minHeight: '150px',
                  }}
                />
              </Paper>

              <Group justify="space-between">
                <Group gap="sm">
                  <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    onClick={executeQuery}
                    loading={executing}
                    disabled={!query.trim()}
                  >
                    Execute Query
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={() => setIsSaveModalOpen(true)}
                  >
                    Save Query
                  </Button>
                </Group>
                <Group gap="xs">
                  <IconKeyboard size={14} color="gray" />
                  <Code>Ctrl + Enter</Code>
                  <Text size="xs" c="dimmed">
                    to execute
                  </Text>
                </Group>
              </Group>

              <SavedQueriesList
                queries={savedQueries}
                onLoad={loadSavedQuery}
                onDelete={handleDeleteQuery}
              />
            </Stack>
          </Paper>

          {error && (
            <Alert color="red" title="Query Error">
              <Code block>{error}</Code>
            </Alert>
          )}

          {results && (
            <ResultsTable
              results={results}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              columnFilters={columnFilters}
              onOpenFilter={openFilterModal}
              onRemoveFilter={removeColumnFilter}
              onClearAllFilters={clearAllFilters}
              onExportCSV={exportToCSV}
              getProcessedResults={getProcessedResults}
            />
          )}
        </Stack>
      </Container>

      {/* Modals */}
      <SaveQueryModal
        opened={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        queryName={newQueryName}
        setQueryName={setNewQueryName}
        onSave={handleSaveQuery}
        saving={savingQuery}
      />

      <FilterModal
        opened={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        column={activeFilterColumn}
        filterType={filterType}
        setFilterType={setFilterType}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        onApply={applyColumnFilter}
        onRemove={() => activeFilterColumn && removeColumnFilter(activeFilterColumn)}
        hasExistingFilter={!!activeFilterColumn && !!columnFilters[activeFilterColumn]}
      />

      <ThemePickerModal
        opened={isThemePickerOpen}
        onClose={closeThemePicker}
        themes={THEMES}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setQueryToDelete(null);
        }}
        onConfirm={confirmDeleteQuery}
        title="Delete Saved Query"
        message="Are you sure you want to delete this saved query? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
}
