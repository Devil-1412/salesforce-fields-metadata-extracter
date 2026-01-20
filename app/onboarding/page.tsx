'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconBuilding,
  IconCircleCheck,
  IconArrowRight,
  IconBook,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Stack,
  Center,
  ThemeIcon,
  Box,
  Progress,
  Group,
  Grid,
  Card,
} from '@mantine/core';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);

  const handleAddOrg = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const orgEmail = formData.get('orgEmail') as string;
    const orgPassword = formData.get('orgPassword') as string;
    const securityToken = formData.get('securityToken') as string;

    try {
      const res = await fetch('/api/addOrg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgEmail, orgPassword, securityToken, isSandbox }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Organization connected successfully!');
        setStep(2);
      } else {
        toast.error(data.error || 'Failed to connect organization');
      }
    } catch (error) {
      console.error('Error adding org:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    router.push('/');
  };

  const features = [
    {
      icon: <IconBook size={20} />,
      title: 'Analyze Objects',
      description: 'View detailed metadata about your Salesforce objects and fields.',
      color: 'blue',
    },
    {
      icon: <IconBuilding size={20} />,
      title: 'Compare Orgs',
      description: 'Compare metadata between different Salesforce organizations.',
      color: 'violet',
    },
    {
      icon: <IconCircleCheck size={20} />,
      title: 'Track Changes',
      description: 'Monitor changes to your metadata over time.',
      color: 'orange',
    },
  ];

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }} p="md">
      <Center h="100%">
        <Container size="sm" style={{ width: '100%' }}>
          <Paper radius="xl" shadow="xl" style={{ overflow: 'hidden' }}>
            {/* Progress Bar */}
            <Progress
              value={step === 1 ? 50 : 100}
              size="xs"
              color="blue"
              radius={0}
            />

            <Box p="xl">
              {step === 1 ? (
                <Stack gap="lg">
                  <Center>
                    <ThemeIcon size={64} radius="xl" variant="light" color="blue">
                      <IconBuilding size={32} />
                    </ThemeIcon>
                  </Center>

                  <Stack align="center" gap="xs" ta="center">
                    <Title order={2}>Connect Your Salesforce Org</Title>
                    <Text c="dimmed" size="sm">
                      To get started, we need to connect to your Salesforce environment.
                    </Text>
                  </Stack>

                  <form onSubmit={handleAddOrg}>
                    <Stack gap="md" maw={400} mx="auto">
                      <TextInput
                        name="orgEmail"
                        label="Salesforce Username"
                        type="email"
                        placeholder="user@company.com"
                        required
                      />

                      <PasswordInput
                        name="orgPassword"
                        label="Password"
                        placeholder="••••••••"
                        required
                      />

                      <TextInput
                        name="securityToken"
                        label="Security Token"
                        placeholder="Enter your security token"
                        description="Required for API access. Found in My Settings > Personal > Reset My Security Token."
                        required
                      />

                      <Checkbox
                        label="This is a Sandbox environment"
                        checked={isSandbox}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setIsSandbox(e.target.checked)
                        }
                      />

                      <Button type="submit" fullWidth loading={loading} size="md">
                        {loading ? 'Connecting...' : 'Connect Organization'}
                      </Button>
                    </Stack>
                  </form>
                </Stack>
              ) : (
                <Stack gap="lg" align="center">
                  <ThemeIcon size={64} radius="xl" variant="light" color="green">
                    <IconCircleCheck size={32} />
                  </ThemeIcon>

                  <Stack align="center" gap="xs" ta="center">
                    <Title order={2}>You&apos;re All Set! 🎉</Title>
                    <Text c="dimmed" size="sm">
                      Your organization has been successfully connected. Here&apos;s a
                      quick overview of what you can do.
                    </Text>
                  </Stack>

                  <Grid mt="md">
                    {features.map((feature) => (
                      <Grid.Col key={feature.title} span={{ base: 12, md: 4 }}>
                        <Card
                          radius="lg"
                          p="md"
                          bg={`${feature.color}.0`}
                          style={{
                            border: `1px solid var(--mantine-color-${feature.color}-1)`,
                          }}
                        >
                          <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="light"
                            color={feature.color}
                            mb="sm"
                          >
                            {feature.icon}
                          </ThemeIcon>
                          <Text fw={600} size="sm">
                            {feature.title}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {feature.description}
                          </Text>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>

                  <Button
                    size="md"
                    rightSection={<IconArrowRight size={18} />}
                    onClick={handleFinish}
                  >
                    Get Started
                  </Button>
                </Stack>
              )}
            </Box>
          </Paper>
        </Container>
      </Center>
    </Box>
  );
}
