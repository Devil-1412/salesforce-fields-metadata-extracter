import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconBug, IconBulb, IconCheck, IconSparkles, IconX } from '@tabler/icons-react';

interface Report {
  id: string;
  type: 'bug' | 'feature_request' | 'suggestion';
  title: string;
  description: string;
  images: string[];
  status: 'pending' | 'solved' | 'dismissed';
  created_at: string;
}

interface FeedbackCardProps {
  report: Report;
  isAdmin: boolean;
  onStatusUpdate: (id: string, status: string) => void;
  onImageClick: (images: string[], index: number) => void;
}

export function FeedbackCard({ report, isAdmin, onStatusUpdate, onImageClick }: FeedbackCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'solved':
        return (
          <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
            Solved
          </Badge>
        );
      case 'dismissed':
        return (
          <Badge color="gray" variant="light" leftSection={<IconX size={12} />}>
            Closed
          </Badge>
        );
      default:
        return (
          <Badge color="yellow" variant="light" leftSection={<IconBulb size={12} />}>
            Pending
          </Badge>
        );
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'bug':
        return <IconBug size={20} />;
      case 'feature_request':
        return <IconSparkles size={20} />;
      case 'suggestion':
        return <IconBulb size={20} />;
      default:
        return <IconSparkles size={20} />;
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        transition: 'transform 0.2s, box-shadow 0.2s',
        ':hover': {
          transform: 'translateY(-4px)',
          boxShadow: 'var(--mantine-shadow-md)',
        },
      }}
    >
      <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon
              variant="light"
              color={
                report.type === 'bug'
                  ? 'red'
                  : report.type === 'feature_request'
                    ? 'blue'
                    : 'orange'
              }
              size="md"
              radius="md"
            >
              {getIconForType(report.type)}
            </ThemeIcon>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {report.type.replace('_', ' ')}
            </Text>
          </Group>
          {getStatusBadge(report.status)}
        </Group>
      </Card.Section>

      <Stack mt="md" justify="space-between" style={{ flex: 1 }}>
        <Box>
          <Title order={4} lineClamp={2} mb="xs">
            {report.title}
          </Title>
          <Text size="sm" c="dimmed" lineClamp={3}>
            {report.description}
          </Text>

          {report.images && report.images.length > 0 && (
            <SimpleGrid cols={4} spacing="xs" mt="md">
              {report.images.slice(0, 4).map((img, i) => (
                <Box
                  key={i}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 'var(--mantine-radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--mantine-color-gray-3)',
                    cursor: 'pointer',
                  }}
                  onClick={() => onImageClick(report.images, i)}
                >
                  <Image src={img} w="100%" h="100%" fit="cover" />
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {isAdmin && (
          <Group mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            <Tooltip label="Mark as Solved">
              <Button
                variant="subtle"
                color="green"
                size="xs"
                fullWidth
                onClick={() => onStatusUpdate(report.id, 'solved')}
              >
                Mark Solved
              </Button>
            </Tooltip>
            <Tooltip label="Dismiss Report">
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                fullWidth
                onClick={() => onStatusUpdate(report.id, 'dismissed')}
              >
                Dismiss
              </Button>
            </Tooltip>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
