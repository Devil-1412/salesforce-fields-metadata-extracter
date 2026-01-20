'use client';

import { Modal, Button, Group, Text, ThemeIcon, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={null}
      centered
      size="sm"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Group align="flex-start" gap="md" wrap="nowrap">
        <ThemeIcon size={48} radius="xl" color="red" variant="light">
          <IconAlertTriangle size={24} />
        </ThemeIcon>

        <Stack gap="xs" style={{ flex: 1 }}>
          <Text fw={600} size="lg">
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        </Stack>
      </Group>

      <Group justify="flex-end" gap="sm" mt="xl">
        <Button variant="subtle" color="gray" onClick={onClose}>
          {cancelText}
        </Button>
        <Button color={confirmColor} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </Group>
    </Modal>
  );
}
