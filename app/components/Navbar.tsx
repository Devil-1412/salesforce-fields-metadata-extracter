'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppShell,
  Group,
  Button,
  Menu,
  Text,
  Avatar,
  UnstyledButton,
  Box,
  Burger,
  Drawer,
  Stack,
  NavLink,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import {
  IconSparkles,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconBolt,
} from '@tabler/icons-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/authContext';

interface NavItem {
  href?: string;
  label: string;
  dropdown?: { href: string; label: string }[];
}

interface User {
  full_name?: string;
  email?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth() as {
    isAuthenticated: boolean;
    user: User | null;
    logout: (sessionExpired?: boolean) => Promise<void>;
  };
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const fullName = user?.full_name || '';
  const userEmail = user?.email || '';

  const publicNav: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' },
    { href: '/about', label: 'About' },
  ];

  const privateNav: NavItem[] = [
    { href: '/', label: 'Dashboard' },
    {
      label: 'Object Analysis',
      dropdown: [
        { href: '/objectAnalysis', label: 'Object Analysis' },
        { href: '/metadata', label: 'Metadata' },
      ],
    },
    {
      label: 'Compare Orgs',
      dropdown: [
        { href: '/compare', label: 'Compare' },
        { href: '/compareFields', label: 'Compare Fields' },
      ],
    },
    { href: '/tools', label: 'Tools' },
    { href: '/soql', label: 'SOQL' },
  ];

  const navLinks = isAuthenticated ? privateNav : publicNav;

  return (
    <>
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Group justify="space-between" h={64} px="md" maw={1280} mx="auto">
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Group gap="sm">
              <ThemeIcon
                size={44}
                radius="md"
                variant="gradient"
                gradient={{ from: 'blue', to: 'indigo', deg: 135 }}
              >
                <IconSparkles size={24} color="white" />
              </ThemeIcon>
              <Box>
                <Text
                  fw={700}
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue.7', to: 'indigo.6', deg: 90 }}
                >
                  Metadata Extractor
                </Text>
                <Text size="xs" c="dimmed" mt={-4}>
                  Salesforce Tools
                </Text>
              </Box>
            </Group>
          </Link>

          {/* Desktop Navigation */}
          <Group gap="xs" visibleFrom="md">
            {navLinks.map((nav) => {
              if (nav.dropdown) {
                const isActive = nav.dropdown.some((opt) => pathname === opt.href);
                return (
                  <Menu key={nav.label} trigger="hover" openDelay={100} closeDelay={200} position="bottom-start">
                    <Menu.Target>
                      <Button
                        variant={isActive ? 'light' : 'subtle'}
                        color={isActive ? 'blue' : 'gray'}
                        rightSection={<IconChevronDown size={14} />}
                      >
                        {nav.label}
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {nav.dropdown.map((opt) => (
                        <Menu.Item
                          key={opt.href}
                          component={Link}
                          href={opt.href}
                          style={{
                            backgroundColor: pathname === opt.href ? 'var(--mantine-color-blue-0)' : undefined,
                            fontWeight: pathname === opt.href ? 600 : 400,
                          }}
                        >
                          {opt.label}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                );
              }

              return (
                <Button
                  key={nav.href}
                  component={Link}
                  href={nav.href!}
                  variant={pathname === nav.href ? 'light' : 'subtle'}
                  color={pathname === nav.href ? 'blue' : 'gray'}
                >
                  {nav.label}
                </Button>
              );
            })}
          </Group>

          {/* Right Section */}
          <Group gap="sm">
            {isAuthenticated ? (
              <Menu position="bottom-end" shadow="md" width={240}>
                <Menu.Target>
                  <UnstyledButton
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <Group gap="sm">
                      <Avatar
                        size="sm"
                        radius="xl"
                        color="blue"
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'indigo', deg: 135 }}
                      >
                        {(fullName || userEmail || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box visibleFrom="lg">
                        <Text size="sm" fw={600} c="gray.7">
                          {fullName || userEmail?.split('@')[0] || 'User'}
                        </Text>
                        <Text size="xs" c="dimmed" mt={-2}>
                          {fullName ? 'Member' : 'Welcome'}
                        </Text>
                      </Box>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Box px="sm" py="xs" style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
                    <Text size="sm" fw={600} truncate>{fullName || 'User'}</Text>
                    <Text size="xs" c="dimmed" truncate>{userEmail}</Text>
                  </Box>
                  <Divider my="xs" />
                  <Menu.Item component={Link} href="/plan" leftSection={<IconBolt size={16} />}>
                    Plan
                  </Menu.Item>
                  <Menu.Item component={Link} href="/profile" leftSection={<IconUser size={16} />}>
                    Profile
                  </Menu.Item>
                  <Divider my="xs" />
                  <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                component={Link}
                href="/login"
                variant="gradient"
                gradient={{ from: 'blue', to: 'indigo', deg: 135 }}
                visibleFrom="md"
              >
                Login
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Burger
              opened={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              hiddenFrom="md"
              size="sm"
            />
          </Group>
        </Group>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer
        opened={menuOpen}
        onClose={() => setMenuOpen(false)}
        position="right"
        size="xs"
        title="Menu"
      >
        <Stack gap="xs">
          {navLinks.map((nav) => {
            if (nav.dropdown) {
              return (
                <Box key={nav.label}>
                  <Text size="sm" fw={600} c="dimmed" mb="xs">{nav.label}</Text>
                  {nav.dropdown.map((opt) => (
                    <NavLink
                      key={opt.href}
                      component={Link}
                      href={opt.href}
                      label={opt.label}
                      active={pathname === opt.href}
                      onClick={() => setMenuOpen(false)}
                    />
                  ))}
                </Box>
              );
            }

            return (
              <NavLink
                key={nav.href}
                component={Link}
                href={nav.href!}
                label={nav.label}
                active={pathname === nav.href}
                onClick={() => setMenuOpen(false)}
              />
            );
          })}

          {!isAuthenticated && (
            <>
              <Divider my="sm" />
              <Button
                component={Link}
                href="/login"
                variant="gradient"
                gradient={{ from: 'blue', to: 'indigo', deg: 135 }}
                fullWidth
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Button>
            </>
          )}
        </Stack>
      </Drawer>

      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      />
    </>
  );
}
