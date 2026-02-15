'use client';

import {
  Badge,
  Box,
  CloseButton,
  Code,
  Drawer,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCalendar,
  IconDatabase,
  IconFileText,
  IconInfoCircle,
  IconShield,
  IconUser,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface CreatedByRef {
  Name?: string;
}

interface FieldDetails {
  type?: string;
  DataType?: string;
  custom?: boolean;
  label?: string;
  MasterLabel?: string;
  ApiName?: string;
  DeveloperName?: string;
  name?: string;
  Description?: string;
  description?: string;
  HelpText?: string;
  CreatedBy?: CreatedByRef;
  CreatedDate?: string;
  LastModifiedBy?: CreatedByRef;
  LastModifiedDate?: string;
  length?: number;
  precision?: number;
  scale?: number;
  unique?: boolean;
  externalId?: boolean;
  caseSensitive?: boolean;
  nillable?: boolean;
  firstName?: boolean;
  calculated?: boolean;
  defaultValueFormula?: string;
  calculatedFormula?: string;
  SecurityClassification?: string;
  BusinessStatus?: string;
  ComplianceGroup?: string;
  [key: string]: unknown;
}

interface FieldDetailsPanelProps {
  field: FieldDetails | null;
  onClose: () => void;
  connectionId: string;
  objectName: string;
}

export default function FieldDetailsPanel({
  field,
  onClose,
  connectionId,
  objectName,
}: FieldDetailsPanelProps) {
  const [details, setDetails] = useState<FieldDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/getFieldDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId,
            objectName,
            fieldName: field?.ApiName || field?.name,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setDetails(data.data);
        } else {
          console.warn('Field details fetch failed:', data.error);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (field && connectionId) {
      fetchDetails();
    }
  }, [field, connectionId, objectName]);

  if (!field) return null;

  const displayData: FieldDetails = { ...field, ...details };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <Drawer
      opened={!!field}
      onClose={onClose}
      position="right"
      size="lg"
      title={null}
      padding={0}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.3, blur: 2 }}
    >
      {/* Header */}
      <Box
        px="lg"
        py="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          backgroundColor: 'var(--mantine-color-gray-0)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="xs">
              <Badge color="blue" variant="light" size="sm">
                {displayData.type || displayData.DataType || 'Field'}
              </Badge>
              {displayData.custom && (
                <Badge color="grape" variant="light" size="sm">
                  Custom
                </Badge>
              )}
            </Group>
            <Title order={3}>{displayData.label || displayData.MasterLabel}</Title>
            <Code>{displayData.ApiName || displayData.DeveloperName || displayData.name}</Code>
          </Stack>
          <CloseButton onClick={onClose} />
        </Group>
      </Box>

      {/* Content */}
      <Box p="lg" style={{ overflowY: 'auto', flex: 1 }}>
        <Stack gap="xl">
          {/* Description */}
          <Paper p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
            <Group gap="xs" mb="sm">
              <IconInfoCircle size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600} size="sm" c="blue.9">
                Description
              </Text>
            </Group>
            <Text size="sm" c="gray.7" style={{ whiteSpace: 'pre-wrap' }}>
              {displayData.Description || displayData.description || 'No description provided.'}
            </Text>
            {displayData.HelpText && (
              <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-blue-2)' }}>
                <Text size="xs" fw={700} c="blue.8" mb="xs">
                  HELP TEXT
                </Text>
                <Text size="sm" c="blue.7" fs="italic">
                  "{displayData.HelpText}"
                </Text>
              </Box>
            )}
          </Paper>

          {/* Audit Info */}
          <Box>
            <Group
              gap="xs"
              mb="md"
              pb="sm"
              style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
            >
              <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
              <Text fw={700} size="sm" tt="uppercase">
                Audit Information
              </Text>
            </Group>

            {loading ? (
              <Stack gap="sm">
                <Skeleton height={20} width="75%" />
                <Skeleton height={20} width="50%" />
              </Stack>
            ) : (
              <Stack gap="md">
                <Group gap="md" align="flex-start" wrap="nowrap">
                  <ThemeIcon color="teal" variant="light" size="lg" radius="md">
                    <IconUser size={18} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase">
                      Created By
                    </Text>
                    <Text size="sm" fw={500}>
                      {displayData.CreatedBy?.Name || 'System / Unknown'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(displayData.CreatedDate)}
                    </Text>
                  </Box>
                </Group>

                <Group gap="md" align="flex-start" wrap="nowrap">
                  <ThemeIcon color="orange" variant="light" size="lg" radius="md">
                    <IconFileText size={18} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase">
                      Last Modified By
                    </Text>
                    <Text size="sm" fw={500}>
                      {displayData.LastModifiedBy?.Name || 'System / Unknown'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(displayData.LastModifiedDate)}
                    </Text>
                  </Box>
                </Group>
              </Stack>
            )}
          </Box>

          {/* Technical Details */}
          <Box>
            <Group
              gap="xs"
              mb="md"
              pb="sm"
              style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
            >
              <IconDatabase size={16} color="var(--mantine-color-gray-5)" />
              <Text fw={700} size="sm" tt="uppercase">
                Properties
              </Text>
            </Group>

            <SimpleGrid cols={2} spacing="md">
              <DetailItem label="Length" value={displayData.length} />
              <DetailItem label="Precision" value={displayData.precision} />
              <DetailItem label="Scale" value={displayData.scale} />
              <DetailItem label="Unique" value={displayData.unique} isBool />
              <DetailItem label="External ID" value={displayData.externalId} isBool />
              <DetailItem label="Case Sensitive" value={displayData.caseSensitive} isBool />
              <DetailItem
                label="Required"
                value={!displayData.nillable && !displayData.firstName}
                isBool
              />
              <DetailItem label="Calculated" value={displayData.calculated} isBool />
            </SimpleGrid>

            {displayData.defaultValueFormula && (
              <Box mt="md">
                <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                  Default Formula
                </Text>
                <Code block style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {displayData.defaultValueFormula}
                </Code>
              </Box>
            )}

            {displayData.calculatedFormula && (
              <Box mt="md">
                <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                  Calculated Formula
                </Text>
                <Code block style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {displayData.calculatedFormula}
                </Code>
              </Box>
            )}
          </Box>

          {/* Compliance */}
          {(displayData.SecurityClassification ||
            displayData.BusinessStatus ||
            displayData.ComplianceGroup) && (
            <Box>
              <Group
                gap="xs"
                mb="md"
                pb="sm"
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
              >
                <IconShield size={16} color="var(--mantine-color-gray-5)" />
                <Text fw={700} size="sm" tt="uppercase">
                  Compliance
                </Text>
              </Group>

              <Stack gap="sm">
                {displayData.SecurityClassification && (
                  <BadgeItem
                    label="Security Classification"
                    value={displayData.SecurityClassification}
                    color="red"
                  />
                )}
                {displayData.BusinessStatus && (
                  <BadgeItem
                    label="Business Status"
                    value={displayData.BusinessStatus}
                    color="blue"
                  />
                )}
                {displayData.ComplianceGroup && (
                  <BadgeItem
                    label="Compliance Group"
                    value={displayData.ComplianceGroup}
                    color="grape"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}

interface DetailItemProps {
  label: string;
  value: unknown;
  isBool?: boolean;
}

function DetailItem({ label, value, isBool }: DetailItemProps) {
  if (value === undefined || value === null || value === '') return null;

  return (
    <Box>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      {isBool ? (
        value ? (
          <Text size="sm" c="teal" fw={600}>
            Yes
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            No
          </Text>
        )
      ) : (
        <Text size="sm" fw={500}>
          {String(value)}
        </Text>
      )}
    </Box>
  );
}

interface BadgeItemProps {
  label: string;
  value: string;
  color: string;
}

function BadgeItem({ label, value, color }: BadgeItemProps) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="gray.6">
        {label}
      </Text>
      <Badge color={color} variant="light" size="sm" tt="uppercase">
        {value}
      </Badge>
    </Group>
  );
}
