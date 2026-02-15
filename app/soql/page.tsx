'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { IconDeviceFloppy, IconKeyboard, IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import ConfirmDialog from '@components/ConfirmDialog';
import OrgHeader, { type Connection } from '@components/OrgHeader';

// Co-located components
import ResultsTable from './components/ResultsTable';
import SavedQueriesList from './components/SavedQueriesList';
import SaveQueryModal from './components/SaveQueryModal';

// ── CodeMirror ──
import { autocompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { sql, StandardSQL } from '@codemirror/lang-sql';
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { placeholder as cmPlaceholder, EditorView, keymap } from '@codemirror/view';

// ── Provider-specific keyword completions ──
const SOQL_KEYWORDS: Completion[] = [
  'SELECT',
  'FROM',
  'WHERE',
  'ORDER BY',
  'GROUP BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AND',
  'OR',
  'NOT',
  'IN',
  'LIKE',
  'ASC',
  'DESC',
  'NULLS FIRST',
  'NULLS LAST',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'TRUE',
  'FALSE',
  'NULL',
  'INCLUDES',
  'EXCLUDES',
  'FOR VIEW',
  'FOR REFERENCE',
  'TODAY',
  'YESTERDAY',
  'TOMORROW',
  'LAST_WEEK',
  'THIS_WEEK',
  'NEXT_WEEK',
  'LAST_MONTH',
  'THIS_MONTH',
  'NEXT_MONTH',
  'LAST_QUARTER',
  'THIS_QUARTER',
  'LAST_YEAR',
  'THIS_YEAR',
  'LAST_N_DAYS',
  'NEXT_N_DAYS',
  'TYPEOF',
  'END',
  'WITH DATA CATEGORY',
  'ROLLUP',
  'CUBE',
].map((kw) => ({ label: kw, type: 'keyword' }));

const SQL_KEYWORDS: Completion[] = [
  'SELECT',
  'FROM',
  'WHERE',
  'ORDER BY',
  'GROUP BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AND',
  'OR',
  'NOT',
  'IN',
  'LIKE',
  'ILIKE',
  'JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'ON',
  'USING',
  'UNION',
  'UNION ALL',
  'INTERSECT',
  'EXCEPT',
  'ASC',
  'DESC',
  'NULLS FIRST',
  'NULLS LAST',
  'BETWEEN',
  'IS NULL',
  'IS NOT NULL',
  'EXISTS',
  'ANY',
  'ALL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'CAST',
  'COALESCE',
  'NULLIF',
  'IFNULL',
  'NVL',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'DISTINCT',
  'WITH',
  'AS',
  'OVER',
  'PARTITION BY',
  'ROW_NUMBER',
  'RANK',
  'DENSE_RANK',
  'TRUE',
  'FALSE',
  'NULL',
  'SHOW',
  'DESCRIBE',
  'EXPLAIN',
  'LATERAL',
  'FLATTEN',
  'QUALIFY',
  'PIVOT',
  'UNPIVOT',
].map((kw) => ({ label: kw, type: 'keyword' }));

// ── Interfaces ──
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

// ── Default queries per connection type ──
const DEFAULT_QUERIES: Record<string, string> = {
  salesforce: 'SELECT Id, Name, CreatedDate FROM Account LIMIT 10',
  snowflake: 'SELECT * FROM INFORMATION_SCHEMA.TABLES LIMIT 10',
};

const PAGE_SIZE = 250;

export default function QueryPage() {
  const router = useRouter();

  // Connection state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === selectedConnectionId) ?? null,
    [connections, selectedConnectionId]
  );

  // Query state
  const [query, setQuery] = useState('SELECT Id, Name, CreatedDate FROM Account LIMIT 10');
  const [results, setResults] = useState<QueryResults | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Saved queries state
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [savingQuery, setSavingQuery] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<SavedQuery | null>(null);

  // CodeMirror ref
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // ── Choose keyword completions based on connection type ──
  const keywordCompletions = useMemo(() => {
    if (!selectedConnection) return SQL_KEYWORDS;
    return selectedConnection.connection_type === 'salesforce' ? SOQL_KEYWORDS : SQL_KEYWORDS;
  }, [selectedConnection]);

  // ── CodeMirror setup ──
  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Destroy existing editor
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    const executeQueryKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        run: () => {
          // We'll trigger execute via a custom DOM event
          editorContainerRef.current?.dispatchEvent(new CustomEvent('cm-execute'));
          return true;
        },
      },
      {
        key: 'Mod-Enter',
        run: () => {
          editorContainerRef.current?.dispatchEvent(new CustomEvent('cm-execute'));
          return true;
        },
      },
    ]);

    const view = new EditorView({
      state: EditorState.create({
        doc: query,
        extensions: [
          // Keymaps
          executeQueryKeymap,
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          history(),

          // SQL syntax highlighting (no schema completions)
          sql({ dialect: StandardSQL, upperCaseKeywords: true }),

          // Keyword-only autocomplete
          autocompletion({
            activateOnTyping: true,
            override: [
              (context: CompletionContext) => {
                const word = context.matchBefore(/\w*/);
                if (!word || (word.from === word.to && !context.explicit)) return null;
                return {
                  from: word.from,
                  options: keywordCompletions,
                  filter: true,
                };
              },
            ],
          }),

          // Appearance (light theme)
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          bracketMatching(),
          highlightSelectionMatches(),
          cmPlaceholder('Enter your query here...'),

          // Update handler
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setQuery(update.state.doc.toString());
            }
          }),

          // Styling — light editor theme
          EditorView.theme({
            '&': {
              minHeight: '150px',
              fontSize: '14px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f8f9fa',
            },
            '.cm-scroller': { overflow: 'auto' },
            '.cm-content': {
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              caretColor: '#4f46e5',
            },
            '&.cm-focused': { outline: '2px solid #4f46e5', outlineOffset: '-2px' },
            '.cm-activeLine': { backgroundColor: '#e8e8ff30' },
            '.cm-selectionBackground, ::selection': { backgroundColor: '#c8c8ff40 !important' },
            '.cm-gutters': {
              backgroundColor: '#f0f0f5',
              borderRight: '1px solid #ddd',
              color: '#999',
            },
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
    // We intentionally only re-create the editor when keywords change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordCompletions]);

  // ── Listen for Ctrl+Enter from CodeMirror ──
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;
    const handler = () => executeQuery();
    container.addEventListener('cm-execute', handler);
    return () => container.removeEventListener('cm-execute', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConnectionId, query]);

  // ── Load connections ──
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
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // ── Select connection & fetch table names only (1 API call) ──
  const selectConnection = useCallback(
    async (connectionId: string) => {
      if (!connectionId) return;
      const conn = connections.find((c) => c.id === connectionId);
      if (!conn) return;

      setSelectedConnectionId(connectionId);
      setResults(null);
      setError('');
      setHasMore(false);
      setCurrentOffset(0);

      // Set default query for this connection type
      const defaultQuery = DEFAULT_QUERIES[conn.connection_type] || 'SELECT 1';
      setQuery(defaultQuery);

      // Update CodeMirror content
      if (editorViewRef.current) {
        const currentDoc = editorViewRef.current.state.doc.toString();
        if (currentDoc !== defaultQuery) {
          editorViewRef.current.dispatch({
            changes: { from: 0, to: currentDoc.length, insert: defaultQuery },
          });
        }
      }

      const toastId = toast.loading(`Connecting to ${conn.display_name}...`);

      try {
        const res = await fetch(`/api/connections/${connectionId}`);
        const data = await res.json();

        if (data.success && data.connection?.healthy) {
          toast.success(`Connected to ${conn.display_name}`, { id: toastId });
        } else {
          toast.error('Connection unhealthy — check credentials', { id: toastId });
        }
      } catch {
        toast.error('Failed to connect', { id: toastId });
      }
    },
    [connections]
  );

  // ── Execute query ──
  const executeQuery = useCallback(async () => {
    if (!selectedConnectionId) {
      toast.error('Please select a connection first.');
      return;
    }
    const currentQuery = editorViewRef.current?.state.doc.toString() || query;
    if (!currentQuery.trim()) {
      toast.error('Please enter a query.');
      return;
    }

    setExecuting(true);
    setError('');
    setResults(null);
    setCurrentOffset(0);
    setHasMore(false);

    try {
      const res = await fetch(`/api/connections/${selectedConnectionId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, limit: PAGE_SIZE, offset: 0 }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Query execution failed.');
      }

      // Normalise — the API may return { columns, rows } or { data: { records } }
      const records = data.rows || data.data?.records || [];
      const totalSize = data.totalSize ?? records.length;

      setResults({ records, totalSize });
      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentOffset(PAGE_SIZE);
      toast.success(`Query executed. ${records.length} records returned.`);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setExecuting(false);
    }
  }, [selectedConnectionId, query]);

  // ── Load more (infinite scroll) ──
  const loadMoreResults = useCallback(async () => {
    if (!selectedConnectionId || !hasMore || loadingMore) return;
    const currentQuery = editorViewRef.current?.state.doc.toString() || query;

    setLoadingMore(true);

    try {
      const res = await fetch(`/api/connections/${selectedConnectionId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, limit: PAGE_SIZE, offset: currentOffset }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load more results.');
      }

      const newRecords = data.rows || data.data?.records || [];

      setResults((prev) => {
        if (!prev) return { records: newRecords, totalSize: data.totalSize ?? newRecords.length };
        return {
          records: [...prev.records, ...newRecords],
          totalSize: data.totalSize ?? prev.totalSize,
        };
      });

      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentOffset((prev) => prev + PAGE_SIZE);
    } catch (err) {
      console.error('Load more failed:', err);
      toast.error('Failed to load more results');
    } finally {
      setLoadingMore(false);
    }
  }, [selectedConnectionId, hasMore, loadingMore, currentOffset, query]);

  // ── IntersectionObserver for infinite scroll ──
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMoreResults]);

  // ── Saved queries ──
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
      const currentQuery = editorViewRef.current?.state.doc.toString() || query;
      const res = await fetch('/api/queries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQueryName, query: currentQuery }),
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
    if (editorViewRef.current) {
      const currentDoc = editorViewRef.current.state.doc.toString();
      editorViewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: savedQuery.query },
      });
    }
    toast.success(`Loaded query: ${savedQuery.name}`);
  };

  // ── Derive page title & description ──
  const pageTitle = useMemo(() => {
    if (!selectedConnection) return 'Query Editor';
    return selectedConnection.connection_type === 'salesforce'
      ? 'SOQL Query Editor'
      : 'SQL Query Editor';
  }, [selectedConnection]);

  const pageDescription = useMemo(() => {
    if (!selectedConnection) return 'Select a connection to start querying.';
    return selectedConnection.connection_type === 'salesforce'
      ? 'Execute SOQL queries against your Salesforce organization.'
      : `Execute SQL queries against ${selectedConnection.display_name}.`;
  }, [selectedConnection]);

  return (
    <Box bg="gray.0" mih="100vh" py="lg" px="md">
      <Container size="xl">
        <Stack gap="lg">
          <OrgHeader
            title={pageTitle}
            description={pageDescription}
            connections={connections}
            connectionsLoading={connectionsLoading}
            selectedConnectionId={selectedConnectionId}
            onSelectConnection={selectConnection}
          />

          {!connectionsLoading && connections.length === 0 && (
            <Alert color="red" title="No Connections">
              No connections found.{' '}
              <Text
                component="a"
                td="underline"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push('/profile')}
              >
                Add one in your profile
              </Text>
            </Alert>
          )}

          {/* Query Editor Section */}
          <Paper radius="lg" p="lg" shadow="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {selectedConnection?.connection_type === 'salesforce' ? 'SOQL' : 'SQL'} Query
                </Text>
                {selectedConnection && (
                  <Badge variant="light" size="sm">
                    {selectedConnection.connection_type}
                  </Badge>
                )}
              </Group>

              {/* CodeMirror Editor */}
              <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
                <div ref={editorContainerRef} />
              </Paper>

              <Group justify="space-between">
                <Group gap="sm">
                  <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    onClick={executeQuery}
                    loading={executing}
                    disabled={!query.trim() || !selectedConnectionId}
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
            <>
              <ResultsTable results={results} />

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <Box ref={sentinelRef} ta="center" py="md">
                  {loadingMore ? (
                    <Group justify="center" gap="sm">
                      <Loader size="sm" />
                      <Text size="sm" c="dimmed">
                        Loading more results...
                      </Text>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Scroll down for more results
                    </Text>
                  )}
                </Box>
              )}
            </>
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
