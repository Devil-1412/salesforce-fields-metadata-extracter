'use client';

import SearchableDropdown from '@components/SearchableDropdown';
import { Badge, Button, Group, Paper, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface ValidOrg {
  instanceUrl: string;
  orgName?: string;
}

interface ObjectOption {
  name: string;
  label: string;
}

interface Target {
  orgKey: string;
  objectName: string;
  orgLabel?: string;
}

interface Comparison {
  id: string;
  name: string;
  sourceOrg: string;
  sourceObject: string;
  targets: Target[];
}

interface ComparisonCardProps {
  comparison: Comparison;
  index: number;
  validOrgs: ValidOrg[];
  orgObjectsMap: Record<string, ObjectOption[]>;
  canRemove: boolean;
  onRemove: () => void;
  onNameChange: (name: string) => void;
  onSourceOrgChange: (orgKey: string) => void;
  onSourceObjectChange: (objectName: string) => void;
  onAddTarget: () => void;
  onRemoveTarget: (targetIndex: number) => void;
  onTargetOrgChange: (targetIndex: number, orgKey: string) => void;
  onTargetObjectChange: (targetIndex: number, objectName: string) => void;
}

export default function ComparisonCard({
  comparison,
  index,
  validOrgs,
  orgObjectsMap,
  canRemove,
  onRemove,
  onNameChange,
  onSourceOrgChange,
  onSourceObjectChange,
  onAddTarget,
  onRemoveTarget,
  onTargetOrgChange,
  onTargetObjectChange,
}: ComparisonCardProps) {
  const sourceOptions = orgObjectsMap[comparison.sourceOrg] || [];

  // Deduplicate orgs by instanceUrl to prevent Mantine Select duplicate value errors
  // This allows same org to be selected for both source and target (for comparing different objects within same org)
  const uniqueOrgs = validOrgs.filter(
    (org, index, self) => index === self.findIndex((o) => o.instanceUrl === org.instanceUrl)
  );

  const getOrgLabel = (instanceUrl: string) => {
    const org = validOrgs.find((o) => o.instanceUrl === instanceUrl);
    return org?.orgName !== 'None' ? org?.orgName : instanceUrl.replace('https://', '');
  };

  return (
    <Paper p="md" radius="lg" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            label="Comparison Name"
            value={comparison.name || ''}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={`Comparison ${index + 1}`}
            size="sm"
            style={{ flex: 1, maxWidth: 300 }}
          />
          {canRemove && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<IconTrash size={14} />}
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </Group>

        <Group grow align="flex-start">
          {/* Source Object */}
          <Paper p="md" radius="md" withBorder bg="blue.0">
            <Stack gap="sm">
              <Badge color="blue" variant="light">
                Source Object
              </Badge>
              <Select
                value={comparison.sourceOrg}
                onChange={(val) => val && onSourceOrgChange(val)}
                data={uniqueOrgs.map((org) => ({
                  value: org.instanceUrl,
                  label: getOrgLabel(org.instanceUrl) || org.instanceUrl,
                }))}
                size="sm"
              />
              <SearchableDropdown
                label=""
                options={sourceOptions.map((o) => ({
                  label: `${o.label} (${o.name})`,
                  value: o.name,
                }))}
                value={comparison.sourceObject || ''}
                onChange={(val) => {
                  if (typeof val === 'string') onSourceObjectChange(val);
                }}
                placeholder={sourceOptions.length ? 'Select Source Object' : 'No objects available'}
                disabled={!sourceOptions.length}
              />
            </Stack>
          </Paper>

          {/* Target Objects */}
          <Paper p="md" radius="md" withBorder bg="grape.0">
            <Stack gap="sm">
              <Group justify="space-between">
                <Badge color="grape" variant="light">
                  Target Objects
                </Badge>
                <Button
                  variant="subtle"
                  color="grape"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={onAddTarget}
                  disabled={!uniqueOrgs.length}
                >
                  Add Target
                </Button>
              </Group>

              {comparison.targets.length === 0 ? (
                <Text size="xs" c="dimmed">
                  Map the source object to one or more targets.
                </Text>
              ) : (
                comparison.targets.map((target, targetIdx) => {
                  const targetOptions = orgObjectsMap[target.orgKey] || [];
                  return (
                    <Paper key={targetIdx} p="sm" radius="sm" withBorder>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Select
                            value={target.orgKey}
                            onChange={(val) => val && onTargetOrgChange(targetIdx, val)}
                            data={uniqueOrgs.map((org) => ({
                              value: org.instanceUrl,
                              label: getOrgLabel(org.instanceUrl) || org.instanceUrl,
                            }))}
                            size="xs"
                            style={{ flex: 1 }}
                          />
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => onRemoveTarget(targetIdx)}
                          >
                            Remove
                          </Button>
                        </Group>
                        <SearchableDropdown
                          label=""
                          options={targetOptions.map((o) => ({
                            label: `${o.label} (${o.name})`,
                            value: o.name,
                          }))}
                          value={target.objectName || ''}
                          onChange={(val) => {
                            if (typeof val === 'string') onTargetObjectChange(targetIdx, val);
                          }}
                          placeholder={
                            targetOptions.length ? 'Select Target Object' : 'No objects available'
                          }
                          disabled={!targetOptions.length}
                        />
                      </Stack>
                    </Paper>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Group>
      </Stack>
    </Paper>
  );
}
