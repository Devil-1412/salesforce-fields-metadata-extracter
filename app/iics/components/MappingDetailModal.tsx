'use client';

import {
  Accordion,
  Box,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconMap,
  IconPlayerPlay,
  IconTarget,
  IconTransform,
  IconVariable,
} from '@tabler/icons-react';
import InfoRow from './InfoRow';

interface MappingDetailModalProps {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  selectedMapping: any;
  mappingDetail: any;
}

export default function MappingDetailModal({
  opened,
  onClose,
  loading,
  selectedMapping,
  mappingDetail,
}: MappingDetailModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="md" color="blue" variant="light">
            <IconMap size={16} />
          </ThemeIcon>
          <Text fw={400} size="lg">
            {selectedMapping?.name || 'Mapping Details'}
          </Text>
        </Group>
      }
      size="80%"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader color="blue" size="lg" />
            <Text size="sm" c="dimmed">
              Fetching mapping details...
            </Text>
          </Stack>
        </Center>
      ) : mappingDetail ? (
        <Stack gap="md">
          {/* Basic Info */}
          <Paper p="md" radius="md" bg="gray.0">
            <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
              Basic Information
            </Text>
            <SimpleGrid cols={2} spacing="xs">
              <InfoRow label="Name" value={mappingDetail.name} />
              <InfoRow label="Description" value={mappingDetail.description} />
              <InfoRow label="Mapping ID" value={mappingDetail.id} />
              <InfoRow label="Location" value={mappingDetail.location || mappingDetail.path} />
            </SimpleGrid>
          </Paper>

          {/* Audit Trail */}
          {(mappingDetail.createdBy ||
            mappingDetail.updatedBy ||
            mappingDetail.createTime ||
            mappingDetail.updateTime) && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
                  Audit Trail
                </Text>
                <SimpleGrid cols={2} spacing="xs">
                  <InfoRow label="Created By" value={mappingDetail.createdBy} />
                  <InfoRow
                    label="Created At"
                    value={
                      mappingDetail.createTime
                        ? new Date(mappingDetail.createTime).toLocaleString()
                        : '—'
                    }
                  />
                  <InfoRow label="Updated By" value={mappingDetail.updatedBy} />
                  <InfoRow
                    label="Updated At"
                    value={
                      mappingDetail.updateTime
                        ? new Date(mappingDetail.updateTime).toLocaleString()
                        : '—'
                    }
                  />
                </SimpleGrid>
              </Paper>
            </>
          )}

          {/* Sources */}
          {mappingDetail.sources &&
            Array.isArray(mappingDetail.sources) &&
            mappingDetail.sources.length > 0 && (
              <>
                <Divider />
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="sm" mb="sm">
                    <IconPlayerPlay size={16} color="var(--mantine-color-green-6)" />
                    <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                      Sources ({mappingDetail.sources.length})
                    </Text>
                  </Group>
                  <Stack gap="xs">
                    {mappingDetail.sources.map((src: any, i: number) => (
                      <Paper key={i} p="sm" radius="sm" withBorder>
                        <Group gap="sm" justify="space-between">
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              SRC
                            </Text>
                            <Text size="sm" fw={400}>
                              {src.name}
                            </Text>
                          </Group>
                          {src.objectName && (
                            <Text size="xs" c="dimmed">
                              Object: {src.objectName}
                            </Text>
                          )}
                        </Group>
                        {src.connectionRef?.id && (
                          <Text size="xs" c="dimmed" mt={4}>
                            Connection: {src.connectionRef.id}
                          </Text>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </>
            )}

          {/* Targets */}
          {mappingDetail.targets &&
            Array.isArray(mappingDetail.targets) &&
            mappingDetail.targets.length > 0 && (
              <>
                <Divider />
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="sm" mb="sm">
                    <IconTarget size={16} color="var(--mantine-color-red-6)" />
                    <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                      Targets ({mappingDetail.targets.length})
                    </Text>
                  </Group>
                  <Stack gap="xs">
                    {mappingDetail.targets.map((tgt: any, i: number) => (
                      <Paper key={i} p="sm" radius="sm" withBorder>
                        <Group gap="sm" justify="space-between">
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              TGT
                            </Text>
                            <Text size="sm" fw={400}>
                              {tgt.name}
                            </Text>
                          </Group>
                          {tgt.objectName && (
                            <Text size="xs" c="dimmed">
                              Object: {tgt.objectName}
                            </Text>
                          )}
                        </Group>
                        {tgt.connectionRef?.id && (
                          <Text size="xs" c="dimmed" mt={4}>
                            Connection: {tgt.connectionRef.id}
                          </Text>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </>
            )}

          {/* Transformations */}
          {mappingDetail.transformations &&
            Array.isArray(mappingDetail.transformations) &&
            mappingDetail.transformations.length > 0 && (
              <>
                <Divider />
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="sm" mb="sm">
                    <IconTransform size={16} color="var(--mantine-color-violet-6)" />
                    <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                      Transformations ({mappingDetail.transformations.length})
                    </Text>
                  </Group>
                  <Stack gap="xs">
                    {mappingDetail.transformations.map((tx: any, i: number) => (
                      <Paper key={i} p="sm" radius="sm" withBorder>
                        <Group gap="sm" mb={4}>
                          <Text size="xs" c="dimmed">
                            {tx.type || 'Transform'}
                          </Text>
                          <Text size="sm" fw={400}>
                            {tx.name}
                          </Text>
                        </Group>
                        {tx.fields && Array.isArray(tx.fields) && tx.fields.length > 0 && (
                          <Stack gap={4} mt="xs">
                            {tx.fields.map((f: any, j: number) => (
                              <Group key={j} gap="xs" wrap="nowrap">
                                <Text size="xs" fw={400} c="gray.7" miw={120}>
                                  {f.name}
                                </Text>
                                {f.expression && (
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    ff="monospace"
                                    style={{ wordBreak: 'break-all' }}
                                  >
                                    = {f.expression}
                                  </Text>
                                )}
                              </Group>
                            ))}
                          </Stack>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </>
            )}

          {/* Parameters */}
          {mappingDetail.parameters &&
            Array.isArray(mappingDetail.parameters) &&
            mappingDetail.parameters.length > 0 && (
              <>
                <Divider />
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="sm" mb="sm">
                    <IconVariable size={16} color="var(--mantine-color-cyan-6)" />
                    <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                      Parameters ({mappingDetail.parameters.length})
                    </Text>
                  </Group>
                  <Accordion variant="separated" radius="md">
                    {mappingDetail.parameters.map((p: any, i: number) => (
                      <Accordion.Item key={i} value={`param-${i}`}>
                        <Accordion.Control>
                          <Group gap="sm">
                            <Text size="xs" c="dimmed">
                              {p.type || 'param'}
                            </Text>
                            <Text size="sm" fw={400}>
                              {p.name}
                            </Text>
                            {p.label && p.label !== p.name && (
                              <Text size="xs" c="dimmed">
                                ({p.label})
                              </Text>
                            )}
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <SimpleGrid cols={2} spacing="xs">
                            {p.name && <InfoRow label="Name" value={p.name} />}
                            {p.type && <InfoRow label="Type" value={p.type} />}
                            {p.label && <InfoRow label="Label" value={p.label} />}
                            {p.dataType && <InfoRow label="Data Type" value={p.dataType} />}
                            {p.default !== undefined && p.default !== null && p.default !== '' && (
                              <InfoRow label="Default" value={String(p.default)} />
                            )}
                            {p.initialValue !== undefined && p.initialValue !== null && (
                              <InfoRow label="Initial Value" value={String(p.initialValue)} />
                            )}
                            {p.cnxtype && <InfoRow label="Connection Type" value={p.cnxtype} />}
                            {p.logcnx && <InfoRow label="Logical Connection" value={p.logcnx} />}
                            {p.order !== undefined && (
                              <InfoRow label="Display Order" value={String(p.order)} />
                            )}
                            {p.wizstep !== undefined && (
                              <InfoRow label="Wizard Step" value={String(p.wizstep)} />
                            )}
                            <InfoRow label="Visible" value={p.visible === false ? 'No' : 'Yes'} />
                            <InfoRow label="Editable" value={p.editable === false ? 'No' : 'Yes'} />
                            <InfoRow label="Required" value={p.required ? 'Yes' : 'No'} />
                            {p.paramtype && <InfoRow label="Param Type" value={p.paramtype} />}
                          </SimpleGrid>
                          {p.description && (
                            <Box mt="xs">
                              <InfoRow label="Description" value={p.description} />
                            </Box>
                          )}
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Paper>
              </>
            )}
        </Stack>
      ) : (
        <Center py="xl">
          <Text size="sm" c="dimmed">
            No mapping details available.
          </Text>
        </Center>
      )}
    </Modal>
  );
}
