'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import VirtualTable from './VirtualTable';
import toast from 'react-hot-toast';

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

export default function FieldAnalysisTable({ fields, objectName, token, instanceUrl }: FieldAnalysisTableProps) {
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

  const columns = [
    { label: 'Field Label', key: 'label', width: '15%' },
    { label: 'API Name', key: 'ApiName', width: '15%' },
    { label: 'Type', key: 'type', width: '10%' },
    {
      label: 'Sample Value',
      key: 'sample',
      width: '15%',
      headerRender: () => (
        <HeaderAction
          label="Sample Value"
          onClick={() => fetchAnalysis('sample')}
          loading={loadingMap['sample']}
        />
      ),
      render: (item: Field) => item.sample || '—',
    },
    {
      label: 'Populated',
      key: 'fieldCount',
      width: '10%',
      headerRender: () => (
        <HeaderAction
          label="Populated"
          onClick={() => fetchAnalysis('fieldCount')}
          loading={loadingMap['fieldCount']}
        />
      ),
      render: (item: Field) => (item.fieldCount !== undefined ? item.fieldCount : '—'),
    },
    {
      label: 'Nulls',
      key: 'nullCount',
      width: '10%',
      headerRender: () => (
        <HeaderAction
          label="Nulls"
          onClick={() => fetchAnalysis('nullCount')}
          loading={loadingMap['nullCount']}
        />
      ),
      render: (item: Field) => (item.nullCount !== undefined ? item.nullCount : '—'),
    },
    {
      label: '% Populated',
      key: 'percentPresent',
      width: '10%',
      headerRender: () => (
        <HeaderAction
          label="% Populated"
          onClick={() => fetchAnalysis('percentPresent')}
          loading={loadingMap['percentPresent']}
        />
      ),
      render: (item: Field) => item.percentPresent || '—',
    },
    {
      label: 'Distinct',
      key: 'distinctCount',
      width: '15%',
      headerRender: () => (
        <HeaderAction
          label="Distinct"
          onClick={() => fetchAnalysis('distinctCount')}
          loading={loadingMap['distinctCount']}
        />
      ),
      render: (item: Field) => (item.distinctCount !== undefined ? item.distinctCount : '—'),
    },
  ];

  return (
    <VirtualTable
      data={tableData}
      columns={columns}
      itemSize={50}
      emptyMessage="No fields to analyze."
      className="h-full"
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
      <Text size="sm" fw={600}>{label}</Text>
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
