'use client';

import { useAuth } from '../context/authContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, LoadingOverlay } from '@mantine/core';

export default function AuthSessionLayer() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/verify-email',
    '/about',
    '/pricing',
    '/docs',
    '/contact'
  ];

  // Check if current path is public
  // We use startsWith to catch sub-routes if necessary, or strict equality
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || (route !== '/' && pathname?.startsWith(`${route}/`))
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      // If we're done loading, not authenticated, and trying to access a protected route
      console.log('Access denied to protected route, redirecting to login');
      const params = new URLSearchParams();
      if (pathname) {
          params.set('redirect', pathname);
      }
      router.push(`/login?${params.toString()}`);
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router, pathname]);

  // Show generic loading overlay only during the initial session check
  if (isLoading) {
    return (
        <Box pos="fixed" inset={0} style={{ zIndex: 9999 }}>
            <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'blue', type: 'bars' }} />
        </Box>
    );
  }

  // Once loaded, this layer is invisible (logic only)
  // unless we want to show a persistent indicator, but typically "layer" means logic middleware
  return null;
}
