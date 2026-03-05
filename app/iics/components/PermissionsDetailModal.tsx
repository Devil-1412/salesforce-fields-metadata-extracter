'use client';

import {
  Badge,
  Center,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Table,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconShieldCheck, IconUser, IconUsers, IconX } from '@tabler/icons-react';

interface PermissionsDetailModalProps {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  selectedObject: any;
  permissionsDetail: any[];
}

export default function PermissionsDetailModal({
  opened,
  onClose,
  loading,
  selectedObject,
  permissionsDetail,
}: PermissionsDetailModalProps) {
  const renderCheck = (value: boolean) => {
    return value ? (
      <IconCheck size={18} color="var(--mantine-color-green-6)" />
    ) : (
      <IconX size={18} color="var(--mantine-color-red-6)" />
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size={32} radius="md" variant="light" color="blue">
            <IconShieldCheck size={20} />
          </ThemeIcon>
          <Text fw={500} size="lg">
            Permissions:{' '}
            {selectedObject?.name || selectedObject?.path || selectedObject?.id || 'Object'}
          </Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Loader color="blue" />
        </Center>
      ) : permissionsDetail && Array.isArray(permissionsDetail) && permissionsDetail.length > 0 ? (
        <ScrollArea>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Principal</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th ta="center">Read</Table.Th>
                <Table.Th ta="center">Update</Table.Th>
                <Table.Th ta="center">Delete</Table.Th>
                <Table.Th ta="center">Execute</Table.Th>
                <Table.Th ta="center">Change Permission</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {permissionsDetail.map((perm) => (
                <Table.Tr key={perm.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {perm.principal?.name || 'Unknown'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={perm.principal?.type === 'USER' ? 'blue' : 'violet'}
                      leftSection={
                        perm.principal?.type === 'USER' ? (
                          <IconUser size={12} />
                        ) : (
                          <IconUsers size={12} />
                        )
                      }
                    >
                      {perm.principal?.type || 'UNKNOWN'}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">{renderCheck(perm.permissions?.read)}</Table.Td>
                  <Table.Td ta="center">{renderCheck(perm.permissions?.update)}</Table.Td>
                  <Table.Td ta="center">{renderCheck(perm.permissions?.delete)}</Table.Td>
                  <Table.Td ta="center">{renderCheck(perm.permissions?.execute)}</Table.Td>
                  <Table.Td ta="center">{renderCheck(perm.permissions?.changePermission)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      ) : (
        <Center py="xl">
          <Text size="sm" c="dimmed">
            No permissions details available for this object.
          </Text>
        </Center>
      )}
    </Modal>
  );
}
