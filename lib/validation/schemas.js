import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Strong password schema with comprehensive requirements
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 * - At least one special character (optional but recommended)
 */
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password is too long")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character (!@#$%^&* etc.)");

/**
 * Email schema with format validation
 */
export const emailSchema = z
    .string()
    .email("Invalid email format")
    .max(255, "Email is too long")
    .transform(email => email.toLowerCase().trim());

/**
 * UUID schema for IDs
 */
export const uuidSchema = z
    .string()
    .uuid("Invalid ID format");

/**
 * Salesforce object name schema
 * Allows alphanumeric characters and underscores
 */
export const objectNameSchema = z
    .string()
    .min(1, "Object name is required")
    .max(255, "Object name is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Object name can only contain letters, numbers, and underscores");

/**
 * Salesforce access token schema
 */
export const accessTokenSchema = z
    .string()
    .min(20, "Invalid access token");

/**
 * Salesforce instance URL schema
 */
export const instanceUrlSchema = z
    .string()
    .url("Invalid instance URL")
    .startsWith("https://", "Instance URL must use HTTPS");

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Signup request validation
 */
export const signupSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(1, "Full name is required").max(255, "Full name is too long").optional()
});

/**
 * Login request validation
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required")
});

/**
 * Change password request validation
 */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema
});

// ============================================================================
// SALESFORCE ORG SCHEMAS
// ============================================================================

/**
 * Add Salesforce org validation
 */
export const addOrgSchema = z.object({
    orgEmail: emailSchema,
    orgPassword: z.string().min(1, "Organization password is required").max(255),
    securityToken: z.string().min(1, "Security token is required").max(255),
    isSandbox: z.boolean().default(false)
});

/**
 * Delete org validation
 */
export const deleteOrgSchema = z.object({
    orgId: uuidSchema
});

/**
 * Salesforce credentials validation (for API calls)
 */
export const salesforceCredentialsSchema = z.object({
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * SOQL query execution validation
 * Limits query size to prevent abuse
 */
export const soqlQuerySchema = z.object({
    query: z
        .string()
        .min(1, "Query is required")
        .max(10000, "Query is too long (max 10,000 characters)"),
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Save query validation
 */
export const saveQuerySchema = z.object({
    name: z
        .string()
        .min(1, "Query name is required")
        .max(255, "Query name too long"),
    query: z
        .string()
        .min(1, "Query is required")
        .max(10000, "Query is too long")
});

/**
 * Delete query validation
 */
export const deleteQuerySchema = z.object({
    queryId: uuidSchema
});

// ============================================================================
// METADATA SCHEMAS
// ============================================================================

/**
 * Get objects validation
 */
export const getObjectsSchema = z.object({
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Get fields validation
 */
export const getFieldsSchema = z.object({
    objects: z
        .array(objectNameSchema)
        .min(1, "At least one object is required")
        .max(50, "Too many objects (max 50)"),
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Get object details validation
 */
export const getObjectDetailsSchema = z.object({
    objectName: objectNameSchema,
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Get record count validation
 */
export const getRecordCountSchema = z.object({
    objectName: objectNameSchema,
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Object metadata validation
 */
export const objectMetadataSchema = z.object({
    selectedObject: objectNameSchema,
    type: z.enum(["validationRules", "triggers", "apexClasses", "workflows"]),
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Field analysis validation
 */
export const fieldAnalysisSchema = z.object({
    objectName: objectNameSchema,
    type: z.enum(["sample", "fieldCount", "nullCount", "percentPresent", "distinctCount"]),
    accessToken: accessTokenSchema,
    instanceUrl: instanceUrlSchema
});

/**
 * Compare fields validation
 */
export const compareFieldsSchema = z.object({
    objectName: objectNameSchema,
    org1: salesforceCredentialsSchema,
    org2: salesforceCredentialsSchema
});

/**
 * Compare objects validation
 */
export const compareObjectsSchema = z.object({
    org1: salesforceCredentialsSchema,
    org2: salesforceCredentialsSchema
});

// ============================================================================
// PROFILE & SETTINGS SCHEMAS
// ============================================================================

/**
 * Update profile validation
 */
export const updateProfileSchema = z.object({
    fullName: z.string().min(1).max(255).optional(),
    email: emailSchema.optional()
}).refine(data => data.fullName || data.email, {
    message: "At least one field (fullName or email) must be provided"
});

/**
 * Security settings action validation
 */
export const securitySettingsSchema = z.object({
    action: z.enum([
        "toggle2FA",
        "updatePrivacy",
        "getSessions",
        "revokeSession",
        "revokeAllSessions",
        "getSecuritySettings"
    ]),
    data: z.record(z.any()).optional()
});

/**
 * User preferences validation
 */
export const userPreferencesSchema = z.object({
    preferences: z.record(z.any())
});

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Format Zod errors into user-friendly messages
 * @param {ZodError} error - Zod validation error
 * @returns {Object} - Formatted error object
 */
export function formatZodErrors(error) {
    const formattedErrors = {};
    
    error.errors.forEach(err => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
    });
    
    return formattedErrors;
}
