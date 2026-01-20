'use client';

import { SegmentedControl } from '@mantine/core';

interface FilterOption {
  key: string;
  label: string;
}

interface ObjectFilterProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  options: FilterOption[];
}

export default function ObjectFilter({
  filter,
  onFilterChange,
  options,
}: ObjectFilterProps) {
  return (
    <SegmentedControl
      value={filter}
      onChange={onFilterChange}
      data={options.map((opt) => ({ value: opt.key, label: opt.label }))}
      radius="lg"
    />
  );
}
