'use client';

import { useMemo, type ReactNode } from 'react';
import { Box, Title, Text, Select, Badge, Group, Paper, Stack } from '@mantine/core';
import { IconChartDonut } from '@tabler/icons-react';

interface Org {
  instance_url?: string;
  instanceUrl?: string;
  org_name?: string;
  orgName?: string;
}

interface SelectedOrgMeta {
  instanceUrl?: string;
}

interface OrgHeaderProps {
  title: string;
  description: string;
  orgs?: Org[];
  selectedOrgId?: string | null;
  onSelectOrg: (orgId: string) => void;
  orgLoading?: boolean;
  selectedOrgMeta?: SelectedOrgMeta | null;
  children?: ReactNode;
}

export default function OrgHeader({
  title,
  description,
  orgs = [],
  selectedOrgId,
  onSelectOrg,
  orgLoading,
  selectedOrgMeta,
  children,
}: OrgHeaderProps) {
  const activeOrgDisplay = useMemo(() => {
    if (!selectedOrgMeta?.instanceUrl) return null;
    return selectedOrgMeta.instanceUrl
      .replace('https://', '')
      .replace('.my.salesforce.com', '');
  }, [selectedOrgMeta]);

  const orgOptions = useMemo(() => {
    return orgs.map((org) => {
      const iUrl = org.instance_url || org.instanceUrl || '';
      const oName = org.org_name || org.orgName;
      return {
        value: iUrl,
        label: oName && oName !== 'None' ? oName : 'Salesforce Org',
      };
    });
  }, [orgs]);

  return (
    <Paper
      radius="xl"
      p="xl"
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #1d4ed8 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
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
          background: 'rgba(99, 102, 241, 0.2)',
          filter: 'blur(3rem)',
        }}
      />

      <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg" style={{ position: 'relative', zIndex: 1 }}>
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
          <Text size="lg" c="blue.1" fw={500}>
            {description}
          </Text>
          {children && <Box pt="xs">{children}</Box>}
        </Stack>

        {/* Org Switcher */}
        <Stack align="flex-end" gap="sm">
          {/* Status Badge */}
          {activeOrgDisplay ? (
            <Badge
              variant="light"
              color="teal"
              size="lg"
              leftSection={
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--mantine-color-teal-5)',
                    animation: 'pulse 2s infinite',
                  }}
                />
              }
            >
              {activeOrgDisplay}
            </Badge>
          ) : (
            <Badge variant="light" color="gray" size="lg">
              Not Connected
            </Badge>
          )}

          {/* Org Select */}
          <Select
            placeholder={orgLoading ? 'Loading...' : 'Select Organization'}
            data={orgOptions}
            value={selectedOrgId || null}
            onChange={(val) => onSelectOrg(val || '')}
            disabled={orgLoading || !orgs.length}
            w={288}
            radius="md"
            styles={{
              input: {
                backgroundColor: 'white',
                fontWeight: 600,
              },
            }}
          />
        </Stack>
      </Group>
    </Paper>
  );
}
