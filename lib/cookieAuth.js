import { serialize } from 'cookie';

const AUTH_CONFIG = require('./auth.config');

/**
 * Helper to set authentication cookie (access token)
 * @param {object} res - Next.js response object
 * @param {string} token - JWT access token
 * @param {object} options - Cookie options
 */
export function setAuthCookie(res, token, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY, // 15 minutes
    path: '/',
    ...options
  };

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, token, cookieOptions));
}

/**
 * Helper to set refresh token cookie
 * @param {object} res - Next.js response object
 * @param {string} refreshToken - JWT refresh token
 * @param {object} options - Cookie options
 */
export function setRefreshTokenCookie(res, refreshToken, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY, // 7 days
    path: '/',
    ...options
  };

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions));
}

/**
 * Helper to set both access and refresh token cookies
 * @param {object} res - Next.js response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export function setAuthCookies(res, accessToken, refreshToken) {
  const cookies = [
    serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY,
      path: '/'
    }),
    serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY,
      path: '/'
    })
  ];

  res.setHeader('Set-Cookie', cookies);
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

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, '', cookieOptions));
}

/**
 * Helper to clear refresh token cookie
 * @param {object} res - Next.js response object
 */
export function clearRefreshTokenCookie(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  };

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, '', cookieOptions));
}

/**
 * Helper to clear both access and refresh token cookies
 * @param {object} res - Next.js response object
 */
export function clearAuthCookies(res) {
  const cookies = [
    serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/'
    }),
    serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/'
    })
  ];

  res.setHeader('Set-Cookie', cookies);
}

/**
 * Helper to extract access token from request cookies or header (fallback)
 * @param {object} req - Next.js request object
 * @returns {string|null} - JWT token or null
 */
export function getAuthToken(req) {
  // 1. Check cookies first
  if (req.cookies && req.cookies[AUTH_CONFIG.ACCESS_TOKEN_COOKIE]) {
    return req.cookies[AUTH_CONFIG.ACCESS_TOKEN_COOKIE];
  }

  // 2. Fallback to Authorization header (for backward compatibility during migration)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}

/**
 * Helper to extract refresh token from request cookies
 * @param {object} req - Next.js request object
 * @returns {string|null} - Refresh token or null
 */
export function getRefreshToken(req) {
  if (req.cookies && req.cookies[AUTH_CONFIG.REFRESH_TOKEN_COOKIE]) {
    return req.cookies[AUTH_CONFIG.REFRESH_TOKEN_COOKIE];
  }

  return null;
}
