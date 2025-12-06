import { serialize } from 'cookie';

/**
 * Helper to set authentication cookie
 * @param {object} res - Next.js response object
 * @param {string} token - JWT token
 * @param {object} options - Cookie options
 */
export function setAuthCookie(res, token, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    ...options
  };

  res.setHeader('Set-Cookie', serialize('token', token, cookieOptions));
}

/**
 * Helper to clear authentication cookie
 * @param {object} res - Next.js response object
 */
export function clearAuthCookie(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  };

  res.setHeader('Set-Cookie', serialize('token', '', cookieOptions));
}

/**
 * Helper to extract token from request cookies or header (fallback)
 * @param {object} req - Next.js request object
 * @returns {string|null} - JWT token or null
 */
export function getAuthToken(req) {
  // 1. Check cookies first
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 2. Fallback to Authorization header (for backward compatibility during migration)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}
