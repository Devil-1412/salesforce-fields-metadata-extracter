import { Badge, Box, Group, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { IconChartDonut } from '@tabler/icons-react';
import { useMemo, type ReactNode } from 'react';

/** Unified connection type — fully provider-agnostic */
export interface Connection {
  id: string;
  connection_type: string; // 'salesforce' | 'snowflake' | 'bigquery' | …
  display_name: string;
  created_at?: string;
  updated_at?: string;
}

/** Colour map for known connection types. Unknown types get a neutral grey. */
const TYPE_STYLE: Record<string, { gradient: string; badge: string }> = {
  salesforce: {
    gradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #1d4ed8 100%)',
    badge: 'blue',
  },
  snowflake: {
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0369a1 100%)',
    badge: 'cyan',
  },
};

const DEFAULT_STYLE = {
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
  badge: 'violet',
};

interface OrgHeaderProps {
  title: string;
  description: string;

  /** All connections for the user — displayed in a single dropdown */
  connections: Connection[];
  connectionsLoading?: boolean;

  /** Currently selected connection ID */
  selectedConnectionId: string | null;
  onSelectConnection: (id: string) => void;

  children?: ReactNode;
}

export default function OrgHeader({
  title,
  description,
  connections = [],
  connectionsLoading,
  selectedConnectionId,
  onSelectConnection,
  children,
}: OrgHeaderProps) {
  /** Grouped dropdown options — connections are visually grouped by type */
  const options = useMemo(() => {
    const groups: Record<string, { value: string; label: string }[]> = {};

    (connections || []).forEach((c) => {
      if (!c) return;
      const type = c.connection_type.charAt(0).toUpperCase() + c.connection_type.slice(1);
      if (!groups[type]) groups[type] = [];
      groups[type].push({
        value: c.id,
        label: c.display_name || 'Untitled',
      });
    });

    return Object.entries(groups).map(([group, items]) => ({
      group,
      items,
    }));
  }, [connections]);

  /** Active connection */
  const activeConnection = useMemo(
    () => (connections || []).find((c) => c?.id === selectedConnectionId) ?? null,
    [connections, selectedConnectionId]
  );

  const style = activeConnection
    ? (TYPE_STYLE[activeConnection.connection_type] ?? DEFAULT_STYLE)
    : DEFAULT_STYLE;

  return (
    <Paper
      radius="xl"
      p="xl"
      style={{
        background: style.gradient,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s ease',
      }}
    >
      {/* Decorative background elements */}
      <Box
        style={{
          position: 'absolute',
          top: '-5rem',
          right: '-5rem',
          width: '20rem',
          height: '20rem',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(3rem)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '-5rem',
          left: '-5rem',
          width: '20rem',
          height: '20rem',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(3rem)',
        }}
      />

      <Group
        justify="space-between"
        align="flex-end"
        wrap="wrap"
        gap="lg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Title Section */}
        <Stack gap="sm" maw={600}>
          <Group gap="sm">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChartDonut size={20} color="white" />
            </Box>
            <Title order={1} size="h2" c="white">
              {title}
            </Title>
          </Group>
          <Text size="lg" c="white" fw={500} opacity={0.9}>
            {description}
          </Text>
          {children && <Box pt="xs">{children}</Box>}
        </Stack>

        {/* Connection Switcher */}
        <Stack align="flex-end" gap="sm">
          {/* Status Badge */}
          {activeConnection ? (
            <Badge
              variant="light"
              color={style.badge}
              size="lg"
              leftSection={
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${style.badge}-5)`,
                    animation: 'pulse 2s infinite',
                  }}
                />
              }
              styles={{
                root: {
                  backgroundColor: 'white',
                  color: `var(--mantine-color-${style.badge}-8)`,
                },
              }}
            >
              {activeConnection.connection_type.toUpperCase()} · {activeConnection.display_name}
            </Badge>
          ) : (
            <Badge
              variant="light"
              color="gray"
              size="lg"
              styles={{ root: { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' } }}
            >
              Not Connected
            </Badge>
          )}

          {/* Single unified dropdown — all types in one list */}
          <Select
            placeholder={
              connectionsLoading
                ? 'Loading…'
                : options.length === 0
                  ? 'No connections available'
                  : 'Select Connection'
            }
            data={options}
            value={selectedConnectionId}
            onChange={(val) => onSelectConnection(val || '')}
            disabled={connectionsLoading || options.length === 0}
            searchable
            w={320}
            radius="md"
            styles={{
              input: {
                backgroundColor: 'white',
                fontWeight: 600,
                color: 'black',
              },
            }}
          />
        </Stack>
      </Group>
    </Paper>
  );
}
