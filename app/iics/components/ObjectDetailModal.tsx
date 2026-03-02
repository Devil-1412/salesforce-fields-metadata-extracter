'use client';

import {
  Badge,
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
  Timeline,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconDatabase,
  IconPlayerPlay,
  IconTarget,
  IconTransform,
  IconVariable,
} from '@tabler/icons-react';
import InfoRow from './InfoRow';

interface ObjectDetailModalProps {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  selectedObject: any;
  objectDetail: any;
}

export default function ObjectDetailModal({
  opened,
  onClose,
  loading,
  selectedObject,
  objectDetail,
}: ObjectDetailModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="md" color="orange" variant="light">
            <IconDatabase size={16} />
          </ThemeIcon>
          <Text fw={400} size="lg">
            {selectedObject?.name || 'Object Details'}
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader color="orange" size="lg" />
            <Text size="sm" c="dimmed">
              Fetching object details...
            </Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          {/* Basic Info Section */}
          <Paper p="md" radius="md" bg="gray.0">
            <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
              Basic Information
            </Text>
            <SimpleGrid cols={2} spacing="xs">
              <InfoRow label="Path" value={objectDetail?.path || selectedObject?.name} />
              <InfoRow
                label="Type"
                value={
                  objectDetail?.type || selectedObject?.schema ? (
                    <Badge variant="light" color="orange" size="sm">
                      {objectDetail?.type || selectedObject?.schema}
                    </Badge>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow label="Object ID" value={objectDetail?.objectId} />
              <InfoRow label="App Context" value={objectDetail?.appContextId} />
            </SimpleGrid>
            {(objectDetail?.description || selectedObject?.comment) && (
              <Box mt="xs">
                <InfoRow
                  label="Description"
                  value={objectDetail?.description || selectedObject?.comment}
                />
              </Box>
            )}
          </Paper>

          {/* Audit Trail */}
          {objectDetail && (objectDetail.createdBy || objectDetail.updatedBy) && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
                  Audit Trail
                </Text>
                <SimpleGrid cols={2} spacing="xs">
                  <InfoRow label="Created By" value={objectDetail.createdBy as string} />
                  <InfoRow
                    label="Created At"
                    value={
                      objectDetail.createTime
                        ? new Date(objectDetail.createTime as string).toLocaleString()
                        : '—'
                    }
                  />
                  <InfoRow label="Updated By" value={objectDetail.updatedBy as string} />
                  <InfoRow
                    label="Updated At"
                    value={
                      objectDetail.updateTime
                        ? new Date(objectDetail.updateTime as string).toLocaleString()
                        : '—'
                    }
                  />
                </SimpleGrid>
              </Paper>
            </>
          )}

          {/* Sources */}
          {objectDetail?.sources && (objectDetail.sources as any[]).length > 0 && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconPlayerPlay size={16} color="var(--mantine-color-green-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Sources ({(objectDetail.sources as any[]).length})
                  </Text>
                </Group>
                <Stack gap="xs">
                  {(objectDetail.sources as any[]).map((src: any, i: number) => (
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
          {objectDetail?.targets && (objectDetail.targets as any[]).length > 0 && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconTarget size={16} color="var(--mantine-color-red-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Targets ({(objectDetail.targets as any[]).length})
                  </Text>
                </Group>
                <Stack gap="xs">
                  {(objectDetail.targets as any[]).map((tgt: any, i: number) => (
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
          {objectDetail?.transformations && (objectDetail.transformations as any[]).length > 0 && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconTransform size={16} color="var(--mantine-color-violet-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Transformations ({(objectDetail.transformations as any[]).length})
                  </Text>
                </Group>
                <Stack gap="xs">
                  {(objectDetail.transformations as any[]).map((tx: any, i: number) => (
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
          {objectDetail?.parameters && (objectDetail.parameters as any[]).length > 0 && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconVariable size={16} color="var(--mantine-color-cyan-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Parameters ({(objectDetail.parameters as any[]).length})
                  </Text>
                </Group>
                <Group gap="xs" wrap="wrap">
                  {(objectDetail.parameters as any[]).map((p: any, i: number) => (
                    <Text key={i} size="xs" fw={400}>
                      {p.name}
                      {p.type ? ` (${p.type})` : ''}
                    </Text>
                  ))}
                </Group>
              </Paper>
            </>
          )}

          {/* Tags */}
          {objectDetail?.tags &&
            Array.isArray(objectDetail.tags) &&
            (objectDetail.tags as any[]).length > 0 && (
              <>
                <Divider />
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
                    Tags
                  </Text>
                  <Group gap="xs">
                    {(objectDetail.tags as any[]).map((tag: any, i: number) => (
                      <Text key={i} size="xs" fw={400}>
                        {typeof tag === 'string' ? tag : tag.name || JSON.stringify(tag)}
                      </Text>
                    ))}
                  </Group>
                </Paper>
              </>
            )}

          {/* Source Control */}
          {objectDetail?.sourceControl && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
                  Source Control
                </Text>
                <Stack gap="xs">
                  {typeof objectDetail.sourceControl === 'object' ? (
                    Object.entries(objectDetail.sourceControl as Record<string, unknown>).map(
                      ([k, v]) => <InfoRow key={k} label={k} value={String(v ?? '—')} />
                    )
                  ) : (
                    <Text size="sm">{String(objectDetail.sourceControl)}</Text>
                  )}
                </Stack>
              </Paper>
            </>
          )}

          {/* Uses (Dependencies) */}
          {objectDetail?.fields && objectDetail.fields.length > 0 && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconArrowRight size={16} color="var(--mantine-color-blue-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Uses ({objectDetail.fields.length})
                  </Text>
                </Group>
                <Timeline
                  active={objectDetail.fields.length - 1}
                  bulletSize={20}
                  lineWidth={2}
                  color="orange"
                >
                  {objectDetail.fields.map((dep: any, i: number) => (
                    <Timeline.Item
                      key={i}
                      bullet={<IconArrowRight size={12} />}
                      title={
                        <Text size="sm" fw={400}>
                          {dep.name}
                        </Text>
                      }
                    >
                      <Group gap="xs" mt={2}>
                        {dep.type && (
                          <Text size="xs" c="dimmed">
                            {dep.type}
                          </Text>
                        )}
                      </Group>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Paper>
            </>
          )}

          {/* Used By (Reverse Dependencies) */}
          {objectDetail?.usedBy && (objectDetail.usedBy as any[]).length > 0 && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconArrowLeft size={16} color="var(--mantine-color-teal-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Used By ({(objectDetail.usedBy as any[]).length})
                  </Text>
                </Group>
                <Timeline
                  active={(objectDetail.usedBy as any[]).length - 1}
                  bulletSize={20}
                  lineWidth={2}
                  color="teal"
                >
                  {(objectDetail.usedBy as any[]).map((dep: any, i: number) => (
                    <Timeline.Item
                      key={i}
                      bullet={<IconArrowLeft size={12} />}
                      title={
                        <Text size="sm" fw={400}>
                          {dep.path}
                        </Text>
                      }
                    >
                      <Group gap="xs" mt={2}>
                        {dep.type && (
                          <Text size="xs" c="dimmed">
                            {dep.type}
                          </Text>
                        )}
                      </Group>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Paper>
            </>
          )}

          {/* No dependencies at all */}
          {objectDetail?.fields &&
            objectDetail.fields.length === 0 &&
            (!objectDetail.usedBy || (objectDetail.usedBy as any[]).length === 0) && (
              <>
                <Divider />
                <Center py="md">
                  <Text size="sm" c="dimmed">
                    No dependencies found for this object.
                  </Text>
                </Center>
              </>
            )}
        </Stack>
      )}
    </Modal>
  );
}
