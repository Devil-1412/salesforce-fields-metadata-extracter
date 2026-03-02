'use client';

import {
  Accordion,
  Box,
  Checkbox,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import React, { useState } from 'react';

// ── Key formatting ──

/** Convert camelCase / snake_case keys to readable "Title Case" headers */
function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ── Hidden / internal keys we skip ──

const SKIP_KEYS = new Set(['@type', '@context', '@id']);

// ── Value classification ──

function isPrimitive(v: unknown): v is string | number | boolean {
  return v !== null && v !== undefined && typeof v !== 'object';
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null;
}

function isArrayOfPrimitives(v: unknown): v is (string | number | boolean)[] {
  return Array.isArray(v) && v.length > 0 && isPrimitive(v[0]);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Pick a short display label for an array item */
function itemLabel(item: Record<string, unknown>, index: number): string {
  for (const k of ['name', 'label', 'path', 'id', 'title']) {
    if (item[k] && typeof item[k] === 'string') return item[k] as string;
  }
  return `Item ${index + 1}`;
}

// ── Components ──

/** Renders a single key-value row */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={2}>
        {label}
      </Text>
      <Text size="sm" fw={400} style={{ wordBreak: 'break-all' }}>
        {value || '—'}
      </Text>
    </Box>
  );
}

/** Renders all primitive fields of an object in a 2-column grid */
function PrimitiveFields({
  data,
  showBooleans,
}: {
  data: Record<string, unknown>;
  showBooleans: boolean;
}) {
  const primitives = Object.entries(data).filter(
    ([k, v]) =>
      !SKIP_KEYS.has(k) &&
      isPrimitive(v) &&
      v !== '' &&
      v !== null &&
      (showBooleans || typeof v !== 'boolean')
  );

  if (primitives.length === 0) return null;

  return (
    <SimpleGrid cols={2} spacing="xs">
      {primitives.map(([key, val]) => {
        let display = String(val);
        // Format dates
        if (
          typeof val === 'string' &&
          (key.toLowerCase().includes('time') || key.toLowerCase().includes('date'))
        ) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) display = d.toLocaleString();
        }
        // Format booleans
        if (typeof val === 'boolean') display = val ? 'Yes' : 'No';

        return <DetailRow key={key} label={toLabel(key)} value={display} />;
      })}
    </SimpleGrid>
  );
}

/** Renders an array of primitives as a comma-list */
function PrimitiveList({ label, items }: { label: string; items: (string | number | boolean)[] }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={4}>
        {label} ({items.length})
      </Text>
      <Text size="sm" fw={400} style={{ wordBreak: 'break-all' }}>
        {items.map(String).join(', ')}
      </Text>
    </Box>
  );
}

/** Renders an array of objects as an accordion */
function ObjectList({
  label,
  items,
  depth,
  showBooleans,
}: {
  label: string;
  items: Record<string, unknown>[];
  depth: number;
  showBooleans: boolean;
}) {
  return (
    <Box>
      <Group gap="xs" mb="xs">
        <Text size="xs" c="dimmed" fw={400} tt="uppercase">
          {label} ({items.length})
        </Text>
      </Group>
      <Accordion variant={depth === 0 ? 'separated' : 'filled'} radius={depth === 0 ? 'md' : 'sm'}>
        {items.map((item, i) => (
          <Accordion.Item key={i} value={`${label}-${i}`}>
            <Accordion.Control>
              <Text size="sm" fw={400}>
                {itemLabel(item, i)}
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <DynamicDetail data={item} depth={depth + 1} showBooleans={showBooleans} />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Box>
  );
}

/** Renders a nested object as a bordered section */
function NestedObject({
  label,
  data,
  depth,
  showBooleans,
}: {
  label: string;
  data: Record<string, unknown>;
  depth: number;
  showBooleans: boolean;
}) {
  return (
    <Paper p="sm" radius="sm" withBorder>
      <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb="xs">
        {label}
      </Text>
      <DynamicDetail data={data} depth={depth + 1} showBooleans={showBooleans} />
    </Paper>
  );
}

// ── Main exported component ──

interface DynamicDetailProps {
  data: Record<string, unknown>;
  depth?: number;
  showBooleans?: boolean;
}

/**
 * Generic recursive renderer for any API response object.
 *
 * Inspects each field's value type and renders accordingly:
 * - string / number / boolean → key-value row in a 2-col grid
 * - array of primitives → comma-separated list
 * - array of objects → accordion with nested DynamicDetail
 * - nested object → bordered section with nested DynamicDetail
 * - null / undefined / empty → skipped
 */
export default function DynamicDetail({
  data,
  depth = 0,
  showBooleans: inheritedShowBooleans,
}: DynamicDetailProps) {
  const [localShowBooleans, setLocalShowBooleans] = useState(false);

  if (!data || typeof data !== 'object') return null;

  const showBooleans = depth === 0 ? localShowBooleans : !!inheritedShowBooleans;

  const entries = Object.entries(data).filter(([k]) => !SKIP_KEYS.has(k));

  // Separate primitives from complex fields
  const complexEntries = entries.filter(
    ([, v]) => !isPrimitive(v) && v !== null && v !== undefined && v !== ''
  );

  return (
    <Stack gap="sm">
      {depth === 0 && (
        <Checkbox
          label="Show more details (booleans)"
          checked={localShowBooleans}
          onChange={(event) => setLocalShowBooleans(event.currentTarget.checked)}
          size="xs"
        />
      )}

      {/* All primitive fields in a grid */}
      <PrimitiveFields data={data} showBooleans={showBooleans} />

      {/* Complex fields — each gets its own section */}
      {complexEntries.map(([key, val]) => {
        // Empty arrays
        if (Array.isArray(val) && val.length === 0) return null;

        // Array of objects → accordion
        if (isArrayOfObjects(val)) {
          return (
            <React.Fragment key={key}>
              {depth === 0 && <Divider />}
              <ObjectList
                label={toLabel(key)}
                items={val}
                depth={depth}
                showBooleans={showBooleans}
              />
            </React.Fragment>
          );
        }

        // Array of primitives → list
        if (isArrayOfPrimitives(val)) {
          return (
            <React.Fragment key={key}>
              {depth === 0 && <Divider />}
              <PrimitiveList label={toLabel(key)} items={val} />
            </React.Fragment>
          );
        }

        // Nested object
        if (isPlainObject(val)) {
          // Skip empty objects
          const objEntries = Object.entries(val).filter(
            ([, v]) => v !== null && v !== undefined && v !== ''
          );
          if (objEntries.length === 0) return null;

          return (
            <React.Fragment key={key}>
              {depth === 0 && <Divider />}
              <NestedObject
                label={toLabel(key)}
                data={val}
                depth={depth}
                showBooleans={showBooleans}
              />
            </React.Fragment>
          );
        }

        return null;
      })}
    </Stack>
  );
}
