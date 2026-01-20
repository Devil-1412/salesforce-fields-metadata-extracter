'use client';

import Link from 'next/link';
import {
  IconArrowRight,
  IconLayersIntersect,
  IconDatabase,
  IconChartBar,
  IconShieldCheck,
  IconBolt,
} from '@tabler/icons-react';
import {
  Container,
  Title,
  Text,
  Button,
  Grid,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  Box,
  Flex,
} from '@mantine/core';
import { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: <IconDatabase size={32} />,
    title: 'Deep Object Analysis',
    desc: 'Explore every field, dependency, and property in your Salesforce objects with precision.',
  },
  {
    icon: <IconLayersIntersect size={32} />,
    title: 'Cross-Org Comparison',
    desc: 'Compare metadata across multiple orgs to identify structural or configuration differences.',
  },
  {
    icon: <IconChartBar size={32} />,
    title: 'Data Insights',
    desc: 'Understand completeness, nulls, and unique values directly from your metadata reports.',
  },
  {
    icon: <IconShieldCheck size={32} />,
    title: 'Secure Salesforce Login',
    desc: 'OAuth 2.0 authentication ensures secure access to your Salesforce environments.',
  },
  {
    icon: <IconBolt size={32} />,
    title: 'Lightning Fast',
    desc: 'Optimized queries and caching mean minimal load times — even for complex metadata.',
  },
  {
    icon: <IconChartBar size={32} />,
    title: 'Export Everything',
    desc: 'Export metadata, validation rules, workflows, and triggers with one click.',
  },
];

export default function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        py={80}
        px="xl"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #e0f2fe 50%, #c7d2fe 100%)',
        }}
      >
        <Container size="lg">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap="xl"
            align="center"
            justify="space-between"
          >
            <Stack gap="lg" style={{ flex: 1 }}>
              <Title order={1} size="3rem" lh={1.2}>
                Simplify Your
                <Text
                  span
                  display="block"
                  style={{
                    background: 'linear-gradient(to right, #2563eb, #4f46e5, #60a5fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Salesforce Metadata
                </Text>
                Analysis
              </Title>
              <Text size="lg" c="dimmed" maw={500}>
                A modern tool to explore, analyze, and compare Salesforce org metadata
                — all in one intuitive dashboard.
              </Text>

              <Group mt="md">
                <Button
                  component={Link}
                  href="/login"
                  size="lg"
                  rightSection={<IconArrowRight size={18} />}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  href="/docs"
                  variant="outline"
                  size="lg"
                >
                  View Documentation
                </Button>
              </Group>
            </Stack>
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        py={80}
        px="xl"
        style={{
          background: 'linear-gradient(180deg, #dbeafe 0%, #e0e7ff 100%)',
        }}
      >
        <Container size="lg">
          <Stack align="center" mb="xl">
            <Title order={2} ta="center">
              Why Choose Us?
            </Title>
            <Text c="dimmed" ta="center" size="lg" maw={600}>
              Designed for developers, admins, and Salesforce professionals who want
              speed, accuracy, and clarity in metadata exploration.
            </Text>
          </Stack>

          <Grid>
            {features.map((feature, i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4 }}>
                <Paper
                  radius="lg"
                  p="xl"
                  shadow="sm"
                  withBorder
                  h="100%"
                  style={{ transition: 'box-shadow 0.2s' }}
                >
                  <Stack align="center" ta="center">
                    <ThemeIcon
                      size={56}
                      radius="lg"
                      variant="light"
                      color="blue"
                    >
                      {feature.icon}
                    </ThemeIcon>
                    <Title order={4}>{feature.title}</Title>
                    <Text c="dimmed" size="sm">
                      {feature.desc}
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        py={80}
        px="xl"
        style={{
          background: 'linear-gradient(to right, #2563eb, #4f46e5)',
        }}
      >
        <Container size="md">
          <Stack align="center">
            <Title order={2} c="white" ta="center">
              Ready to simplify your Salesforce journey?
            </Title>
            <Text c="blue.1" size="lg" ta="center" maw={600}>
              Join thousands of Salesforce professionals using Metadata Extractor to
              gain control and clarity over their orgs.
            </Text>
            <Button
              component={Link}
              href="/login"
              size="lg"
              variant="white"
              color="blue"
              rightSection={<IconArrowRight size={18} />}
            >
              Start for Free
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
