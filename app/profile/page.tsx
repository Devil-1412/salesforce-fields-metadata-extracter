'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Center,
  Loader,
  Text,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuth } from '../context/authContext';

interface AuthContext {
  user: User | null;
  refreshUser: () => Promise<User | null>;
  logout: (sessionExpired?: boolean) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Co-located components
import ProfileSidebar from './components/ProfileSidebar';
import ProfileTab from './components/ProfileTab';
import OrganizationTab from './components/OrganizationTab';
import SecurityTab from './components/SecurityTab';
import PreferencesTab from './components/PreferencesTab';
import SupportTab from './components/SupportTab';

interface User {
  email?: string;
  full_name?: string;
  [key: string]: unknown;
}

interface Organization {
  id?: string;
  org_name?: string;
  org_email?: string;
  instance_url?: string;
  is_sandbox?: boolean;
  apiUsage?: { used?: number; limit?: number };
  [key: string]: unknown;
}

interface OrgFormData {
  orgEmail: string;
  orgPassword: string;
  securityToken: string;
  isSandbox: boolean;
}

interface Preferences {
  theme: string;
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  profileVisible: boolean;
  dataSharing: boolean;
}

interface Session {
  id: string;
  device_info?: string;
  user_agent?: string;
  ip_address?: string;
  last_activity: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth() as AuthContext;
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<User>({});
  const [organizations, setOrganizations] = useState<Organization[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgForm, setOrgForm] = useState<OrgFormData>({
    orgEmail: '',
    orgPassword: '',
    securityToken: '',
    isSandbox: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'light',
    notifications: true,
    emailUpdates: true,
    language: 'en',
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    profileVisible: true,
    dataSharing: false,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setLoading(false);
    }
  }, [authUser]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/userPreferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get' }),
      });
      const data = await res.json();
      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Fetch preferences error:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/securitySettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSessions' }),
      });
      const data = await res.json();
      if (data.success && data.data?.sessions) {
        setSessions(data.data.sessions);
      }
    } catch (err) {
      console.error('Fetch sessions error:', err);
    }
  };

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/listAllOrgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error('Failed to fetch orgs', err);
    }
  };

  useEffect(() => {
    fetchOrgs();
    fetchPreferences();
    fetchSessions();
  }, []);

  const handleAddOrg = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/addOrg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Organization added successfully');
        fetchOrgs();
        setOrgForm({
          orgEmail: '',
          orgPassword: '',
          securityToken: '',
          isSandbox: false,
        });
      } else {
        toast.error(data.error || 'Org could not be added.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred.');
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;

    try {
      const res = await fetch('/api/deleteOrg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Organization deleted successfully');
        fetchOrgs();
      } else {
        toast.error(data.error || 'Failed to delete organization');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete organization');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error(err);
      router.push('/login');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/updateProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          full_name: profileForm.full_name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully');
        setUser(data.user);
        refreshUser();
        setEditingProfile(false);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/changePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully');
        setShowPasswordChange(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to change password');
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/securitySettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          action: 'toggle2FA',
          data: { enabled },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSecuritySettings((prev) => ({
          ...prev,
          twoFactorEnabled: data.data.two_factor_enabled,
        }));
        toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(data.error || 'Failed to update 2FA settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update 2FA settings');
    }
  };

  const handleUpdatePrivacy = async (field: string, value: boolean) => {
    try {
      const updateData: Record<string, boolean> = {};
      updateData[field] = value;

      const res = await fetch('/api/securitySettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          action: 'updatePrivacy',
          data: updateData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSecuritySettings((prev) => ({
          ...prev,
          ...updateData,
        }));
        toast.success('Privacy settings updated');
      } else {
        toast.error(data.error || 'Failed to update privacy settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update privacy settings');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to sign out from all devices?')) return;

    try {
      const res = await fetch('/api/securitySettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          action: 'revokeAllSessions',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Signed out from all devices');
        setSessions([]);
      } else {
        toast.error(data.error || 'Failed to revoke sessions');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to revoke sessions');
    }
  };

  const handleUpdatePreferences = async (updatedPrefs: Preferences) => {
    try {
      const res = await fetch('/api/userPreferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          action: 'update',
          preferences: updatedPrefs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences);
        toast.success('Preferences saved successfully');
      } else {
        toast.error(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update preferences');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            user={user}
            organizations={organizations}
            editingProfile={editingProfile}
            setEditingProfile={setEditingProfile}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleUpdateProfile={handleUpdateProfile}
          />
        );
      case 'organization':
        return (
          <OrganizationTab
            organizations={organizations}
            orgForm={orgForm}
            setOrgForm={setOrgForm}
            handleAddOrg={handleAddOrg}
            handleDeleteOrg={handleDeleteOrg}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        );
      case 'security':
        return (
          <SecurityTab
            securitySettings={securitySettings}
            sessions={sessions}
            showPasswordChange={showPasswordChange}
            setShowPasswordChange={setShowPasswordChange}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            handleChangePassword={handleChangePassword}
            handleToggle2FA={handleToggle2FA}
            handleUpdatePrivacy={handleUpdatePrivacy}
            handleRevokeAllSessions={handleRevokeAllSessions}
          />
        );
      case 'preferences':
        return (
          <PreferencesTab
            preferences={preferences}
            handleUpdatePreferences={handleUpdatePreferences}
          />
        );
      case 'support':
        return <SupportTab />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Loader size="xl" color="blue" />
          <Text mt="md" c="dimmed">
            Loading profile...
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f9fafb 0%, #eff6ff 50%, #eef2ff 100%)',
      }}
      py="xl"
      px="md"
    >
      <Container size="xl">
        <Grid gutter="lg">
          {/* Sidebar */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <ProfileSidebar
              user={user}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />
          </Grid.Col>

          {/* Main Content */}
          <Grid.Col span={{ base: 12, lg: 9 }}>
            <Paper radius="lg" shadow="md" p={{ base: 'md', lg: 'xl' }} withBorder>
              {renderContent()}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
