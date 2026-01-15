/**
 * Error handling utilities for API routes
 * Sanitizes errors for client response while logging full details server-side
 */

/**
 * Log error details server-side (full stack trace, context)
 * @param {Error} error - The error object
 * @param {object} req - Next.js request object
 * @param {string} context - Context/endpoint name
 */
export function logError(error, req, context = 'API') {
    const timestamp = new Date().toISOString();
    const errorDetails = {
        timestamp,
        context,
        endpoint: req?.url || 'unknown',
        method: req?.method || 'unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Error',
    };

    console.error(`[${context} Error]`, errorDetails);
    
    // In production, you'd send this to error tracking service (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   sendToSentry(errorDetails);
    // }
}

/**
 * Sanitize error for client response
 * Returns generic messages in production, detailed in development
 * @param {Error} error - The error object
 * @returns {string} - Sanitized error message safe for client
 */
export function sanitizeError(error) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, show actual errors for debugging
    if (isDevelopment) {
        return error?.message || 'An error occurred';
    }
    
    // In production, return generic messages based on error type
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // Authentication/Authorization errors - safe to specify
    if (errorMessage.includes('auth') || 
        errorMessage.includes('token') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden')) {
        return 'Authentication failed';
    }
    
    // Database errors - generic message
    if (errorMessage.includes('database') || 
        errorMessage.includes('query') ||
        errorMessage.includes('supabase') ||
        errorMessage.includes('postgres')) {
        return 'Database operation failed';
    }
    
    // Network/connection errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
        return 'Service temporarily unavailable';
    }
    
    // Salesforce-specific errors - can be more specific
    if (errorMessage.includes('salesforce') || 
        errorMessage.includes('jsforce')) {
        return 'Salesforce operation failed';
    }
    
    // Validation errors - already handled by Zod, shouldn't reach here
    if (errorMessage.includes('validation') || 
        errorMessage.includes('invalid')) {
        return 'Invalid request data';
    }
    
    // Default generic message for any other error
    return 'An unexpected error occurred';
}

/**
 * Combined error handler for API routes
 * Logs full error details and sends sanitized error to client
 * @param {Error} error - The error object
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 * @param {string} context - Context/endpoint name
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export function handleApiError(error, req, res, context = 'API', statusCode = 500) {
    // Log full error details server-side
    logError(error, req, context);
    
    // Send sanitized error to client
    const sanitizedMessage = sanitizeError(error);
    
    return res.status(statusCode).json({
        success: false,
        error: sanitizedMessage,
        // In development, include stack trace
        ...(process.env.NODE_ENV === 'development' && {
            _dev: {
                originalError: error?.message,
                stack: error?.stack
            }
        })
    });
}

/**
 * Check if error is safe to expose to client
 * @param {Error} error - The error object
 * @returns {boolean} - True if error message can be shown to client
 */
export function isSafeError(error) {
    const safeErrorTypes = [
        'ValidationError',
        'ZodError',
        'AuthenticationError',
        'NotFoundError'
    ];
    
    return safeErrorTypes.includes(error?.name);
}
