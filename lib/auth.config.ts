/**
 * Authentication Configuration
 * Centralized settings for token expiration and session management
 */

export interface AuthConfig {
  ACCESS_TOKEN_EXPIRY: number;
  REFRESH_TOKEN_EXPIRY: number;
  INACTIVITY_TIMEOUT: number;
  TOKEN_REFRESH_THRESHOLD: number;
  ACCESS_TOKEN_COOKIE: string;
  REFRESH_TOKEN_COOKIE: string;
  SF_TOKEN_COOKIE_PREFIX: string;
}

const AUTH_CONFIG: AuthConfig = {
  // Access token expiration (15 minutes in seconds)
  ACCESS_TOKEN_EXPIRY: 900,

  // Refresh token expiration (7 days in seconds)
  REFRESH_TOKEN_EXPIRY: 604800,

  // Inactivity timeout (30 minutes in milliseconds)
  INACTIVITY_TIMEOUT: 3600000,

  // Token refresh threshold - refresh if less than 5 minutes remaining (in seconds)
  TOKEN_REFRESH_THRESHOLD: 300,

  // Cookie names
  ACCESS_TOKEN_COOKIE: 'token',
  REFRESH_TOKEN_COOKIE: 'refresh_token',
  SF_TOKEN_COOKIE_PREFIX: 'sf_token_',
};

export default AUTH_CONFIG;
