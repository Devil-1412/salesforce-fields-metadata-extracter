'use client';

import {
  Accordion,
  Box,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconArrowRight, IconMap } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import DynamicDetail from './DynamicDetail';

// ── Types ──

interface TaskflowDetailModalProps {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  selectedTaskflow: any;
  taskflowDetail: any;
  /** The connection ID — needed for lazy API calls */
  connectionId: string | null;
}

// ── Component ──

export default function TaskflowDetailModal({
  opened,
  onClose,
  loading,
  selectedTaskflow,
  taskflowDetail,
  connectionId,
}: TaskflowDetailModalProps) {
  // L2 cache: MCT id → { connections, mappings, otherRefs }
  const [mctData, setMctData] = useState<Record<string, any>>({});
  const [mctLoading, setMctLoading] = useState<Record<string, boolean>>({});

  // L3 cache: mapping appContextId → full V2 mapping detail
  const [mappingDetail, setMappingDetail] = useState<Record<string, any>>({});
  const [mappingLoading, setMappingLoading] = useState<Record<string, boolean>>({});

  // ── L2: fetch MCT child references on accordion open ──

  const loadMctRefs = useCallback(
    async (mctId: string) => {
      if (!connectionId || mctData[mctId] || mctLoading[mctId]) return;

      setMctLoading((p) => ({ ...p, [mctId]: true }));
      try {
        const res = await fetch(
          `/api/connections/${connectionId}/mct-references?mctId=${encodeURIComponent(mctId)}`
        );
        const json = await res.json();
        if (json.success) {
          setMctData((p) => ({ ...p, [mctId]: json.data }));
        }
      } catch {
        // silently fail — user can retry by closing/reopening
      } finally {
        setMctLoading((p) => ({ ...p, [mctId]: false }));
      }
    },
    [connectionId, mctData, mctLoading]
  );

  // ── L3: fetch mapping V2 detail on accordion open ──

  const loadMappingDetail = useCallback(
    async (mappingAppCtxId: string) => {
      if (!connectionId || mappingDetail[mappingAppCtxId] || mappingLoading[mappingAppCtxId])
        return;

      setMappingLoading((p) => ({ ...p, [mappingAppCtxId]: true }));
      try {
        const res = await fetch(
          `/api/connections/${connectionId}/mapping-detail?mappingId=${encodeURIComponent(mappingAppCtxId)}`
        );
        const json = await res.json();
        if (json.success) {
          setMappingDetail((p) => ({ ...p, [mappingAppCtxId]: json.data }));
        }
      } catch {
        // silently fail
      } finally {
        setMappingLoading((p) => ({ ...p, [mappingAppCtxId]: false }));
      }
    },
    [connectionId, mappingDetail, mappingLoading]
  );

  // ── Handle MCT accordion change ──

  const handleMctAccordionChange = useCallback(
    (values: string[]) => {
      if (!taskflowDetail?.mappingTasks) return;
      for (const val of values) {
        const idx = parseInt(val.replace('mct-', ''), 10);
        const mct = taskflowDetail.mappingTasks[idx];
        if (mct?.id) loadMctRefs(mct.id);
      }
    },
    [taskflowDetail, loadMctRefs]
  );

  // ── Handle mapping accordion change ──

  const handleMappingAccordionChange = useCallback(
    (mctId: string, values: string[]) => {
      const mct = mctData[mctId];
      if (!mct?.mappings) return;
      for (const val of values) {
        const idx = parseInt(val.replace('mapping-', ''), 10);
        const mapping = mct.mappings[idx];
        if (mapping?.appContextId) loadMappingDetail(mapping.appContextId);
      }
    },
    [mctData, loadMappingDetail]
  );

  // ── Clear cache on close ──

  const handleClose = () => {
    setMctData({});
    setMctLoading({});
    setMappingDetail({});
    setMappingLoading({});
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="md" color="blue" variant="light">
            <IconMap size={16} />
          </ThemeIcon>
          <Text fw={400} size="lg">
            {selectedTaskflow?.path || selectedTaskflow?.name || 'Taskflow Details'}
          </Text>
        </Group>
      }
      size="90%"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader color="blue" size="lg" />
            <Text size="sm" c="dimmed">
              Fetching taskflow references...
            </Text>
          </Stack>
        </Center>
      ) : taskflowDetail ? (
        <Stack gap="md">
          {/* ── Mapping Tasks (L1 → L2 lazy) ── */}
          {taskflowDetail.mappingTasks && taskflowDetail.mappingTasks.length > 0 && (
            <Paper p="md" radius="md" bg="gray.0">
              <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="sm">
                Mapping Tasks ({taskflowDetail.mappingTasks.length})
              </Text>
              <Accordion
                variant="separated"
                radius="md"
                multiple
                onChange={handleMctAccordionChange}
              >
                {taskflowDetail.mappingTasks.map((mct: any, i: number) => (
                  <Accordion.Item key={mct.id || i} value={`mct-${i}`}>
                    <Accordion.Control>
                      <Text size="sm" fw={400}>
                        {mct.path || mct.id}
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="sm">
                        {/* MCT basic info */}
                        <DynamicDetail
                          data={{
                            id: mct.id,
                            appContextId: mct.appContextId,
                            documentType: mct.documentType,
                            lastUpdatedTime: mct.lastUpdatedTime,
                          }}
                        />

                        {/* L2 loading state */}
                        {mctLoading[mct.id] && (
                          <Center py="sm">
                            <Group gap="xs">
                              <Loader size="xs" color="blue" />
                              <Text size="xs" c="dimmed">
                                Loading references...
                              </Text>
                            </Group>
                          </Center>
                        )}

                        {/* L2 data: connections */}
                        {mctData[mct.id]?.connections?.length > 0 && (
                          <Paper p="sm" radius="sm" withBorder>
                            <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="xs">
                              Connections ({mctData[mct.id].connections.length})
                            </Text>
                            <Stack gap={4}>
                              {mctData[mct.id].connections.map((conn: any, ci: number) => (
                                <Text key={ci} size="xs" fw={400}>
                                  {conn.path || conn.id}
                                </Text>
                              ))}
                            </Stack>
                          </Paper>
                        )}

                        {/* L2 data: other refs */}
                        {mctData[mct.id]?.otherRefs?.length > 0 && (
                          <Paper p="sm" radius="sm" withBorder>
                            <Text size="xs" fw={400} c="dimmed" tt="uppercase" mb="xs">
                              Other References ({mctData[mct.id].otherRefs.length})
                            </Text>
                            <Stack gap={4}>
                              {mctData[mct.id].otherRefs.map((ref: any, ri: number) => (
                                <Group key={ri} gap="xs" justify="space-between">
                                  <Text size="xs" fw={400}>
                                    {ref.path || ref.id}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {ref.documentType}
                                  </Text>
                                </Group>
                              ))}
                            </Stack>
                          </Paper>
                        )}

                        {/* L2 → L3: mappings accordion (lazy) */}
                        {mctData[mct.id]?.mappings?.length > 0 && (
                          <>
                            <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                              Mappings ({mctData[mct.id].mappings.length})
                            </Text>
                            <Accordion
                              variant="filled"
                              radius="sm"
                              multiple
                              onChange={(vals) => handleMappingAccordionChange(mct.id, vals)}
                            >
                              {mctData[mct.id].mappings.map((m: any, mi: number) => {
                                const detail = mappingDetail[m.appContextId];
                                console.log('detail', detail);
                                const isLoading = mappingLoading[m.appContextId];

                                return (
                                  <Accordion.Item key={m.id || mi} value={`mapping-${mi}`}>
                                    <Accordion.Control>
                                      <Text size="sm" fw={400}>
                                        {m.path || m.id}
                                      </Text>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                      {isLoading ? (
                                        <Center py="sm">
                                          <Group gap="xs">
                                            <Loader size="xs" color="blue" />
                                            <Text size="xs" c="dimmed">
                                              Loading mapping details...
                                            </Text>
                                          </Group>
                                        </Center>
                                      ) : detail ? (
                                        <Stack gap="md">
                                          <Paper withBorder p="xs" radius="sm">
                                            <Text
                                              size="xs"
                                              c="dimmed"
                                              tt="uppercase"
                                              mb="xs"
                                              fw={400}
                                            >
                                              Mapping Image
                                            </Text>
                                            <Box
                                              style={{
                                                overflow: 'auto',
                                                maxHeight: '400px',
                                                backgroundColor: 'white',
                                              }}
                                            >
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={`/api/connections/${connectionId}/mapping-image?mappingId=${encodeURIComponent(
                                                  m.appContextId
                                                )}&deployed=false`}
                                                alt="Mapping Flow"
                                                style={{ display: 'block', maxWidth: 'none' }}
                                              />
                                            </Box>
                                          </Paper>
                                          <DynamicDetail data={detail} />
                                        </Stack>
                                      ) : (
                                        <Text size="xs" c="dimmed">
                                          Open to load mapping details
                                        </Text>
                                      )}
                                    </Accordion.Panel>
                                  </Accordion.Item>
                                );
                              })}
                            </Accordion>
                          </>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Paper>
          )}

          {/* ── Other References ── */}
          {taskflowDetail.references && taskflowDetail.references.length > 0 && (
            <Paper p="md" radius="md" bg="gray.0">
              <Group gap="xs" mb="sm">
                <IconArrowRight size={16} color="var(--mantine-color-gray-6)" />
                <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                  Other References ({taskflowDetail.references.length})
                </Text>
              </Group>
              <Stack gap="xs">
                {taskflowDetail.references.map((ref: any, i: number) => (
                  <Paper key={ref.id || i} p="sm" radius="sm" withBorder>
                    <Group gap="xs" justify="space-between">
                      <Text size="xs" fw={400}>
                        {ref.path || ref.id}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {ref.documentType}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Empty state */}
          {(!taskflowDetail.mappingTasks || taskflowDetail.mappingTasks.length === 0) &&
            (!taskflowDetail.references || taskflowDetail.references.length === 0) && (
              <Center py="md">
                <Text size="sm" c="dimmed">
                  No references found for this taskflow.
                </Text>
              </Center>
            )}
        </Stack>
      ) : (
        <Center py="xl">
          <Text size="sm" c="dimmed">
            No taskflow details available.
          </Text>
        </Center>
      )}
    </Modal>
  );
}
