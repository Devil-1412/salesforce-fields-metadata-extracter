'use client';

import {
  IconUsers,
  IconTarget,
  IconBulb,
  IconWorld,
  IconCode,
} from '@tabler/icons-react';
import {
  Container,
  Title,
  Text,
  Grid,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  Flex,
  Badge,
  Image,
  Box,
  Avatar,
} from '@mantine/core';

const teamMembers = [
  {
    name: 'Pushpam Agrawal',
    role: 'Developer',
    img: 'https://avatars.githubusercontent.com/u/000000?v=4',
  },
  {
    name: 'Designer',
    role: 'UI/UX Designer',
    img: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
  },
  {
    name: 'Specialist',
    role: 'Salesforce Specialist',
    img: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  },
];

const techStack = [
  'Next.js',
  'React',
  'Mantine UI',
  'Node.js',
  'Salesforce JSForce',
  'Supabase',
  'GCP / Firebase',
];

export default function AboutPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #e0f2fe 100%)',
      }}
    >
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Hero Section */}
          <Stack align="center" ta="center" mt="xl">
            <Title
              order={1}
              size="2.5rem"
              style={{
                background: 'linear-gradient(to right, #1e40af, #4f46e5, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              About Salesforce Metadata Extractor
            </Title>
            <Text c="dimmed" size="lg" maw={600}>
              We help Salesforce developers and admins simplify complex metadata analysis
              — so they can focus on building amazing customer experiences.
            </Text>
          </Stack>

          {/* Mission Section */}
          <Grid mt="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconTarget size={20} />
                </ThemeIcon>
                <Title order={2} c="blue">
                  Our Mission
                </Title>
              </Group>
              <Text size="lg" c="dimmed">
                Our mission is to make <strong>Salesforce metadata</strong> accessible,
                visual, and actionable for every team. Whether you&apos;re comparing orgs,
                understanding field dependencies, or validating customizations — our
                tools streamline your workflow with precision and clarity.
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper
                radius="xl"
                p="xl"
                style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                }}
              >
                <Stack align="center">
                  <IconBulb size={48} color="var(--mantine-color-blue-6)" />
                  <Text ta="center" fw={500} c="dimmed">
                    &ldquo;Data clarity is not a luxury — it&apos;s a necessity for
                    innovation.&rdquo;
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Story Section */}
          <Grid mt="xl">
            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
              <Paper radius="xl" p="xl" shadow="md" withBorder>
                <IconWorld size={32} color="var(--mantine-color-indigo-6)" />
                <Title order={3} mt="xs">
                  Our Story
                </Title>
                <Text c="dimmed" mt="sm">
                  The Salesforce ecosystem is powerful but often opaque when it comes to
                  understanding metadata. We started Salesforce Metadata Extractor with
                  one goal — to make complex metadata structures simple to navigate,
                  analyze, and compare.
                </Text>
                <Text c="dimmed" mt="sm">
                  Today, we serve hundreds of Salesforce developers, architects, and
                  admins who trust our tools for accuracy, speed, and deep insight.
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
              <Image
                src="https://cdn.dribbble.com/users/148670/screenshots/15818315/media/24efb8a3b06b91b6b0a16f11d5c7533c.png?compress=1&resize=800x600&vertical=top"
                alt="Salesforce Metadata"
                radius="xl"
              />
            </Grid.Col>
          </Grid>

          {/* Team Section */}
          <Stack align="center" mt="xl">
            <Group gap="xs">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconUsers size={20} />
              </ThemeIcon>
              <Title order={2} c="blue">
                Meet the Team
              </Title>
            </Group>
            <Text c="dimmed" ta="center" maw={500}>
              A small team of passionate developers, Salesforce enthusiasts, and data
              engineers dedicated to simplifying your metadata journey.
            </Text>

            <Grid mt="md" justify="center">
              {teamMembers.map((member) => (
                <Grid.Col key={member.name} span={{ base: 12, sm: 6, md: 4 }}>
                  <Paper
                    radius="lg"
                    p="lg"
                    shadow="sm"
                    withBorder
                    style={{ transition: 'transform 0.2s' }}
                  >
                    <Stack align="center">
                      <Avatar src={member.img} size={80} radius="xl" />
                      <Text fw={600}>{member.name}</Text>
                      <Text size="sm" c="blue">
                        {member.role}
                      </Text>
                    </Stack>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>

          {/* Tech Section */}
          <Stack align="center" mt="xl" mb="xl">
            <Group gap="xs">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconCode size={20} />
              </ThemeIcon>
              <Title order={2} c="blue">
                Technology Stack
              </Title>
            </Group>
            <Text c="dimmed" ta="center" maw={500}>
              Built using modern web technologies for performance and scalability.
            </Text>

            <Flex gap="sm" wrap="wrap" justify="center" mt="md">
              {techStack.map((tech) => (
                <Badge key={tech} size="lg" variant="light" radius="xl">
                  {tech}
                </Badge>
              ))}
            </Flex>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
