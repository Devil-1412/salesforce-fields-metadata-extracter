'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import {
  IconBook,
  IconLayersIntersect,
  IconDatabase,
  IconSettings,
  IconFileText,
} from '@tabler/icons-react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Anchor,
  Box,
  ThemeIcon,
  NavLink,
  Code,
  List,
} from '@mantine/core';

interface DocSection {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

export default function DocsPage() {
  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <IconBook size={18} />,
      content: (
        <Stack gap="sm">
          <Text>
            Welcome to the <strong>Salesforce Metadata Extractor</strong> documentation!
            This guide will help you connect your Salesforce org, analyze metadata, and
            export results seamlessly.
          </Text>
          <List type="ordered" spacing="xs">
            <List.Item>Sign in and connect your Salesforce org securely via OAuth.</List.Item>
            <List.Item>Navigate to the <strong>Object & Fields</strong> section.</List.Item>
            <List.Item>Select objects to explore their metadata details.</List.Item>
            <List.Item>Export results in CSV or JSON formats.</List.Item>
          </List>
        </Stack>
      ),
    },
    {
      id: 'object-analysis',
      title: 'Object & Field Analysis',
      icon: <IconDatabase size={18} />,
      content: (
        <Stack gap="sm">
          <Text>
            The <strong>Object & Field Analysis</strong> tool allows you to explore every
            field&apos;s metadata including data type, length, dependencies, and relationships.
          </Text>
          <List spacing="xs">
            <List.Item>Supports all standard and custom objects.</List.Item>
            <List.Item>Visual filters by type (Lookup, Text, Number, etc.).</List.Item>
            <List.Item>Export complete metadata with field-level statistics.</List.Item>
          </List>
        </Stack>
      ),
    },
    {
      id: 'compare-orgs',
      title: 'Compare Orgs',
      icon: <IconLayersIntersect size={18} />,
      content: (
        <Stack gap="sm">
          <Text>
            Use the <strong>Compare Orgs</strong> feature to analyze differences between
            two Salesforce environments.
          </Text>
          <List spacing="xs">
            <List.Item>Compare object structures, fields, and validation rules.</List.Item>
            <List.Item>Identify metadata mismatches instantly.</List.Item>
            <List.Item>Export comparison results for audit documentation.</List.Item>
          </List>
        </Stack>
      ),
    },
    {
      id: 'workflows-triggers',
      title: 'Workflows & Triggers',
      icon: <IconSettings size={18} />,
      content: (
        <Stack gap="sm">
          <Text>
            Gain visibility into <strong>Workflows</strong>, <strong>Validation Rules</strong>,
            and <strong>Apex Triggers</strong> for every object.
          </Text>
          <List spacing="xs">
            <List.Item>Filter by object or rule type.</List.Item>
            <List.Item>Quickly identify active or deprecated rules.</List.Item>
            <List.Item>Export trigger logic or formulas for review.</List.Item>
          </List>
        </Stack>
      ),
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <IconFileText size={18} />,
      content: (
        <Stack gap="sm">
          <Text>
            You can also integrate the Metadata Extractor via APIs to automate your data
            analysis.
          </Text>
          <Text>Example API call:</Text>
          <Code block>
{`POST /api/fields
{
  "accessToken": "YOUR_ACCESS_TOKEN",
  "instanceUrl": "https://your-instance.salesforce.com",
  "objects": ["Account", "Contact"]
}`}
          </Code>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
      }}
    >
      <Box style={{ display: 'flex' }}>
        {/* Sidebar */}
        <Box
          component="aside"
          visibleFrom="md"
          style={{
            width: 260,
            backgroundColor: 'white',
            borderRight: '1px solid var(--mantine-color-gray-2)',
            padding: '1.5rem',
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Stack gap="xs">
            <Title order={4} c="blue.7" mb="sm">
              Documentation
            </Title>
            {sections.map((sec) => (
              <NavLink
                key={sec.id}
                component="a"
                href={`#${sec.id}`}
                label={sec.title}
                leftSection={
                  <ThemeIcon size="sm" variant="light" color="blue">
                    {sec.icon}
                  </ThemeIcon>
                }
              />
            ))}
          </Stack>

          <Text size="xs" c="dimmed" style={{ borderTop: '1px solid var(--mantine-color-gray-2)', paddingTop: '1rem' }}>
            © {new Date().getFullYear()} Salesforce Metadata Extractor
          </Text>
        </Box>

        {/* Main Content */}
        <Box component="main" style={{ flex: 1 }} p="xl">
          <Container size="md">
            <Stack gap="xl">
              <Stack align="center" ta="center">
                <Title order={1} c="blue.7">
                  Documentation
                </Title>
                <Text c="dimmed" size="lg">
                  Learn how to use and integrate the Salesforce Metadata Extractor efficiently.
                </Text>
              </Stack>

              {sections.map((sec) => (
                <Paper
                  key={sec.id}
                  id={sec.id}
                  radius="lg"
                  p="lg"
                  shadow="sm"
                  withBorder
                  style={{ scrollMarginTop: 80 }}
                >
                  <Group gap="xs" mb="md">
                    <ThemeIcon size="lg" variant="light" color="blue">
                      {sec.icon}
                    </ThemeIcon>
                    <Title order={3}>{sec.title}</Title>
                  </Group>
                  {sec.content}
                </Paper>
              ))}

              <Stack align="center" mt="xl">
                <Button component={Link} href="/login" size="md">
                  Get Started →
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
