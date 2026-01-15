/**
 * Content-Type validation middleware
 * Prevents MIME confusion attacks by ensuring correct Content-Type headers
 */

/**
 * Validate that request has correct Content-Type header
 * Should be called for POST/PUT/PATCH requests expecting JSON
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 * @returns {boolean} - True if valid, false if invalid (response already sent)
 */
export function validateContentType(req, res) {
    // Only validate for methods that send body data
    const methodsRequiringContentType = ['POST', 'PUT', 'PATCH'];
    
    if (!methodsRequiringContentType.includes(req.method)) {
        return true; // GET, DELETE, etc. don't need Content-Type validation
    }
    
    const contentType = req.headers['content-type'];
    
    // Check if Content-Type header exists
    if (!contentType) {
        res.status(400).json({
            success: false,
            error: 'Missing Content-Type header'
        });
        return false;
    }
    
    // Check if Content-Type is application/json (may include charset)
    // Examples: "application/json" or "application/json; charset=utf-8"
    if (!contentType.toLowerCase().includes('application/json')) {
        res.status(415).json({ // 415 = Unsupported Media Type
            success: false,
            error: 'Content-Type must be application/json'
        });
        return false;
    }
    
    return true;
}

/**
 * Higher-order function to wrap API routes with Content-Type validation
 * Usage: export default withContentType(handler)
 * 
 * @param {Function} handler - API route handler
 * @returns {Function} - Wrapped handler with Content-Type validation
 */
export function withContentType(handler) {
    return async (req, res) => {
        // Validate Content-Type
        if (!validateContentType(req, res)) {
            // Response already sent by validateContentType
            return;
        }
        
        // Call original handler
        return handler(req, res);
    };
}
