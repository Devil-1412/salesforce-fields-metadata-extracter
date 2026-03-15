'use client';

import { Button, Grid, Group, Select, Stack, TextInput } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { FormEvent, useEffect, useState } from 'react';

export interface OracleFormData {
  display_name: string;
  agent_id: string;
}

interface OracleFormProps {
  form: OracleFormData;
  setForm: (form: OracleFormData) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export default function OracleForm({ form, setForm, onSubmit, loading }: OracleFormProps) {
  const [agents, setAgents] = useState<{ value: string; label: string }[]>([]);
  const [fetchingAgents, setFetchingAgents] = useState(false);

  useEffect(() => {
    // Fetch paired agents to populate the dropdown
    const fetchAgents = async () => {
      setFetchingAgents(true);
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        const agentList = Array.isArray(data.data) ? data.data : Array.isArray(data.agents) ? data.agents : [];
        if (agentList.length > 0) {
          setAgents(
            agentList.map((agent: any) => ({
              value: agent.id,
              label: agent.name || agent.agent_name || agent.id.substring(0, 8),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch agents for dropdown', err);
      } finally {
        setFetchingAgents(false);
      }
    };
    
    fetchAgents();
  }, []);

  const handleChange = (field: keyof OracleFormData, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Display Name"
              placeholder="e.g. Production ERP"
              required
              description="A friendly name for this Oracle connection"
              value={form.display_name}
              onChange={(e) => handleChange('display_name', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Local Desktop Agent"
              placeholder="Select a paired agent"
              required
              description="The local agent that will tunnel queries to Oracle"
              data={agents}
              value={form.agent_id}
              onChange={(val) => handleChange('agent_id', val || '')}
              disabled={fetchingAgents}
              searchable
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={loading}>
            Save Connection
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
