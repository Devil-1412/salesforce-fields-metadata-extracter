'use client';

import { Box, Paper, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { useEffect, useRef } from 'react';

interface Participant {
  orgKey: string;
  orgLabel: string;
  objectName: string;
  role: string;
}

interface FieldData {
  [key: string]: unknown;
}

interface FilteredField {
  fieldName: string;
  fieldDataArray: FieldData[];
  diff: boolean;
  diffKeys: string[];
}

interface FieldsTableProps {
  participants: Participant[];
  filteredFields: FilteredField[];
  selectedMetadata: string[];
  displayMode: 'default' | 'separate';
  scrollLock: boolean;
}

export default function FieldsTable({
  participants,
  filteredFields,
  selectedMetadata,
  displayMode,
  scrollLock,
}: FieldsTableProps) {
  const tableScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isSyncingRef = useRef(false);
  const lastScrollPositionsRef = useRef<{ left: number; top: number }[]>([]);

  // Scroll sync for separate tables mode
  useEffect(() => {
    if (displayMode !== 'separate' || participants.length === 0) return;

    const setupScrollSync = () => {
      lastScrollPositionsRef.current = tableScrollRefs.current.map((ref) =>
        ref ? { left: ref.scrollLeft, top: ref.scrollTop } : { left: 0, top: 0 }
      );

      const handlers: ((e: Event) => void)[] = [];

      tableScrollRefs.current.forEach((ref, sourceIdx) => {
        if (!ref) return;

        const handler = (e: Event) => {
          if (isSyncingRef.current) return;
          const target = e.target as HTMLDivElement;
          const currentScrollLeft = target.scrollLeft;
          const currentScrollTop = target.scrollTop;
          const lastPos = lastScrollPositionsRef.current[sourceIdx];

          // Sync horizontal scroll (always)
          if (currentScrollLeft !== lastPos?.left) {
            isSyncingRef.current = true;
            tableScrollRefs.current.forEach((otherRef, otherIdx) => {
              if (otherRef && otherIdx !== sourceIdx) {
                otherRef.scrollLeft = currentScrollLeft;
                lastScrollPositionsRef.current[otherIdx].left = currentScrollLeft;
              }
            });
            lastPos.left = currentScrollLeft;
            isSyncingRef.current = false;
          }

          // Sync vertical scroll (only when scroll lock enabled)
          if (scrollLock && currentScrollTop !== lastPos?.top) {
            isSyncingRef.current = true;
            tableScrollRefs.current.forEach((otherRef, otherIdx) => {
              if (otherRef && otherIdx !== sourceIdx) {
                otherRef.scrollTop = currentScrollTop;
                lastScrollPositionsRef.current[otherIdx].top = currentScrollTop;
              }
            });
            lastPos.top = currentScrollTop;
            isSyncingRef.current = false;
          }
        };

        handlers[sourceIdx] = handler;
        ref.addEventListener('scroll', handler);
      });

      return handlers;
    };

    const timeoutId = setTimeout(() => {
      const handlers = setupScrollSync();
      return () => {
        tableScrollRefs.current.forEach((ref, idx) => {
          if (ref && handlers && handlers[idx]) {
            ref.removeEventListener('scroll', handlers[idx]);
          }
        });
      };
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [displayMode, participants.length, scrollLock]);

  if (displayMode === 'default') {
    // Side-by-side view
    return (
      <Paper radius="lg" shadow="md" withBorder style={{ overflow: 'hidden' }}>
        <ScrollArea h={500} type="auto">
          <Table striped highlightOnHover>
            <Table.Thead
              style={{
                position: 'sticky',
                top: 0,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                zIndex: 10,
              }}
            >
              <Table.Tr>
                {selectedMetadata.map((key) => (
                  <Table.Th
                    key={key}
                    colSpan={participants.length || 1}
                    style={{ color: 'white', textAlign: 'center' }}
                  >
                    <Text size="xs" fw={700} tt="uppercase">
                      {key}
                    </Text>
                  </Table.Th>
                ))}
              </Table.Tr>
              <Table.Tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                {selectedMetadata.map((key) =>
                  participants.map((participant, pIdx) => (
                    <Table.Th
                      key={`${key}-${pIdx}`}
                      style={{ color: 'white', textAlign: 'center' }}
                    >
                      <Stack gap={2}>
                        <Text size="xs" fw={600}>
                          {participant.orgLabel}
                        </Text>
                        <Text size="xs" c="blue.1">
                          {participant.objectName || '—'}
                        </Text>
                      </Stack>
                    </Table.Th>
                  ))
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredFields.map((f, idx) => (
                <Table.Tr
                  key={idx}
                  style={{
                    backgroundColor: f.diff ? 'var(--mantine-color-red-0)' : undefined,
                    borderLeft: f.diff ? '4px solid var(--mantine-color-red-5)' : undefined,
                  }}
                >
                  {selectedMetadata.map((key) =>
                    participants.map((_, pIdx) => {
                      const fieldData = f.fieldDataArray[pIdx] || {};
                      return (
                        <Table.Td key={`${key}-${pIdx}`} ta="center">
                          {String(fieldData[key] ?? '—')}
                        </Table.Td>
                      );
                    })
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    );
  }

  // Separate tables view
  return (
    <Paper radius="lg" shadow="md" withBorder p="lg">
      <Box style={{ display: 'flex', gap: 16 }}>
        {participants.map((participant, orgIdx) => (
          <Box key={`${participant.orgKey}-${orgIdx}`} style={{ flex: 1, minWidth: 0 }}>
            <Paper
              p="sm"
              radius="md"
              mb="sm"
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              }}
            >
              <Text size="sm" fw={700} c="white" tt="uppercase">
                {participant.orgLabel}
              </Text>
              <Text size="xs" c="blue.1">
                {participant.objectName || 'No object selected'}
              </Text>
            </Paper>
            <ScrollArea
              h={450}
              type="auto"
              viewportRef={(el) => {
                tableScrollRefs.current[orgIdx] = el;
              }}
            >
              <Table striped highlightOnHover>
                <Table.Thead
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    zIndex: 5,
                  }}
                >
                  <Table.Tr>
                    {selectedMetadata.map((key) => (
                      <Table.Th key={key} style={{ color: 'white', textAlign: 'center' }}>
                        <Text size="xs" fw={700} tt="uppercase">
                          {key}
                        </Text>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredFields.map((f, idx) => {
                    const fieldData = f.fieldDataArray[orgIdx] || {};
                    return (
                      <Table.Tr
                        key={idx}
                        style={{
                          backgroundColor: f.diff ? 'var(--mantine-color-red-0)' : undefined,
                          borderLeft: f.diff ? '4px solid var(--mantine-color-red-5)' : undefined,
                        }}
                      >
                        {selectedMetadata.map((key) => (
                          <Table.Td key={key} ta="center">
                            {String(fieldData[key] ?? '—')}
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
