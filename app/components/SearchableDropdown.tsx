'use client';

import { useState, useMemo } from 'react';
import { Select, MultiSelect, ComboboxItem } from '@mantine/core';

interface Option {
  value: string;
  label?: string;
}

interface SearchableDropdownProps {
  options?: (Option | string)[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function SearchableDropdown({
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Select...',
  label = '',
  disabled = false,
}: SearchableDropdownProps) {
  // Normalize options to ComboboxItem format
  const normalizedOptions: ComboboxItem[] = useMemo(() => {
    return options.map((option) => {
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      return {
        value: option.value,
        label: option.label || option.value,
      };
    });
  }, [options]);

  if (multiple) {
    return (
      <MultiSelect
        label={label || undefined}
        placeholder={placeholder}
        data={normalizedOptions}
        value={Array.isArray(value) ? value : []}
        onChange={(val) => onChange(val)}
        searchable
        clearable
        disabled={disabled}
        styles={{
          input: {
            backgroundColor: 'white',
          },
        }}
      />
    );
  }

  return (
    <Select
      label={label || undefined}
      placeholder={placeholder}
      data={normalizedOptions}
      value={typeof value === 'string' ? value : null}
      onChange={(val) => onChange(val || '')}
      searchable
      clearable
      disabled={disabled}
      styles={{
        input: {
          backgroundColor: 'white',
        },
      }}
    />
  );
}

