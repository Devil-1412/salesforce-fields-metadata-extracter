import {
  Button,
  FileInput,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { IconSparkles, IconUpload } from '@tabler/icons-react';
import { FormEvent } from 'react';

interface FeedbackSubmitModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  type: string | null;
  setType: (val: string | null) => void;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  images: File[];
  setImages: (files: File[]) => void;
  formErrors: Record<string, string>;
}

export function FeedbackSubmitModal({
  opened,
  onClose,
  onSubmit,
  submitting,
  type,
  setType,
  title,
  setTitle,
  description,
  setDescription,
  images,
  setImages,
  formErrors,
}: FeedbackSubmitModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSparkles size={20} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>Share Your Feedback</Text>
        </Group>
      }
      size="lg"
      radius="md"
      padding="xl"
    >
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <Select
            label="What kind of feedback is this?"
            data={[
              { value: 'bug', label: '🐞 Bug Report' },
              { value: 'feature_request', label: '🚀 Feature Request' },
              { value: 'suggestion', label: '💡 Suggestion' },
            ]}
            value={type}
            onChange={setType}
            error={formErrors.type}
            required
            checkIconPosition="right"
            comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
          />

          <TextInput
            label="Title"
            placeholder="e.g., Add Dark Mode support"
            withAsterisk
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            error={formErrors.title}
          />

          <Textarea
            label="Description"
            placeholder="Describe your idea or the bug in detail..."
            minRows={5}
            withAsterisk
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            error={formErrors.description}
          />

          <FileInput
            label="Attachments (Optional)"
            description="Max 5 images. Helpful for bugs or design ideas."
            placeholder="Click to upload images"
            multiple
            accept="image/png,image/jpeg"
            leftSection={<IconUpload size={18} />}
            clearable
            value={images}
            onChange={setImages}
            error={formErrors.images}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Feedback
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
