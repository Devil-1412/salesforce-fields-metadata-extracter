'use client';

import { Box, Container, Grid, Text, Stack, Anchor } from '@mantine/core';

export default function Footer() {
  return (
    <Box
      component="footer"
      mt="xl"
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #4338ca 50%, #1e3a8a 100%)',
        color: 'white',
        borderRadius: '1.5rem 1.5rem 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient glow */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at top left, rgba(255,255,255,0.15), transparent 60%)',
        }}
      />

      <Container size="xl" py={56} pos="relative">
        <Grid gutter={40}>
          {/* About */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Text size="lg" fw={600} mb="md">
              About
            </Text>
            <Text size="sm" c="blue.1" lh={1.6}>
              A modern platform to explore, compare, and analyze Salesforce metadata efficiently.
            </Text>
          </Grid.Col>

          {/* Quick Links */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Text size="lg" fw={600} mb="md">
              Quick Links
            </Text>
            <Stack gap="xs">
              {['Home', 'Pricing', 'Docs', 'About'].map((label) => {
                const href = label === 'Home' ? '/' : `/${label.toLowerCase()}`;
                return (
                  <Anchor
                    key={label}
                    href={href}
                    c="blue.1"
                    size="sm"
                    underline="hover"
                    style={{ transition: 'color 0.2s' }}
                  >
                    › {label}
                  </Anchor>
                );
              })}
            </Stack>
          </Grid.Col>

          {/* Resources */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Text size="lg" fw={600} mb="md">
              Resources
            </Text>
            <Stack gap="xs">
              <Anchor href="/docs" c="blue.1" size="sm" underline="hover">
                › Documentation
              </Anchor>
              <Anchor
                href="https://developer.salesforce.com"
                target="_blank"
                rel="noopener noreferrer"
                c="blue.1"
                size="sm"
                underline="hover"
              >
                › Salesforce Dev Docs
              </Anchor>
            </Stack>
          </Grid.Col>

          {/* Contact */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Text size="lg" fw={600} mb="md">
              Contact
            </Text>
            <Stack gap="xs">
              <Text size="sm" c="blue.1">
                📧 support@salesmeta.ai
              </Text>
              <Text size="sm" c="blue.1">
                📍 India
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        <Box
          mt={40}
          pt="md"
          style={{
            borderTop: '1px solid rgba(59, 130, 246, 0.5)',
            textAlign: 'center',
          }}
        >
          <Text size="sm" c="blue.1">
            © {new Date().getFullYear()}{' '}
            <Text span fw={600} c="white">
              Metadata Extractor
            </Text>{' '}
            — All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
