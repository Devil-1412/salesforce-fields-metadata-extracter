'use client';

import {
  Paper,
  Text,
  Group,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Anchor,
  UnstyledButton,
} from '@mantine/core';
import {
  IconMessageCircle,
  IconFileText,
  IconHelp,
  IconLifebuoy,
  IconExternalLink,
} from '@tabler/icons-react';

export default function SupportTab() {
  return (
    <Stack gap="lg">
      <div>
        <Text size="xl" fw={700}>
          Support & Help
        </Text>
        <Text size="sm" c="dimmed">
          Get help and contact our support team
        </Text>
      </div>

      {/* Support Cards */}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper
          radius="lg"
          p="lg"
          withBorder
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
            cursor: 'pointer',
          }}
        >
          <Group gap="sm" mb="sm">
            <ThemeIcon size="lg" radius="md" color="blue">
              <IconMessageCircle size={20} />
            </ThemeIcon>
            <Text fw={600}>Contact Support</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Get in touch with our support team for assistance
          </Text>
          <Anchor
            href="mailto:support@salesmeta.ai"
            size="sm"
            fw={500}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            support@salesmeta.ai
            <IconExternalLink size={14} />
          </Anchor>
        </Paper>

        <Paper
          radius="lg"
          p="lg"
          withBorder
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            cursor: 'pointer',
          }}
        >
          <Group gap="sm" mb="sm">
            <ThemeIcon size="lg" radius="md" color="green">
              <IconFileText size={20} />
            </ThemeIcon>
            <Text fw={600}>Documentation</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Browse our comprehensive documentation
          </Text>
          <Anchor
            href="/docs"
            size="sm"
            fw={500}
            c="green"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View Docs
            <IconExternalLink size={14} />
          </Anchor>
        </Paper>

        <Paper
          radius="lg"
          p="lg"
          withBorder
          style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            cursor: 'pointer',
          }}
        >
          <Group gap="sm" mb="sm">
            <ThemeIcon size="lg" radius="md" color="grape">
              <IconHelp size={20} />
            </ThemeIcon>
            <Text fw={600}>FAQs</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Find answers to frequently asked questions
          </Text>
          <Anchor size="sm" fw={500} c="grape" component="button">
            View FAQs
          </Anchor>
        </Paper>

        <Paper
          radius="lg"
          p="lg"
          withBorder
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            cursor: 'pointer',
          }}
        >
          <Group gap="sm" mb="sm">
            <ThemeIcon size="lg" radius="md" color="orange">
              <IconLifebuoy size={20} />
            </ThemeIcon>
            <Text fw={600}>Live Chat</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Chat with our support team in real-time
          </Text>
          <Anchor size="sm" fw={500} c="orange" component="button">
            Start Chat
          </Anchor>
        </Paper>
      </SimpleGrid>

      {/* Quick Help */}
      <Paper radius="lg" p="lg" withBorder>
        <Text fw={600} size="lg" mb="md">
          Quick Help
        </Text>
        <Stack gap="sm">
          <UnstyledButton style={{ width: '100%' }}>
            <Paper p="md" bg="gray.0" radius="md" style={{ cursor: 'pointer' }}>
              <Text fw={500}>How to connect a Salesforce organization?</Text>
              <Text size="sm" c="dimmed">
                Learn how to add and manage your Salesforce orgs
              </Text>
            </Paper>
          </UnstyledButton>
          <UnstyledButton style={{ width: '100%' }}>
            <Paper p="md" bg="gray.0" radius="md" style={{ cursor: 'pointer' }}>
              <Text fw={500}>Troubleshooting connection issues</Text>
              <Text size="sm" c="dimmed">
                Common issues and their solutions
              </Text>
            </Paper>
          </UnstyledButton>
          <UnstyledButton style={{ width: '100%' }}>
            <Paper p="md" bg="gray.0" radius="md" style={{ cursor: 'pointer' }}>
              <Text fw={500}>Understanding metadata extraction</Text>
              <Text size="sm" c="dimmed">
                Learn about our metadata tools
              </Text>
            </Paper>
          </UnstyledButton>
        </Stack>
      </Paper>
    </Stack>
  );
}
