import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side route protection.
 * Checks for the `token` cookie (set by /api/login) before allowing
 * access to protected routes. Redirects to /login if missing.
 */

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/about',
  '/pricing',
  '/docs',
  '/contact',
  '/feedback',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, Next.js internals, auth callbacks, and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') // static files (favicon.ico, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
