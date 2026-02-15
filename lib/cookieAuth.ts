import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';
import AUTH_CONFIG from './auth.config';
import { decrypt, encrypt } from './encryption';

type CookieSerializeOptions = Parameters<typeof serialize>[2];

/**
 * Helper to set authentication cookie (access token)
 */
export function setAuthCookie(
  res: NextApiResponse,
  token: string,
  options: Partial<CookieSerializeOptions> = {}
): void {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY,
    path: '/',
    ...options,
  };

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, token, cookieOptions));
}

/**
 * Helper to set refresh token cookie
 */
export function setRefreshTokenCookie(
  res: NextApiResponse,
  refreshToken: string,
  options: Partial<CookieSerializeOptions> = {}
): void {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY,
    path: '/',
    ...options,
  };

  res.setHeader(
    'Set-Cookie',
    serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions)
  );
}

/**
 * Helper to set both access and refresh token cookies
 */
export function setAuthCookies(
  res: NextApiResponse,
  accessToken: string,
  refreshToken: string
): void {
  const cookies = [
    serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY,
      path: '/',
    }),
    serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY,
      path: '/',
    }),
  ];

  res.setHeader('Set-Cookie', cookies);
}

/**
 * Helper to clear authentication cookie
 */
export function clearAuthCookie(res: NextApiResponse): void {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  };

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, '', cookieOptions));
}

/**
 * Helper to clear refresh token cookie
 */
export function clearRefreshTokenCookie(res: NextApiResponse): void {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  };

  res.setHeader('Set-Cookie', serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, '', cookieOptions));
}

/**
 * Helper to clear both access and refresh token cookies
 */
export function clearAuthCookies(res: NextApiResponse): void {
  const cookies = [
    serialize(AUTH_CONFIG.ACCESS_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/',
    }),
    serialize(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/',
    }),
  ];

  res.setHeader('Set-Cookie', cookies);
}

/**
 * Helper to extract access token from request cookies or header (fallback)
 */
export function getAuthToken(req: NextApiRequest): string | null {
  // 1. Check cookies first
  const cookieToken = req.cookies?.[AUTH_CONFIG.ACCESS_TOKEN_COOKIE];
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Fallback to Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1] || null;
  }

  return null;
}

/**
 * Helper to extract refresh token from request cookies
 */
export function getRefreshToken(req: NextApiRequest): string | null {
  const refreshToken = req.cookies?.[AUTH_CONFIG.REFRESH_TOKEN_COOKIE];
  return refreshToken ?? null;
}

/**
 * Generate a safe cookie key from instance URL
 */
function generateCookieKey(instanceUrl: string): string {
  // Simple base64 encoding to make it cookie-safe
  try {
    const safeUrl = Buffer.from(instanceUrl).toString('base64').replace(/=/g, '');
    return `${AUTH_CONFIG.SF_TOKEN_COOKIE_PREFIX}${safeUrl}`;
  } catch (e) {
    return `${AUTH_CONFIG.SF_TOKEN_COOKIE_PREFIX}default`;
  }
}

/**
 * Helper to set Salesforce access token cookie (encrypted)
 */
export function setSalesforceTokenCookie(
  res: NextApiResponse,
  token: string,
  instanceUrl: string,
  options: Partial<CookieSerializeOptions> = {}
): void {
  try {
    const cookieName = generateCookieKey(instanceUrl);
    // Encrypt the token before storing
    const encryptedToken = encrypt(token);

    const cookieOptions: CookieSerializeOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200, // 2 hours (Salesforce session expiry)
      path: '/',
      ...options,
    };

    res.setHeader('Set-Cookie', serialize(cookieName, encryptedToken, cookieOptions));
  } catch (err) {
    console.error(`Failed to set Salesforce token cookie for ${instanceUrl}:`, err);
  }
}

/**
 * Helper to get Salesforce access token from cookie (decrypted)
 */
export function getSalesforceToken(req: NextApiRequest, instanceUrl: string): string | null {
  try {
    const cookieName = generateCookieKey(instanceUrl);
    const encryptedToken = req.cookies?.[cookieName];

    if (!encryptedToken) {
      return null;
    }

    // Decrypt the token
    return decrypt(encryptedToken);
  } catch (err) {
    console.warn(`Failed to decrypt Salesforce token for ${instanceUrl}:`, err);
    return null;
  }
}
