'use client';

import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';

interface SaveQueryModalProps {
  opened: boolean;
  onClose: () => void;
  queryName: string;
  setQueryName: (name: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function SaveQueryModal({
  opened,
  onClose,
  queryName,
  setQueryName,
  onSave,
  saving,
}: SaveQueryModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Save Query" centered>
      <Stack gap="md">
        <TextInput
          label="Query Name"
          value={queryName}
          onChange={(e) => setQueryName(e.target.value)}
          placeholder="e.g., Active Accounts"
          autoFocus
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
