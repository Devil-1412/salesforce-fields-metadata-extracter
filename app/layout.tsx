// app/layout.tsx
import '@mantine/core/styles.css';
import './globals.css';

import { ColorSchemeScript, Container, Flex, MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/authContext';

export const metadata = {
  title: 'Salesforce Metadata Extractor',
  description: 'Explore, compare, and analyze Salesforce metadata effortlessly.',
};

// Custom theme matching the existing design
const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  colors: {
    // Brand colors matching the existing blue theme
    brand: [
      '#eff6ff', // 50
      '#dbeafe', // 100
      '#bfdbfe', // 200
      '#93c5fd', // 300
      '#60a5fa', // 400
      '#3b82f6', // 500
      '#2563eb', // 600 - primary
      '#1d4ed8', // 700
      '#1e40af', // 800
      '#1e3a8a', // 900
    ],
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications />
          <AuthProvider>
            <Flex display="flex" direction="column" mih="100vh">
              <Navbar />
              <Container size="xl" flex={1} w="100%" py="xl">
                {children}
              </Container>
              <Footer />
            </Flex>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
