'use client';

import { Modal, TextInput, Group, ScrollArea, Text, Paper, Box } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';

interface Theme {
  id: string;
  label: string;
}

interface ThemePickerModalProps {
  opened: boolean;
  onClose: (save: boolean) => void;
  themes: Theme[];
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemePickerModal({
  opened,
  onClose,
  themes,
  currentTheme,
  onThemeChange,
}: ThemePickerModalProps) {
  const previewCode = `SELECT Id, Name, Email, CreatedDate
FROM Account
WHERE IsActive = true
  AND Industry IN ('Technology', 'Finance')
ORDER BY CreatedDate DESC
LIMIT 100`;

  return (
    <Modal
      opened={opened}
      onClose={() => onClose(false)}
      title="Select Color Theme"
      size="xl"
      centered
    >
      <Group align="stretch" gap={0} h={400}>
        {/* Theme List */}
        <ScrollArea w={200} style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
          {themes.map((t) => (
            <Box
              key={t.id}
              p="sm"
              style={{
                cursor: 'pointer',
                borderLeft: currentTheme === t.id ? '3px solid var(--mantine-color-indigo-5)' : '3px solid transparent',
                backgroundColor: currentTheme === t.id ? 'var(--mantine-color-indigo-0)' : 'transparent',
              }}
              onMouseEnter={() => onThemeChange(t.id)}
              onClick={() => onClose(true)}
            >
              <Group justify="space-between">
                <Text size="sm" fw={currentTheme === t.id ? 600 : 400}>
                  {t.label}
                </Text>
                {currentTheme === t.id && (
                  <IconCheck size={16} color="var(--mantine-color-indigo-5)" />
                )}
              </Group>
            </Box>
          ))}
        </ScrollArea>

        {/* Preview Pane */}
        <Box flex={1} p="md">
          <Text size="xs" c="dimmed" mb="sm" tt="uppercase" fw={500}>
            Preview
          </Text>
          <Paper
            radius="md"
            withBorder
            style={{ overflow: 'hidden' }}
          >
            <Editor
              value={previewCode}
              onValueChange={() => {}}
              highlight={(code) => highlight(code, languages.sql)}
              padding={16}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 13,
                backgroundColor: '#f8f9fa',
                minHeight: '200px',
                pointerEvents: 'none',
              }}
              disabled
            />
          </Paper>
          <Text size="xs" c="dimmed" mt="sm">
            Current theme:{' '}
            <Text component="span" c="indigo" ff="monospace">
              {themes.find((t) => t.id === currentTheme)?.label}
            </Text>
          </Text>
          <Text size="xs" c="dimmed">
            Hover over a theme to preview. Click to apply.
          </Text>
        </Box>
      </Group>
    </Modal>
  );
}
