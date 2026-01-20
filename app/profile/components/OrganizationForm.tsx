'use client';

import { FormEvent } from 'react';
import {
  Stack,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Text,
  Paper,
} from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';

interface OrgFormData {
  orgEmail: string;
  orgPassword: string;
  securityToken: string;
  isSandbox: boolean;
}

interface OrganizationFormProps {
  orgForm: OrgFormData;
  setOrgForm: (form: OrgFormData) => void;
  handleAddOrg: (e: FormEvent) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export default function OrganizationForm({
  orgForm,
  setOrgForm,
  handleAddOrg,
  showPassword,
  setShowPassword,
}: OrganizationFormProps) {
  return (
    <form onSubmit={handleAddOrg}>
      <Stack gap="md">
        <TextInput
          label="Organization Email"
          placeholder="user@example.com"
          type="email"
          value={orgForm.orgEmail}
          onChange={(e) =>
            setOrgForm({ ...orgForm, orgEmail: e.target.value })
          }
          required
        />

        <PasswordInput
          label="Organization Password"
          placeholder="Enter your password"
          value={orgForm.orgPassword}
          onChange={(e) =>
            setOrgForm({ ...orgForm, orgPassword: e.target.value })
          }
          visible={showPassword}
          onVisibilityChange={setShowPassword}
          required
        />

        <TextInput
          label="Security Token"
          placeholder="Enter security token"
          value={orgForm.securityToken}
          onChange={(e) =>
            setOrgForm({ ...orgForm, securityToken: e.target.value })
          }
          description="Get your security token from Salesforce settings"
          required
        />

        <Paper p="md" radius="md" bg="gray.0" withBorder>
          <Checkbox
            label={
              <Stack gap={0}>
                <Text size="sm" fw={500}>
                  Sandbox Organization
                </Text>
                <Text size="xs" c="dimmed">
                  Check if this is a Salesforce sandbox environment
                </Text>
              </Stack>
            }
            checked={orgForm.isSandbox}
            onChange={(e) =>
              setOrgForm({ ...orgForm, isSandbox: e.currentTarget.checked })
            }
          />
        </Paper>

        <Button
          type="submit"
          leftSection={<IconBuilding size={18} />}
          variant="gradient"
          gradient={{ from: 'blue', to: 'indigo' }}
          fullWidth
          size="md"
        >
          Connect Organization
        </Button>
      </Stack>
    </form>
  );
}
