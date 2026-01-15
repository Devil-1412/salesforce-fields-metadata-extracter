/**
 * Validation middleware for Next.js API routes
 * Provides helpers for schema validation with Zod
 */

import { formatZodErrors } from './schemas';

/**
 * Validate request body against a Zod schema
 * Returns validated data or sends error response
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 * @returns {object|null} - Validated data or null if validation failed
 */
export function validateRequestBody(schema, req, res) {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: "Invalid request data",
            details: formatZodErrors(result.error)
        });
        return null;
    }
    
    return result.data;
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 * @returns {object|null} - Validated data or null if validation failed
 */
export function validateQueryParams(schema, req, res) {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: "Invalid query parameters",
            details: formatZodErrors(result.error)
        });
        return null;
    }
    
    return result.data;
}

/**
 * Higher-order function to wrap API route with validation
 * Usage: export default withValidation(schema, handler)
 * 
 * @param {ZodSchema} schema - Zod schema for request body
 * @param {Function} handler - API route handler function
 * @returns {Function} - Wrapped handler with validation
 */
export function withValidation(schema, handler) {
    return async (req, res) => {
        const validatedData = validateRequestBody(schema, req, res);
        
        if (!validatedData) {
            // Response already sent by validateRequestBody
            return;
        }
        
        // Attach validated data to request
        req.validatedBody = validatedData;
        
        // Call the original handler
        return handler(req, res);
    };
}
