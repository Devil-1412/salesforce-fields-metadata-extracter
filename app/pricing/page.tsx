'use client';

import Link from 'next/link';
import {
  IconCircleCheck,
  IconBolt,
  IconShield,
  IconStar,
} from '@tabler/icons-react';
import {
  Container,
  Title,
  Text,
  Grid,
  Paper,
  Stack,
  Group,
  Button,
  List,
  Badge,
  Box,
} from '@mantine/core';
import { ReactNode } from 'react';

interface Plan {
  name: string;
  price: string;
  description: string;
  icon: ReactNode;
  features: string[];
  cta: string;
  highlight: boolean;
}

interface Stat {
  value: string;
  label: string;
  detail: string;
}

interface Highlight {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function PricingPage() {
  const plans: Plan[] = [
    {
      name: 'Free',
      price: '$0',
      description: 'Explore metadata with basic exports and single org access.',
      icon: <IconStar size={24} color="var(--mantine-color-blue-5)" />,
      features: [
        'Connect 1 Salesforce Org',
        'View Object & Field Metadata',
        'Export Metadata as CSV',
        'Basic Email Support',
      ],
      cta: 'Start for Free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$899 /mo',
      description: 'Advanced insights, comparisons, and automation-ready exports.',
      icon: <IconBolt size={24} color="var(--mantine-color-yellow-5)" />,
      features: [
        'Connect up to 3 Salesforce Orgs',
        'Compare Objects & Fields across orgs',
        'Field Data Insights (Null %, Distinct Count)',
        'Access Validation Rules, Workflows & Triggers',
        'Priority Email Support',
      ],
      cta: 'Upgrade to Pro',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Built for large teams that need dedicated infrastructure.',
      icon: <IconShield size={24} color="var(--mantine-color-indigo-5)" />,
      features: [
        'Unlimited Org Connections',
        'Dedicated Infrastructure',
        'Team Collaboration Access',
        'Custom Integrations & Reports',
        '24/7 Dedicated Support',
      ],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  const stats: Stat[] = [
    { value: '520+', label: 'Orgs analyzed', detail: 'Last 30 days' },
    { value: '320K', label: 'Field snapshots', detail: 'Every month' },
    { value: '98%', label: 'Users rate it', detail: 'Ease of insights' },
  ];

  const highlights: Highlight[] = [
    {
      title: 'Clear compliance posture',
      description:
        'Track encrypted, restricted, and sensitive fields without guessing.',
      icon: <IconShield size={20} color="var(--mantine-color-indigo-5)" />,
    },
    {
      title: 'Automation-ready exports',
      description: 'Build CSV exports that feed reporting and migration workflows.',
      icon: <IconBolt size={20} color="var(--mantine-color-yellow-5)" />,
    },
    {
      title: 'Trusted by teams',
      description:
        'Share dashboards, rule libraries, and comparisons with collaborators.',
      icon: <IconCircleCheck size={20} color="var(--mantine-color-blue-5)" />,
    },
  ];

  return (
    <Box bg="dark.9" style={{ minHeight: '100vh' }} py="xl" px="md">
      <Container size="lg">
        <Stack gap="xl">
          {/* Hero */}
          <Paper
            radius="xl"
            p="xl"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1e293b 50%, #4338ca 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Stack gap="xs">
              <Text size="xs" tt="uppercase" lts={3} c="blue.2">
                Salesforce Insights
              </Text>
              <Title order={1} c="white" size="2.5rem">
                Simple pricing, unlimited clarity.
              </Title>
              <Text c="blue.1" size="lg" maw={600}>
                Unlock Salesforce metadata intelligence, see field health, and share
                automation-ready exports with your team, without surprises.
              </Text>

              <Grid mt="md">
                {stats.map((stat) => (
                  <Grid.Col key={stat.label} span={{ base: 12, md: 4 }}>
                    <Paper
                      radius="lg"
                      p="md"
                      bg="rgba(255,255,255,0.05)"
                      style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <Text size="1.5rem" fw={600} c="white">
                        {stat.value}
                      </Text>
                      <Text size="sm" c="blue.1">
                        {stat.label}
                      </Text>
                      <Text size="xs" c="blue.2">
                        {stat.detail}
                      </Text>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          </Paper>

          {/* Plans */}
          <Stack gap="md">
            <Group justify="space-between" align="flex-end">
              <Stack gap={4}>
                <Text size="xs" tt="uppercase" lts={3} c="blue.4">
                  Plans
                </Text>
                <Title order={2} c="white">
                  Pick the experience you need
                </Title>
                <Text c="gray.4">
                  All plans share the same modern interface, fast exports, and
                  responsive support.
                </Text>
              </Stack>
              <Text size="xs" c="gray.5">
                Prices shown in USD. Need a customized deployment? Contact sales.
              </Text>
            </Group>

            <Grid>
              {plans.map((plan) => (
                <Grid.Col key={plan.name} span={{ base: 12, md: 4 }}>
                  <Paper
                    radius="xl"
                    p="lg"
                    h="100%"
                    style={{
                      background: plan.highlight
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))'
                        : 'rgba(255,255,255,0.05)',
                      border: plan.highlight
                        ? '1px solid var(--mantine-color-blue-4)'
                        : '1px solid var(--mantine-color-dark-4)',
                      color: plan.highlight
                        ? 'var(--mantine-color-dark-9)'
                        : 'white',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Stack gap="sm" style={{ flex: 1 }}>
                      <Group gap="sm">
                        {plan.icon}
                        <Text size="xl" fw={600}>
                          {plan.name}
                        </Text>
                        {plan.highlight && (
                          <Badge size="sm" variant="light" color="blue">
                            Most popular
                          </Badge>
                        )}
                      </Group>

                      <Text
                        size="2rem"
                        fw={700}
                        c={plan.highlight ? 'blue.9' : 'white'}
                      >
                        {plan.price}
                      </Text>
                      <Text size="xs" tt="uppercase" lts={2} c="gray.5">
                        {plan.highlight ? 'Billed Monthly' : 'Flexible plan'}
                      </Text>

                      <Text c={plan.highlight ? 'dark.6' : 'gray.4'} size="sm">
                        {plan.description}
                      </Text>

                      <List
                        spacing="xs"
                        icon={
                          <IconCircleCheck
                            size={18}
                            color={
                              plan.highlight
                                ? 'var(--mantine-color-blue-6)'
                                : 'var(--mantine-color-gray-5)'
                            }
                          />
                        }
                        style={{ flex: 1 }}
                      >
                        {plan.features.map((feature) => (
                          <List.Item key={feature}>
                            <Text size="sm">{feature}</Text>
                          </List.Item>
                        ))}
                      </List>

                      <Button
                        component={Link}
                        href={plan.highlight ? '/login' : '/'}
                        fullWidth
                        radius="lg"
                        variant={plan.highlight ? 'filled' : 'default'}
                        color={plan.highlight ? 'blue' : 'dark'}
                      >
                        {plan.cta}
                      </Button>
                    </Stack>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>

          {/* Highlights */}
          <Paper
            radius="xl"
            p="xl"
            bg="rgba(255,255,255,0.05)"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Grid>
              {highlights.map((highlight) => (
                <Grid.Col key={highlight.title} span={{ base: 12, md: 4 }}>
                  <Stack gap="xs">
                    <Group gap="xs">
                      {highlight.icon}
                      <Text size="xs" tt="uppercase" lts={3} c="blue.3">
                        Benefits
                      </Text>
                    </Group>
                    <Text size="lg" fw={600} c="white">
                      {highlight.title}
                    </Text>
                    <Text size="sm" c="gray.4">
                      {highlight.description}
                    </Text>
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>
          </Paper>

          {/* Footer CTA */}
          <Paper
            radius="xl"
            p="xl"
            ta="center"
            style={{
              background: 'linear-gradient(to right, #1e293b, #312e81)',
              border: '1px solid var(--mantine-color-dark-4)',
            }}
          >
            <Text size="xs" tt="uppercase" lts={3} c="blue.2">
              Need help?
            </Text>
            <Title order={3} c="white" mt="xs">
              Let&apos;s shape a plan for your organization
            </Title>
            <Text c="gray.4" mt="xs">
              Custom integrations, SLAs, or dedicated onboarding - let us plan it
              together.
            </Text>
            <Button
              component={Link}
              href="/contact"
              variant="outline"
              color="white"
              radius="lg"
              mt="md"
            >
              Contact Sales
            </Button>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
