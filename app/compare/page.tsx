'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  Table,
  SegmentedControl,
  Box,
  Loader,
  Center,
  Badge,
  ActionIcon,
  ScrollArea,
} from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';

interface Org {
  orgName: string;
  accessToken: string | null;
  instanceUrl: string | null;
  org_name?: string;
  instance_url?: string;
}

interface OrgPresence {
  present: boolean;
  label: string;
  custom: boolean;
}

interface ComparisonRow {
  objectName: string;
  keyPrefix: string;
  orgs: OrgPresence[];
}

interface AvailableOrg {
  org_name?: string;
  orgName?: string;
  instance_url?: string;
  instanceUrl?: string;
}

export default function ComparePage() {
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<AvailableOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const validOrgs = useMemo(
    () => orgs.filter((org) => org.accessToken && org.instanceUrl),
    [orgs]
  );

  // Load available orgs from API
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch('/api/listAllOrgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success) {
          setAvailableOrgs(data.organizations);
        }
      } catch (err) {
        console.error('Error fetching orgs:', err);
      }
    };
    fetchOrgs();
  }, []);

  useEffect(() => {
    setOrgs([
      { orgName: 'Org 1', accessToken: null, instanceUrl: null },
      { orgName: 'Org 2', accessToken: null, instanceUrl: null },
    ]);
  }, []);

  useEffect(() => {
    const fetchObjectsForOrg = async (org: Org) => {
      if (!org.accessToken || !org.instanceUrl) return [];
      try {
        const res = await fetch('/api/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: org.accessToken,
            instanceUrl: org.instanceUrl,
          }),
        });
        const data = await res.json();
        if (data.success) return data.object;
        throw new Error(data.error || 'Failed to fetch objects.');
      } catch (err) {
        toast.error(
          `Error fetching objects for ${org.orgName || org.instanceUrl}: ${
            (err as Error).message
          }`
        );
        return [];
      }
    };

    const fetchAndCompareObjects = async () => {
      setLoading(true);
      setError('');
      if (orgs.length < 2 || orgs.some((o) => !o.accessToken || !o.instanceUrl)) {
        setLoading(false);
        return;
      }
      try {
        const orgObjectsList = await Promise.all(orgs.map(fetchObjectsForOrg));
        const allNames = Array.from(
          new Set(orgObjectsList.flat().map((o: { name: string }) => o.name))
        );
        const comparisonData: ComparisonRow[] = allNames.map((name) => ({
          objectName: name,
          keyPrefix:
            orgObjectsList
              .find((list) => list.some((o: { name: string }) => o.name === name))
              ?.find((o: { name: string }) => o.name === name)?.keyPrefix || '',
          orgs: orgs.map((org, idx) => {
            const obj = orgObjectsList[idx].find(
              (o: { name: string }) => o.name === name
            );
            return {
              present: !!obj,
              label: obj?.label || name,
              custom: obj?.custom || false,
            };
          }),
        }));
        setComparison(comparisonData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchAndCompareObjects();
  }, [orgs]);

  const addOrg = () => {
    setOrgs((prev) => [
      ...prev,
      { orgName: `Org ${prev.length + 1}`, accessToken: null, instanceUrl: null },
    ]);
  };

  const removeOrg = (index: number) => {
    if (orgs.length > 2) {
      setOrgs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateOrg = (index: number, org: Org) => {
    const updatedOrgs = [...orgs];
    updatedOrgs[index] = org;
    setOrgs(updatedOrgs);
  };

  const handleOrgSelect = async (index: number, val: string | null) => {
    if (!val) return;
    const selectedOrg = availableOrgs.find(
      (o) => (o.instance_url || o.instanceUrl) === val
    );
    if (!selectedOrg) return;

    const targetInstanceUrl = selectedOrg.instance_url || selectedOrg.instanceUrl || '';
    const toastId = toast.loading(
      `Logging in to ${selectedOrg.org_name || 'Salesforce'}...`
    );

    try {
      const res = await fetch('/api/salesforceLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceUrl: targetInstanceUrl }),
      });
      const data = await res.json();
      if (data.success) {
        updateOrg(index, {
          ...selectedOrg,
          accessToken: data.accessToken,
          instanceUrl: targetInstanceUrl,
          orgName: data.orgName,
        } as Org);
        toast.success(
          `Switched to ${data.orgName !== 'None' ? data.orgName : `Org ${index + 1}`}`,
          { id: toastId }
        );
      } else {
        toast.error(data.error || 'Login failed', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Login failed', { id: toastId });
    }
  };

  const filteredComparison = comparison.filter((obj) => {
    if (search && !obj.objectName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filter === 'both') return obj.orgs.every((o) => o.present);
    if (filter === 'different') return obj.orgs.some((o) => !o.present);
    if (filter === 'custom') return obj.orgs.some((o) => o.custom);
    return true;
  });

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }} p="md">
      <Container size="xl">
        <Stack gap="lg">
          <Title
            order={2}
            ta="center"
            style={{
              background: 'linear-gradient(to right, #1d4ed8, #4f46e5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Salesforce Object Comparison
          </Title>

          {/* Org Selection */}
          <Paper radius="lg" shadow="sm" p="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Select Organizations</Title>
              <Button leftSection={<IconPlus size={16} />} size="sm" onClick={addOrg}>
                Add Org
              </Button>
            </Group>

            <Group grow>
              {orgs.map((org, index) => (
                <Paper key={index} withBorder radius="md" p="sm">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={600}>
                      Org {index + 1}
                    </Text>
                    {orgs.length > 2 && (
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={() => removeOrg(index)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                  <Select
                    placeholder="Select an Org"
                    value={org.instanceUrl || null}
                    onChange={(val) => handleOrgSelect(index, val)}
                    data={availableOrgs.map((o) => ({
                      value: o.instance_url || o.instanceUrl || '',
                      label:
                        o.org_name && o.org_name !== 'None'
                          ? o.org_name
                          : o.orgName && o.orgName !== 'None'
                          ? o.orgName
                          : 'Salesforce Org',
                    }))}
                  />
                  {org.instanceUrl && (
                    <Text size="xs" c="dimmed" mt="xs">
                      {org.orgName !== 'None'
                        ? org.orgName
                        : org.instanceUrl.replace('https://', '')}
                    </Text>
                  )}
                </Paper>
              ))}
            </Group>
          </Paper>

          {/* Main Content */}
          {validOrgs.length < 2 ? (
            <Center py="xl">
              <Text c="dimmed">Select at least 2 orgs to compare...</Text>
            </Center>
          ) : loading ? (
            <Center py="xl">
              <Loader />
              <Text c="dimmed" ml="sm">
                Fetching objects from orgs...
              </Text>
            </Center>
          ) : error ? (
            <Center py="xl">
              <Text c="red">{error}</Text>
            </Center>
          ) : (
            <>
              {/* Filters */}
              <Group justify="space-between">
                <TextInput
                  placeholder="Search object..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  style={{ width: 300 }}
                />
                <SegmentedControl
                  value={filter}
                  onChange={setFilter}
                  data={[
                    { label: 'Show All', value: 'all' },
                    { label: 'In All Orgs', value: 'both' },
                    { label: 'Different', value: 'different' },
                    { label: 'Custom Only', value: 'custom' },
                  ]}
                />
              </Group>

              {/* Results Table */}
              <Paper radius="lg" shadow="md" withBorder style={{ overflow: 'hidden' }}>
                <ScrollArea h={500}>
                  <Table striped highlightOnHover>
                    <Table.Thead
                      style={{
                        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                      }}
                    >
                      <Table.Tr>
                        <Table.Th c="white">Object Name</Table.Th>
                        <Table.Th c="white">Key Prefix</Table.Th>
                        {orgs.map((org, idx) => (
                          <Table.Th key={idx} c="white">
                            {org.orgName !== 'None' ? org.orgName : `Org ${idx + 1}`}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredComparison.map((obj) => {
                        const hasMissing = obj.orgs.some((o) => !o.present);
                        return (
                          <Table.Tr
                            key={obj.objectName}
                            bg={hasMissing ? 'red.0' : undefined}
                          >
                            <Table.Td fw={500}>{obj.objectName}</Table.Td>
                            <Table.Td>{obj.keyPrefix}</Table.Td>
                            {obj.orgs.map((o, orgIdx) => (
                              <Table.Td key={orgIdx}>
                                {o.present ? (
                                  <Text size="sm">{o.label}</Text>
                                ) : (
                                  <Text c="dimmed">—</Text>
                                )}
                              </Table.Td>
                            ))}
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
