'use client';

import { Modal, TextInput, Select, Button, Group, Stack } from '@mantine/core';

const FILTER_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'isNull', label: 'Is Null/Empty' },
  { value: 'isNotNull', label: 'Is Not Null/Empty' },
];

interface FilterModalProps {
  opened: boolean;
  onClose: () => void;
  column: string | null;
  filterType: string;
  setFilterType: (type: string) => void;
  filterValue: string;
  setFilterValue: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
  hasExistingFilter: boolean;
}

export default function FilterModal({
  opened,
  onClose,
  column,
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  onApply,
  onRemove,
  hasExistingFilter,
}: FilterModalProps) {
  const needsValue = !['isNull', 'isNotNull'].includes(filterType);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Filter Column: ${column}`}
      centered
    >
      <Stack gap="md">
        <Select
          label="Filter Type"
          value={filterType}
          onChange={(val) => setFilterType(val || 'contains')}
          data={FILTER_TYPES}
        />

        {needsValue && (
          <TextInput
            label="Filter Value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter value..."
            autoFocus
          />
        )}

        <Group justify="space-between" pt="sm">
          <div>
            {hasExistingFilter && (
              <Button
                variant="subtle"
                color="red"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
              >
                Remove Filter
              </Button>
            )}
          </div>
          <Group gap="sm">
            <Button variant="light" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onApply}>Apply Filter</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
