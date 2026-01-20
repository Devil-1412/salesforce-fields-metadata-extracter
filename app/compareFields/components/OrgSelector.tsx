'use client';

import { Paper, Select, Text, Group, Button, SimpleGrid, Stack } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import toast from 'react-hot-toast';

interface AvailableOrg {
  instance_url?: string;
  instanceUrl?: string;
  org_name?: string;
  orgName?: string;
}

interface Org {
  orgName?: string;
  org_name?: string;
  accessToken: string | null;
  instanceUrl: string | null;
  instance_url?: string;
}

interface OrgSelectorProps {
  orgs: Org[];
  availableOrgs: AvailableOrg[];
  onAddOrg: () => void;
  onRemoveOrg: (index: number) => void;
  onUpdateOrg: (index: number, org: Org) => void;
}

export default function OrgSelector({
  orgs,
  availableOrgs,
  onAddOrg,
  onRemoveOrg,
  onUpdateOrg,
}: OrgSelectorProps) {
  const handleOrgChange = async (index: number, instanceUrl: string) => {
    const selectedOrg = availableOrgs.find(
      (o) => (o.instance_url || o.instanceUrl) === instanceUrl
    );
    if (!selectedOrg) return;

    const targetInstanceUrl = selectedOrg.instance_url || selectedOrg.instanceUrl || '';
    const toastId = toast.loading(`Logging in to ${selectedOrg.org_name || 'Salesforce'}...`);

    try {
      const res = await fetch('/api/salesforceLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceUrl: targetInstanceUrl }),
      });
      const data = await res.json();

      if (data.success) {
        onUpdateOrg(index, {
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

  const getOrgOptions = () =>
    availableOrgs.map((o, idx) => ({
      value: o.instance_url || o.instanceUrl || '',
      label:
        (o.org_name || o.orgName) && o.org_name !== 'None' && o.orgName !== 'None'
          ? (o.org_name || o.orgName)!
          : 'Salesforce Org',
    }));

  return (
    <Paper radius="lg" p="lg" shadow="md" withBorder mb="lg">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="lg">
          Organizations
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddOrg}
          size="sm"
        >
          Add Org
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
        {orgs.map((org, index) => (
          <Paper key={index} p="sm" withBorder radius="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Org {index + 1}
                </Text>
                {orgs.length > 2 && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => onRemoveOrg(index)}
                  >
                    Remove
                  </Button>
                )}
              </Group>
              <Select
                value={org.instanceUrl || ''}
                onChange={(val) => val && handleOrgChange(index, val)}
                data={getOrgOptions()}
                placeholder="Select an Org"
                searchable
              />
              {(org.instanceUrl || org.instance_url) && (
                <Text size="xs" c="dimmed">
                  {(org.orgName || org.org_name) &&
                  org.orgName !== 'None' &&
                  org.org_name !== 'None'
                    ? org.orgName || org.org_name
                    : (org.instanceUrl || org.instance_url || '').replace('https://', '')}
                </Text>
              )}
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Paper>
  );
}
