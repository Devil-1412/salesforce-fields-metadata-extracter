'use client';

import { useEffect, useMemo, useState } from 'react';
import { Stack, Group, Box } from '@mantine/core';
import SearchableDropdown from '@components/SearchableDropdown';
import VirtualTable from '@components/VirtualTable';
import FilterBar from '@components/FilterBar';
import FieldDetailsPanel from '@components/FieldDetailsPanel';

interface Field {
  label?: string;
  ApiName?: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
}

interface SalesforceObject {
  name: string;
  label: string;
  keyPrefix?: string;
  [key: string]: unknown;
}

interface FieldsTableProps {
  selectedObject: string;
  selectedObjects: string[];
  fieldsData: Record<string, Field[]>;
  allMetadataKeys: string[];
  objects: SalesforceObject[];
  token: string;
  instanceUrl: string;
}

export default function FieldsTable({
  selectedObject,
  selectedObjects,
  fieldsData,
  allMetadataKeys,
  objects,
  token,
  instanceUrl,
}: FieldsTableProps) {
  const [selectedMetadata, setSelectedMetadata] = useState<string[]>([
    'label',
    'ApiName',
    'type',
    'length',
    'description',
  ]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const fields = fieldsData[selectedObject] || [];

  useEffect(() => {
    setSelectedField(null);
  }, [selectedObject]);

  // Get all unique field types dynamically
  const allTypes = useMemo(
    () => [...new Set(fields.map((f) => f.type).filter(Boolean))] as string[],
    [fields]
  );

  // Filtered fields based on selected types and search term
  const filteredFields = useMemo(() => {
    let result = fields;

    // Filter by type
    if (typeFilter.length > 0) {
      result = result.filter((f) => f.type && typeFilter.includes(f.type));
    }

    // Filter by search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          (f.label && f.label.toLowerCase().includes(lowerTerm)) ||
          (f.ApiName && f.ApiName.toLowerCase().includes(lowerTerm)) ||
          (f.name && f.name.toLowerCase().includes(lowerTerm))
      );
    }

    return result;
  }, [fields, typeFilter, searchTerm]);

  // Construct columns for VirtualTable based on selectedMetadata
  const columns = useMemo(() => {
    const widthPercentage =
      selectedMetadata.length > 0 ? 100 / selectedMetadata.length : 0;
    return selectedMetadata.map((key) => ({
      label: key,
      key: key,
      width: `${widthPercentage}%`,
      render: (item: Field) => {
        const val = item[key];

        if (key === 'label') {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedField(item);
              }}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left block w-full truncate"
            >
              {(val as string) || '—'}
            </button>
          );
        }

        if (val === undefined || val === null || val === '') return '—';
        if (Array.isArray(val)) return val.join(', ');
        return String(val);
      },
    }));
  }, [selectedMetadata]);

  const exportSelectedToCSV = (selectedObjs: string[]) => {
    if (selectedObjs.length === 0) {
      alert('Please select at least one object to export.');
      return;
    }

    const rows: string[] = [];
    const header = ['Object'];
    header.push(...selectedMetadata);
    rows.push(
      header.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',')
    );

    selectedObjs.forEach((obj) => {
      const objFields = fieldsData[obj];
      if (objFields && objFields.length > 0) {
        objFields.forEach((f) => {
          const row: string[] = [obj];
          selectedMetadata.forEach((m) => {
            const value = f[m];
            let formattedValue = '';
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                formattedValue = value.join('; ');
              } else {
                formattedValue = String(value);
              }
            }
            row.push(`"${formattedValue.replace(/"/g, '""')}"`);
          });
          rows.push(row.join(','));
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'fields_metadata.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Stack gap="md" h="100%">
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search fields..."
        >
          <Group>
            <Box w={250}>
              <SearchableDropdown
                label="Metadata Columns"
                options={allMetadataKeys.map((k) => ({ label: k, value: k }))}
                value={selectedMetadata}
                onChange={(val: string | string[]) => setSelectedMetadata(Array.isArray(val) ? val : [val])}
                multiple={true}
                placeholder="Select columns..."
              />
            </Box>

            <Box w={250}>
              <SearchableDropdown
                label="Filter by Field Type"
                options={allTypes.map((t) => ({ label: t, value: t }))}
                value={typeFilter}
                onChange={(val: string | string[]) => setTypeFilter(Array.isArray(val) ? val : [val])}
                multiple={true}
                placeholder="Select types..."
              />
            </Box>
          </Group>
        </FilterBar>

        <Box style={{ flex: 1, minHeight: 0 }}>
          <VirtualTable
            data={filteredFields}
            columns={columns}
            itemSize={50}
            emptyMessage="No fields found matching your criteria."
          />
        </Box>
      </Stack>

      {/* Field Details Panel */}
      {selectedField && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedField(null)}
          />
          <FieldDetailsPanel
            field={selectedField}
            onClose={() => setSelectedField(null)}
            instanceUrl={instanceUrl}
            token={token}
            objectName={selectedObject}
          />
        </>
      )}
    </>
  );
}
