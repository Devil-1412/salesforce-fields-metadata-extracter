import { Box, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

interface FeedbackHeaderProps {
  onSubmitClick: () => void;
}

export function FeedbackHeader({ onSubmitClick }: FeedbackHeaderProps) {
  return (
    <Box
      bg="blue.7"
      c="white"
      py={60}
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-blue-8) 0%, var(--mantine-color-indigo-9) 100%)',
      }}
    >
      <Container size="xl">
        <Group justify="space-between" align="center">
          <Stack gap="xs">
            <Title order={1} fw={800}>
              Community Feedback
            </Title>
            <Text size="lg" opacity={0.9} maw={600}>
              Help us improve Salesforce Metadata Extractor. Report bugs, suggest features, or share
              your ideas.
            </Text>
          </Stack>
          <Button
            size="lg"
            variant="white"
            color="blue"
            leftSection={<IconPlus size={20} />}
            onClick={onSubmitClick}
          >
            Submit Feedback
          </Button>
        </Group>
      </Container>
    </Box>
  );
}
