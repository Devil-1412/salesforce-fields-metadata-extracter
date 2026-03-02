'use client';

import {
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
import { IconCalendarEvent, IconCloud, IconServer, IconUser } from '@tabler/icons-react';
import InfoRow from './InfoRow';

interface RuntimeDetailModalProps {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  selectedRuntime: any;
  runtimeDetail: any;
}

export default function RuntimeDetailModal({
  opened,
  onClose,
  loading,
  selectedRuntime,
  runtimeDetail,
}: RuntimeDetailModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size={32} radius="md" variant="light" color="teal">
            <IconServer size={20} />
          </ThemeIcon>
          <Text fw={400} size="lg">
            {runtimeDetail?.name || selectedRuntime?.name || 'Runtime Environment'}
          </Text>
        </Group>
      }
      size="80%"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Loader color="teal" />
        </Center>
      ) : runtimeDetail ? (
        <Stack gap="lg" pb="xl">
          {/* Header info */}
          <Paper p="md" radius="md" withBorder bg="gray.0">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
              <Box>
                <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={4}>
                  ID
                </Text>
                <Text size="sm" ff="monospace">
                  {runtimeDetail.id || '—'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={4}>
                  Type
                </Text>
                <Text size="sm" fw={400}>
                  {runtimeDetail['@type'] || 'runtimeEnvironment'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={4}>
                  Status
                </Text>
                <Text size="sm" fw={400}>
                  {runtimeDetail.isShared ? 'Shared' : 'Private'}
                </Text>
              </Box>
              {runtimeDetail.description && (
                <Box style={{ gridColumn: '1 / -1' }}>
                  <Text size="xs" c="dimmed" fw={400} tt="uppercase" mb={4}>
                    Description
                  </Text>
                  <Text size="sm">{runtimeDetail.description}</Text>
                </Box>
              )}
            </SimpleGrid>
          </Paper>

          {/* Audit info */}
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Group gap="sm">
              <IconUser size={16} color="var(--mantine-color-gray-5)" />
              <Box>
                <Text size="xs" c="dimmed">
                  Created By
                </Text>
                <Text size="sm" fw={400}>
                  {runtimeDetail.createdBy || '—'}
                </Text>
                <Text size="xs" c="dimmed">
                  {runtimeDetail.createTime
                    ? new Date(runtimeDetail.createTime).toLocaleString()
                    : '—'}
                </Text>
              </Box>
            </Group>
            <Group gap="sm">
              <IconCalendarEvent size={16} color="var(--mantine-color-gray-5)" />
              <Box>
                <Text size="xs" c="dimmed">
                  Updated By
                </Text>
                <Text size="sm" fw={400}>
                  {runtimeDetail.updatedBy || '—'}
                </Text>
                <Text size="xs" c="dimmed">
                  {runtimeDetail.updateTime
                    ? new Date(runtimeDetail.updateTime).toLocaleString()
                    : '—'}
                </Text>
              </Box>
            </Group>
          </SimpleGrid>

          {/* Agents */}
          {runtimeDetail.agents &&
            Array.isArray(runtimeDetail.agents) &&
            runtimeDetail.agents.length > 0 && (
              <>
                <Divider />
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="sm" mb="sm">
                    <IconServer size={16} color="var(--mantine-color-teal-6)" />
                    <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                      Agents ({runtimeDetail.agents.length})
                    </Text>
                  </Group>
                  <Stack gap="sm">
                    {runtimeDetail.agents.map((agent: any, i: number) => (
                      <Paper key={i} p="sm" radius="md" withBorder>
                        <SimpleGrid cols={2} spacing="xs">
                          {agent.name && <InfoRow label="Name" value={agent.name} />}
                          {agent.id && <InfoRow label="ID" value={agent.id} />}
                          {agent.agentVersion && (
                            <InfoRow label="Version" value={agent.agentVersion} />
                          )}
                          {agent.active !== undefined && (
                            <InfoRow label="Active" value={agent.active ? 'Yes' : 'No'} />
                          )}
                          {agent.osPlatform && (
                            <InfoRow label="OS Platform" value={agent.osPlatform} />
                          )}
                          {agent.status && <InfoRow label="Status" value={agent.status} />}
                        </SimpleGrid>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </>
            )}

          {/* Serverless Config */}
          {runtimeDetail.serverlessConfig && (
            <>
              <Divider />
              <Paper p="md" radius="md" bg="gray.0">
                <Group gap="sm" mb="sm">
                  <IconCloud size={16} color="var(--mantine-color-teal-6)" />
                  <Text size="xs" fw={400} c="dimmed" tt="uppercase">
                    Serverless Configuration
                  </Text>
                </Group>
                <SimpleGrid cols={2} spacing="xs">
                  {runtimeDetail.serverlessConfig.platform && (
                    <InfoRow label="Platform" value={runtimeDetail.serverlessConfig.platform} />
                  )}
                  {runtimeDetail.serverlessConfig.applicationType && (
                    <InfoRow
                      label="Application Type"
                      value={runtimeDetail.serverlessConfig.applicationType}
                    />
                  )}
                  {runtimeDetail.serverlessConfig.status && (
                    <InfoRow label="Status" value={runtimeDetail.serverlessConfig.status} />
                  )}
                  {runtimeDetail.serverlessConfig.maxComputeUnits && (
                    <InfoRow
                      label="Max Compute Units"
                      value={runtimeDetail.serverlessConfig.maxComputeUnits}
                    />
                  )}
                  {runtimeDetail.serverlessConfig.executionTimeout && (
                    <InfoRow
                      label="Execution Timeout (mins)"
                      value={runtimeDetail.serverlessConfig.executionTimeout}
                    />
                  )}
                </SimpleGrid>
                {runtimeDetail.serverlessConfig.statusMessage && (
                  <Box mt="xs">
                    <InfoRow
                      label="Status Message"
                      value={runtimeDetail.serverlessConfig.statusMessage}
                    />
                  </Box>
                )}
              </Paper>
            </>
          )}
        </Stack>
      ) : (
        <Center py="xl">
          <Text size="sm" c="dimmed">
            No runtime environment details available.
          </Text>
        </Center>
      )}
    </Modal>
  );
}
