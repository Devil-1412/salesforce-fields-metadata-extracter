'use client';

import { Button, Grid, Group, PasswordInput, Stack, TextInput } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { FormEvent } from 'react';

export interface SnowflakeFormData {
  account: string;
  username: string;
  password: '';
  warehouse: string;
  database: string;
  schema: string;
  role: string;
}

interface SnowflakeFormProps {
  form: SnowflakeFormData;
  setForm: (form: SnowflakeFormData) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export default function SnowflakeForm({ form, setForm, onSubmit, loading }: SnowflakeFormProps) {
  const handleChange = (field: keyof SnowflakeFormData, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Account Identifier"
              placeholder="e.g. xy12345.us-east-1"
              required
              description="Your Snowflake account identifier (e.g., orgname-accountname)"
              value={form.account}
              onChange={(e) => handleChange('account', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Username"
              placeholder="SNOWFLAKE_USER"
              required
              value={form.username}
              onChange={(e) => handleChange('username', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12 }}>
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              required
              value={form.password}
              onChange={(e) => handleChange('password', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Warehouse"
              placeholder="COMPUTE_WH"
              value={form.warehouse}
              onChange={(e) => handleChange('warehouse', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Database"
              placeholder="SALES_DB"
              value={form.database}
              onChange={(e) => handleChange('database', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Schema"
              placeholder="PUBLIC"
              value={form.schema}
              onChange={(e) => handleChange('schema', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Role"
              placeholder="ACCOUNTADMIN"
              value={form.role}
              onChange={(e) => handleChange('role', e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={loading}>
            Connect Snowflake
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
