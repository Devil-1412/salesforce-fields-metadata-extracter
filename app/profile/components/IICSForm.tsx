'use client';

import { Button, Grid, Group, PasswordInput, Stack, TextInput } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { FormEvent } from 'react';

export interface IICSFormData {
  username: string;
  password: '';
  podRegion: string;
}

interface IICSFormProps {
  form: IICSFormData;
  setForm: (form: IICSFormData) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export default function IICSForm({ form, setForm, onSubmit, loading }: IICSFormProps) {
  const handleChange = (field: keyof IICSFormData, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Username"
              placeholder="your.iics@email.com"
              required
              description="Your Informatica IICS login username"
              value={form.username}
              onChange={(e) => handleChange('username', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Pod Region"
              placeholder="dm-us"
              required
              description="IICS pod region (e.g. dm-us, dm-em, dm-ap)"
              value={form.podRegion}
              onChange={(e) => handleChange('podRegion', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12 }}>
            <PasswordInput
              label="Password"
              placeholder="Enter IICS password"
              required
              value={form.password}
              onChange={(e) => handleChange('password', e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={loading}>
            Connect IICS
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
