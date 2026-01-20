'use client';

import { IconX, IconCheck } from '@tabler/icons-react';
import {
  Modal,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  Grid,
  Paper,
  Code,
  Button,
  Box,
  ScrollArea,
  Flex,
  ThemeIcon,
} from '@mantine/core';
import VirtualTable from '@components/VirtualTable';

interface RecordTypeInfo {
  recordTypeId: string;
  name: string;
  master?: boolean;
  available?: boolean;
  defaultRecordTypeMapping?: boolean;
}

interface SupportedScope {
  name: string;
  label: string;
}

interface ChildRelationship {
  childSObject: string;
  field: string;
  relationshipName?: string;
  cascadeDelete?: boolean;
  [key: string]: unknown;
}

interface ObjectDetails {
  label: string;
  name: string;
  keyPrefix?: string;
  custom?: boolean;
  createable?: boolean;
  deletable?: boolean;
  updateable?: boolean;
  queryable?: boolean;
  searchable?: boolean;
  triggerable?: boolean;
  replicateable?: boolean;
  retrieveable?: boolean;
  layoutable?: boolean;
  feedEnabled?: boolean;
  compactLayoutable?: boolean;
  mergeable?: boolean;
  urls?: Record<string, string>;
  recordTypeInfos?: RecordTypeInfo[];
  supportedScopes?: SupportedScope[];
  childRelationships?: ChildRelationship[];
}

interface ObjectDetailsModalProps {
  object: ObjectDetails;
  onClose: () => void;
}

interface BooleanFlagProps {
  label: string;
  value?: boolean;
}

function BooleanFlag({ label, value }: BooleanFlagProps) {
  return (
    <Paper
      p="sm"
      radius="lg"
      withBorder
      bg={value ? 'green.0' : 'gray.0'}
      style={{
        borderColor: value
          ? 'var(--mantine-color-green-2)'
          : 'var(--mantine-color-gray-2)',
      }}
    >
      <Flex justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <ThemeIcon
          size="sm"
          radius="xl"
          variant="light"
          color={value ? 'green' : 'gray'}
        >
          {value ? <IconCheck size={14} /> : <IconX size={14} />}
        </ThemeIcon>
      </Flex>
    </Paper>
  );
}

export default function ObjectDetailsModal({
  object,
  onClose,
}: ObjectDetailsModalProps) {
  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="xl"
      radius="lg"
      title={
        <Group gap="sm">
          <Title order={3}>{object.label}</Title>
          <Badge
            variant="light"
            color={object.custom ? 'blue' : 'gray'}
          >
            {object.custom ? 'Custom Object' : 'Standard Object'}
          </Badge>
        </Group>
      }
      styles={{
        header: {
          background: 'linear-gradient(to right, var(--mantine-color-gray-0), white)',
        },
      }}
    >
      <Stack gap="xs" mb="md">
        <Group gap="md">
          <Code>{object.name}</Code>
          <Text size="sm" c="dimmed">
            Key Prefix:{' '}
            <Text span fw={500} c="dark">
              {object.keyPrefix || 'N/A'}
            </Text>
          </Text>
        </Group>
      </Stack>

      <ScrollArea h={500} offsetScrollbars>
        <Stack gap="xl">
          {/* Object Capabilities */}
          <Box>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
              Object Capabilities
            </Text>
            <Grid>
              <Grid.Col span={3}>
                <BooleanFlag label="Createable" value={object.createable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Deletable" value={object.deletable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Updateable" value={object.updateable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Queryable" value={object.queryable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Searchable" value={object.searchable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Triggerable" value={object.triggerable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Replicateable" value={object.replicateable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Retrieveable" value={object.retrieveable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Layoutable" value={object.layoutable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Feed Enabled" value={object.feedEnabled} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Compact Layout" value={object.compactLayoutable} />
              </Grid.Col>
              <Grid.Col span={3}>
                <BooleanFlag label="Mergeable" value={object.mergeable} />
              </Grid.Col>
            </Grid>
          </Box>

          {/* API Resources */}
          {object.urls && (
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                API Resources
              </Text>
              <Paper withBorder radius="lg" p={0} style={{ overflow: 'hidden' }}>
                <Stack gap={0}>
                  {Object.entries(object.urls).map(([key, url]) => (
                    <Box
                      key={key}
                      p="sm"
                      style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
                    >
                      <Group gap="md">
                        <Text size="sm" fw={600} w={150} tt="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                        <Code style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                          {url}
                        </Code>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          )}

          {/* Record Types */}
          {object.recordTypeInfos && object.recordTypeInfos.length > 0 && (
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Record Types
              </Text>
              <Grid>
                {object.recordTypeInfos.map((rt) => (
                  <Grid.Col key={rt.recordTypeId} span={6}>
                    <Paper withBorder radius="lg" p="md">
                      <Group justify="space-between" mb="xs">
                        <Text fw={600}>{rt.name}</Text>
                        {rt.master && (
                          <Badge size="xs" variant="light" color="yellow">
                            Master
                          </Badge>
                        )}
                      </Group>
                      <Stack gap={4}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            Available:
                          </Text>
                          <Text size="xs" c={rt.available ? 'green' : 'red'}>
                            {rt.available ? 'Yes' : 'No'}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            Default:
                          </Text>
                          <Text
                            size="xs"
                            c={rt.defaultRecordTypeMapping ? 'green' : 'dimmed'}
                          >
                            {rt.defaultRecordTypeMapping ? 'Yes' : 'No'}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            ID:
                          </Text>
                          <Code style={{ fontSize: '0.75rem' }}>{rt.recordTypeId}</Code>
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            </Box>
          )}

          {/* Supported Scopes */}
          {object.supportedScopes && object.supportedScopes.length > 0 && (
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Supported Scopes
              </Text>
              <Flex wrap="wrap" gap="xs">
                {object.supportedScopes.map((scope) => (
                  <Badge
                    key={scope.name}
                    variant="light"
                    color="indigo"
                    size="lg"
                    radius="md"
                  >
                    {scope.label} | {scope.name}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {/* Child Relationships */}
          {object.childRelationships && object.childRelationships.length > 0 && (
            <Box h={400}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Child Relationships
              </Text>
              <VirtualTable
                data={object.childRelationships}
                columns={[
                  { label: 'Child Object', key: 'childSObject', width: '25%' },
                  { label: 'Field', key: 'field', width: '25%' },
                  {
                    label: 'Relationship Name',
                    key: 'relationshipName',
                    width: '25%',
                    render: (item: ChildRelationship) => item.relationshipName || '-',
                  },
                  {
                    label: 'Cascade Delete',
                    key: 'cascadeDelete',
                    width: '25%',
                    render: (item: ChildRelationship) => (
                      <Badge
                        size="sm"
                        variant="light"
                        color={item.cascadeDelete ? 'green' : 'gray'}
                      >
                        {item.cascadeDelete ? 'Yes' : 'No'}
                      </Badge>
                    ),
                  },
                ]}
              />
            </Box>
          )}
        </Stack>
      </ScrollArea>

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
