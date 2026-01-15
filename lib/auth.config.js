/**
 * Authentication Configuration
 * Centralized settings for token expiration and session management
 */

const AUTH_CONFIG = {
    // Access token expiration (15 minutes in seconds)
    ACCESS_TOKEN_EXPIRY: 3600,
    
    // Refresh token expiration (7 days in seconds)
    REFRESH_TOKEN_EXPIRY: 604800,
    
    // Inactivity timeout (30 minutes in milliseconds)
    INACTIVITY_TIMEOUT: 1800000,
    
    // Token refresh threshold - refresh if less than 5 minutes remaining (in seconds)
    TOKEN_REFRESH_THRESHOLD: 300,
    
    // Cookie names
    ACCESS_TOKEN_COOKIE: 'token',
    REFRESH_TOKEN_COOKIE: 'refresh_token',
};

module.exports = AUTH_CONFIG;
