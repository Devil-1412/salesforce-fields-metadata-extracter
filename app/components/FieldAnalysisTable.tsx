'use client';

import {
  Badge,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconAnalyze, IconDatabase, IconGauge, IconHash, IconSlash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import VirtualTable from './VirtualTable';

// ── Types ──

interface Field {
  ApiName?: string;
  name?: string;
  label?: string;
  type?: string;
  [key: string]: unknown;
}

interface FieldAnalysisTableProps {
  fields: Field[];
  objectName: string;
  connectionId: string;
}

interface FieldAnalysisEntry {
  populated: number;
  distinct: number;
  sample: string | null;
}

interface AnalysisResult {
  totalRows: number;
  fields: Record<string, FieldAnalysisEntry>;
}

type AnalyzedField = Field & {
  populated?: number;
  nulls?: number;
  percentPopulated?: number;
  distinct?: number;
  sample?: string | null;
  insight?: string;
};

// ── Insight detection ──

function getInsight(populated: number, distinct: number, totalRows: number): string | undefined {
  if (totalRows === 0) return undefined;
  const pct = (populated / totalRows) * 100;

  if (populated === 0) return 'Unused';
  if (distinct === 1) return 'Constant';
  if (distinct === 2 && pct > 80) return 'Boolean';
  if (distinct > 0 && distinct === populated && pct > 50) return 'Unique';
  if (pct < 10) return 'Sparse';
  return undefined;
}

function getInsightColor(insight: string): string {
  switch (insight) {
    case 'Unused':
      return 'red';
    case 'Constant':
      return 'orange';
    case 'Boolean':
      return 'blue';
    case 'Unique':
      return 'green';
    case 'Sparse':
      return 'yellow';
    default:
      return 'gray';
  }
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return 'green';
  if (pct >= 40) return 'yellow';
  return 'red';
}

// ── Component ──

export default function FieldAnalysisTable({
  fields,
  objectName,
  connectionId,
}: FieldAnalysisTableProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  // ── Fetch all analysis in one call ──
  const runAnalysis = async () => {
    if (!connectionId || !objectName) return;

    setLoading(true);
    const toastId = toast.loading(`Analyzing ${objectName}...`);

    try {
      const res = await fetch(`/api/connections/${connectionId}/field-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectName }),
      });
      const data = await res.json();

      if (data.success) {
        setAnalysisResult(data.data);
        setAnalyzed(true);
        toast.success(`Analysis complete`, { id: toastId });
      } else {
        toast.error(data.error || 'Analysis failed', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error running analysis', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ── Merge field metadata with analysis data ──
  const tableData: AnalyzedField[] = useMemo(() => {
    return fields.map((f) => {
      const fieldName = f.ApiName || f.name || '';
      const entry = analysisResult?.fields?.[fieldName];
      if (!entry || !analysisResult) return { ...f };

      const totalRows = analysisResult.totalRows;
      const populated = entry.populated;
      const nulls = totalRows - populated;
      const percentPopulated = totalRows > 0 ? (populated / totalRows) * 100 : 0;
      const distinct = entry.distinct;
      const insight = getInsight(populated, distinct, totalRows);

      return {
        ...f,
        populated,
        nulls,
        percentPopulated,
        distinct,
        sample: entry.sample,
        insight,
      };
    });
  }, [fields, analysisResult]);

  // ── Summary metrics ──
  const summary = useMemo(() => {
    if (!analysisResult) return null;
    const totalRows = analysisResult.totalRows;
    const totalFields = Object.keys(analysisResult.fields).length;
    const entries = Object.values(analysisResult.fields);
    const emptyFields = entries.filter((e) => e.populated === 0).length;
    const avgUtilization =
      totalFields > 0 && totalRows > 0
        ? entries.reduce((sum, e) => sum + (e.populated / totalRows) * 100, 0) / totalFields
        : 0;
    const avgDistinct =
      totalFields > 0 ? entries.reduce((sum, e) => sum + e.distinct, 0) / totalFields : 0;

    return { totalFields, emptyFields, avgUtilization, avgDistinct, totalRows };
  }, [analysisResult]);

  // ── Table columns ──
  const columns = useMemo<any[]>(
    () => [
      { header: 'Field Label', accessorKey: 'label', size: 160 },
      { header: 'API Name', accessorKey: 'ApiName', size: 180 },
      { header: 'Type', accessorKey: 'type', size: 90 },
      {
        header: 'Completeness',
        accessorKey: 'percentPopulated',
        size: 170,
        Cell: ({ row }: { row: { original: AnalyzedField } }) => {
          const pct = row.original.percentPopulated;
          if (pct === undefined) return <Text c="dimmed">—</Text>;
          return (
            <Group gap={8} wrap="nowrap">
              <Progress
                value={pct}
                color={getProgressColor(pct)}
                size="lg"
                radius="xl"
                style={{ flex: 1, minWidth: 60 }}
              />
              <Text size="xs" fw={600} miw={45} ta="right">
                {pct.toFixed(1)}%
              </Text>
            </Group>
          );
        },
      },
      {
        header: 'Populated',
        accessorKey: 'populated',
        size: 100,
        Cell: ({ row }: { row: { original: AnalyzedField } }) => {
          const val = row.original.populated;
          return val !== undefined ? val.toLocaleString() : '—';
        },
      },
      {
        header: 'Nulls',
        accessorKey: 'nulls',
        size: 100,
        Cell: ({ row }: { row: { original: AnalyzedField } }) => {
          const val = row.original.nulls;
          return val !== undefined ? (
            <Text c={val > 0 ? 'red.4' : 'dimmed'}>{val.toLocaleString()}</Text>
          ) : (
            '—'
          );
        },
      },
      {
        header: 'Distinct',
        accessorKey: 'distinct',
        size: 90,
        Cell: ({ row }: { row: { original: AnalyzedField } }) => {
          const val = row.original.distinct;
          return val !== undefined ? (
            <Badge variant="light" color="blue" size="sm">
              {val.toLocaleString()}
            </Badge>
          ) : (
            '—'
          );
        },
      },
      {
        header: 'Sample',
        accessorKey: 'sample',
        size: 180,
        Cell: ({ row }: { row: { original: AnalyzedField } }) => {
          const val = row.original.sample;
          if (val === undefined) return <Text c="dimmed">—</Text>;
          if (val === null)
            return (
              <Text c="dimmed" fs="italic">
                null
              </Text>
            );
          return (
            <Text size="xs" truncate="end" maw={170} title={val}>
              {val}
            </Text>
          );
        },
      },
      {
        header: 'Insight',
        accessorKey: 'insight',
        size: 100,
        Cell: ({ row }: { row: { original: AnalyzedField } }) => {
          const insight = row.original.insight;
          if (!insight) return null;
          return (
            <Badge variant="dot" color={getInsightColor(insight)} size="sm">
              {insight}
            </Badge>
          );
        },
      },
    ],
    []
  );

  return (
    <Stack pos="relative" gap="md">
      <LoadingOverlay
        visible={loading}
        overlayProps={{ blur: 2, backgroundOpacity: 0.3 }}
        loaderProps={{ type: 'bars', size: 'lg' }}
      />

      {/* Analyze button */}
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          {analyzed
            ? `Showing analysis for ${objectName} (${summary?.totalRows?.toLocaleString() ?? 0} rows)`
            : `Click "Analyze Object" to fetch field-level metrics for ${objectName}`}
        </Text>
        <Button
          leftSection={<IconAnalyze size={16} />}
          onClick={runAnalysis}
          loading={loading}
          variant={analyzed ? 'light' : 'filled'}
          size="sm"
        >
          {analyzed ? 'Re-Analyze' : 'Analyze Object'}
        </Button>
      </Group>

      {/* Summary cards */}
      {summary && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          <SummaryCard
            icon={<IconDatabase size={18} />}
            label="Total Fields"
            value={summary.totalFields}
            color="blue"
          />
          <SummaryCard
            icon={<IconSlash size={18} />}
            label="Empty Fields"
            value={summary.emptyFields}
            color={summary.emptyFields > 0 ? 'red' : 'green'}
          />
          <SummaryCard
            icon={<IconGauge size={18} />}
            label="Avg Utilization"
            value={`${summary.avgUtilization.toFixed(1)}%`}
            color={summary.avgUtilization >= 60 ? 'green' : 'yellow'}
          />
          <SummaryCard
            icon={<IconHash size={18} />}
            label="Avg Distinct"
            value={Math.round(summary.avgDistinct).toLocaleString()}
            color="violet"
          />
        </SimpleGrid>
      )}

      {/* Data table */}
      <VirtualTable<any>
        data={tableData}
        columns={columns}
        emptyMessage={analyzed ? 'No fields found.' : 'Click "Analyze Object" to get started.'}
        mantineTableContainerProps={{ style: { height: '100%' } }}
      />
    </Stack>
  );
}

// ── Summary Card ──

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Paper p="sm" radius="md" withBorder>
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          {icon}
        </ThemeIcon>
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lh={1.2}>
            {label}
          </Text>
          <Text size="lg" fw={700} lh={1.2}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
        </Box>
      </Group>
    </Paper>
  );
}
