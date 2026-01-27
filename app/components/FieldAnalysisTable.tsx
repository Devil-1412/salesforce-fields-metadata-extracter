'use client';

import { Button, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import VirtualTable from './VirtualTable';

interface Field {
  ApiName?: string;
  name?: string;
  label?: string;
  type?: string;
  sample?: string;
  fieldCount?: number;
  nullCount?: number;
  percentPresent?: string;
  distinctCount?: number;
  [key: string]: unknown;
}

interface FieldAnalysisTableProps {
  fields: Field[];
  objectName: string;
  token: string;
  instanceUrl: string;
}

interface AnalysisData {
  [fieldName: string]: {
    sample?: string;
    fieldCount?: number;
    nullCount?: number;
    percentPresent?: string;
    distinctCount?: number;
  };
}

interface LoadingMap {
  [type: string]: boolean;
}

type AnalysisType = 'sample' | 'fieldCount' | 'nullCount' | 'percentPresent' | 'distinctCount';

export default function FieldAnalysisTable({
  fields,
  objectName,
  token,
  instanceUrl,
}: FieldAnalysisTableProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});
  const [loadingMap, setLoadingMap] = useState<LoadingMap>({});

  const fetchAnalysis = async (type: AnalysisType) => {
    if (!token || !instanceUrl || !objectName) return;

    setLoadingMap((prev) => ({ ...prev, [type]: true }));
    const toastId = toast.loading(`Calculating ${type}...`);

    try {
      const res = await fetch('/api/fieldAnalysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          instanceUrl,
          objectName,
          type,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setAnalysisData((prev) => {
          const newData = { ...prev };
          Object.entries(data.data).forEach(([fieldName, value]) => {
            newData[fieldName] = { ...newData[fieldName], [type]: value };
          });
          return newData;
        });
        toast.success(`Calculated ${type}`, { id: toastId });
      } else {
        toast.error(data.message || 'Analysis failed', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error calculating ${type}`, { id: toastId });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [type]: false }));
    }
  };

  const tableData = useMemo(() => {
    return fields.map((f) => {
      const fieldName = f.ApiName || f.name || '';
      return {
        ...f,
        ...(analysisData[fieldName] || {}),
      };
    });
  }, [fields, analysisData]);

  const columns = useMemo<any[]>(
    () => [
      { header: 'Field Label', accessorKey: 'label', size: 200 },
      { header: 'API Name', accessorKey: 'ApiName', size: 200 },
      { header: 'Type', accessorKey: 'type', size: 100 },
      {
        header: 'Sample Value',
        accessorKey: 'sample',
        Header: () => (
          <HeaderAction
            label="Sample Value"
            onClick={() => fetchAnalysis('sample')}
            loading={loadingMap['sample']}
          />
        ),
        Cell: ({ row }: { row: { original: Field } }) => row.original.sample || '—',
      },
      {
        header: 'Populated',
        accessorKey: 'fieldCount',
        Header: () => (
          <HeaderAction
            label="Populated"
            onClick={() => fetchAnalysis('fieldCount')}
            loading={loadingMap['fieldCount']}
          />
        ),
        Cell: ({ row }: { row: { original: Field } }) =>
          row.original.fieldCount !== undefined ? row.original.fieldCount : '—',
      },
      {
        header: 'Nulls',
        accessorKey: 'nullCount',
        Header: () => (
          <HeaderAction
            label="Nulls"
            onClick={() => fetchAnalysis('nullCount')}
            loading={loadingMap['nullCount']}
          />
        ),
        Cell: ({ row }: { row: { original: Field } }) =>
          row.original.nullCount !== undefined ? row.original.nullCount : '—',
      },
      {
        header: '% Populated',
        accessorKey: 'percentPresent',
        Header: () => (
          <HeaderAction
            label="% Populated"
            onClick={() => fetchAnalysis('percentPresent')}
            loading={loadingMap['percentPresent']}
          />
        ),
        Cell: ({ row }: { row: { original: Field } }) => row.original.percentPresent || '—',
      },
      {
        header: 'Distinct',
        accessorKey: 'distinctCount',
        Header: () => (
          <HeaderAction
            label="Distinct"
            onClick={() => fetchAnalysis('distinctCount')}
            loading={loadingMap['distinctCount']}
          />
        ),
        Cell: ({ row }: { row: { original: Field } }) =>
          row.original.distinctCount !== undefined ? row.original.distinctCount : '—',
      },
    ],
    [loadingMap]
  );

  return (
    <VirtualTable<any>
      data={tableData}
      columns={columns}
      emptyMessage="No fields to analyze."
      mantineTableContainerProps={{ style: { height: '100%' } }}
    />
  );
}

interface HeaderActionProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

function HeaderAction({ label, onClick, loading }: HeaderActionProps) {
  return (
    <Stack gap={4} align="flex-start">
      <Text size="sm" fw={600}>
        {label}
      </Text>
      <Button
        size="compact-xs"
        variant="light"
        color="white"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={loading}
        loading={loading}
        styles={{
          root: {
            fontSize: '10px',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.05em',
          },
        }}
      >
        Fetch
      </Button>
    </Stack>
  );
}
