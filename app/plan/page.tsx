'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  IconCircleCheck,
  IconShield,
  IconBolt,
  IconStar,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Container,
  Title,
  Text,
  Grid,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  Button,
  List,
  Badge,
  Center,
  Loader,
  Anchor,
  Box,
} from '@mantine/core';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: ReactNode;
  color: string;
  popular?: boolean;
}

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('Free');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success) {
          setCurrentPlan(data.user.plan || 'Free');
        } else {
          toast.error('Failed to load plan details');
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const plans: Plan[] = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Essential tools for individual developers',
      features: [
        'Connect up to 1 Organization',
        'Basic Object Analysis',
        'Standard Support',
        'Community Access',
      ],
      icon: <IconStar size={24} />,
      color: 'blue',
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'Advanced features for power users',
      features: [
        'Connect up to 5 Organizations',
        'Advanced Metadata Analysis',
        'Priority Support',
        'Export to CSV/PDF',
        'History Tracking',
      ],
      icon: <IconBolt size={24} />,
      color: 'violet',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Scalable solutions for large teams',
      features: [
        'Unlimited Organizations',
        'Custom Integrations',
        'Dedicated Account Manager',
        'SLA Support',
        'SSO Authentication',
        'Audit Logs',
      ],
      icon: <IconShield size={24} />,
      color: 'indigo',
    },
  ];

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }} pt={80} pb="xl" px="md">
      <Container size="xl">
        <Stack align="center" mb="xl">
          <Title order={1}>Choose the Right Plan for You</Title>
          <Text c="dimmed" size="lg" ta="center" maw={600}>
            Unlock the full potential of your Salesforce metadata analysis with our
            flexible pricing plans.
          </Text>
        </Stack>

        <Grid>
          {plans.map((plan) => {
            const isCurrentPlan =
              currentPlan.toLowerCase() === plan.name.toLowerCase();
            return (
              <Grid.Col key={plan.name} span={{ base: 12, md: 4 }}>
                <Paper
                  radius="lg"
                  shadow="md"
                  withBorder
                  style={{
                    borderColor: isCurrentPlan
                      ? 'var(--mantine-color-blue-5)'
                      : undefined,
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {plan.popular && (
                    <Badge
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        borderTopRightRadius: 'var(--mantine-radius-lg)',
                        borderTopLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                      variant="gradient"
                      gradient={{ from: 'violet', to: 'indigo' }}
                    >
                      MOST POPULAR
                    </Badge>
                  )}

                  <Stack p="xl" gap="sm">
                    <ThemeIcon
                      size={48}
                      radius="lg"
                      variant="light"
                      color={plan.color}
                    >
                      {plan.icon}
                    </ThemeIcon>

                    <Title order={3}>{plan.name}</Title>
                    <Text c="dimmed" size="sm" style={{ minHeight: 40 }}>
                      {plan.description}
                    </Text>

                    <Group gap="xs" align="baseline">
                      <Text size="2rem" fw={700}>
                        {plan.price}
                      </Text>
                      <Text c="dimmed" size="sm">
                        {plan.period}
                      </Text>
                    </Group>

                    <Button
                      fullWidth
                      mt="sm"
                      disabled={isCurrentPlan}
                      variant={isCurrentPlan ? 'light' : 'filled'}
                      color={isCurrentPlan ? 'green' : 'dark'}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Upgrade Plan'}
                    </Button>
                  </Stack>

                  <Box p="xl" bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text size="sm" fw={600} mb="sm">
                      What&apos;s included:
                    </Text>
                    <List
                      spacing="xs"
                      icon={
                        <IconCircleCheck
                          size={18}
                          color="var(--mantine-color-green-5)"
                        />
                      }
                    >
                      {plan.features.map((feature) => (
                        <List.Item key={feature}>
                          <Text size="sm" c="dimmed">
                            {feature}
                          </Text>
                        </List.Item>
                      ))}
                    </List>
                  </Box>
                </Paper>
              </Grid.Col>
            );
          })}
        </Grid>

        <Paper radius="lg" p="xl" shadow="sm" mt="xl" withBorder ta="center">
          <Title order={4}>Need a custom solution?</Title>
          <Text c="dimmed" mt="xs">
            Contact our sales team for tailored packages and enterprise-grade support.
          </Text>
          <Anchor href="#" mt="md" fw={600}>
            Contact Sales →
          </Anchor>
        </Paper>
      </Container>
    </Box>
  );
}
