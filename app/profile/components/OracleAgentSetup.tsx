'use client';

import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Center,
  Code,
  CopyButton,
  Grid,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconApple,
  IconBrandWindows,
  IconCheck,
  IconCopy,
  IconDownload,
  IconKey,
  IconServerCog,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Agent {
  id: string;
  name: string;
  status: string;
  last_seen: string;
  version: string;
}

export default function OracleAgentSetup() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const windowsDownloadUrl =
    process.env.NEXT_PUBLIC_ORACLE_AGENT_WINDOWS_URL || '/downloads/OracleAgent-Windows.exe';
  const macDownloadUrl =
    process.env.NEXT_PUBLIC_ORACLE_AGENT_MAC_URL || '/downloads/OracleAgent-Mac.dmg';

  useEffect(() => {
    fetchAgents();
    // Poll agents every 10 seconds to update status
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/agents/generate-token', { method: 'POST' });
      const data = await res.json();
      if (data.pairing_token) {
        setPairingToken(data.pairing_token);
        toast.success('Generated new pairing token');
      } else {
        toast.error('Failed to generate token');
      }
    } catch (err) {
      toast.error('Failed to generate token');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Accordion variant="separated" radius="lg">
      <Accordion.Item value="setup">
        <Accordion.Control>
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconServerCog size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600}>Agent Setup & Pairing</Text>
              <Text size="xs" c="dimmed">
                Download the desktop agent and pair it with your account ({agents.length} active)
              </Text>
            </div>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Grid gutter="xl">
            {/* Download Section */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon color="blue" variant="filled" radius="xl" size="sm">
                      1
                    </ThemeIcon>
                    <Text fw={600}>Download Desktop Agent</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    The agent securely bridges your local Oracle database with the cloud without
                    needing inbound firewall rules.
                  </Text>
                  <Group grow>
                    <Button
                      component="a"
                      href={windowsDownloadUrl}
                      leftSection={<IconBrandWindows size={16} />}
                      variant="default"
                    >
                      Windows
                    </Button>
                    <Button
                      component="a"
                      href={macDownloadUrl}
                      leftSection={<IconApple size={16} />}
                      variant="default"
                    >
                      macOS
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Pairing Section */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon color="blue" variant="filled" radius="xl" size="sm">
                      2
                    </ThemeIcon>
                    <Text fw={600}>Pair Agent</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Generate a token and paste it into the desktop app to securely link it to your
                    account.
                  </Text>

                  {!pairingToken ? (
                    <Button
                      onClick={handleGenerateToken}
                      loading={isGenerating}
                      leftSection={<IconKey size={16} />}
                      variant="light"
                    >
                      Generate Pairing Token
                    </Button>
                  ) : (
                    <Paper withBorder p="xs" radius="sm" bg="white">
                      <Group justify="space-between">
                        <Code color="blue.1" style={{ fontSize: '14px', flex: 1, wordBreak: 'break-all' }}>
                          {pairingToken}
                        </Code>
                        <CopyButton value={pairingToken} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                              <ActionIcon
                                color={copied ? 'teal' : 'gray'}
                                variant="subtle"
                                onClick={copy}
                              >
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Paper>
                  )}
                  {pairingToken && (
                    <Text size="xs" c="orange">
                      Token expires in 10 minutes. Do not share it.
                    </Text>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Connected Agents List */}
            <Grid.Col span={12}>
              <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                  <Text fw={600}>Paired Agents</Text>
                  {agents.length === 0 ? (
                    <Center p="xl">
                      <Text c="dimmed" size="sm">
                        No agents paired yet.
                      </Text>
                    </Center>
                  ) : (
                    <List spacing="sm" size="sm" center>
                      {agents.map((agent) => (
                        <List.Item
                          key={agent.id}
                          icon={
                            <ThemeIcon
                              color={agent.status === 'ONLINE' ? 'teal' : 'red'}
                              size={24}
                              radius="xl"
                              variant="light"
                            >
                              <IconServerCog size={16} />
                            </ThemeIcon>
                          }
                        >
                          <Group justify="space-between" style={{ width: '100%' }}>
                            <div>
                              <Text size="sm" fw={500}>
                                {agent.name || `Agent ${agent.id.substring(0, 8)}...`}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Last seen:{' '}
                                {new Date(agent.last_seen || Date.now()).toLocaleString()}
                              </Text>
                            </div>
                            <Badge variant="outline" color="gray">
                              v{agent.version || '1.0.0'}
                            </Badge>
                          </Group>
                        </List.Item>
                      ))}
                    </List>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
