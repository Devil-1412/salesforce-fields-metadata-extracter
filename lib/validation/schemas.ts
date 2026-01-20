import { z, ZodError } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Strong password schema with comprehensive requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(255, 'Password is too long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character (!@#$%^&* etc.)');

/**
 * Email schema with format validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .transform((email) => email.toLowerCase().trim());

/**
 * UUID schema for IDs
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Salesforce object name schema
 */
export const objectNameSchema = z
  .string()
  .min(1, 'Object name is required')
  .max(255, 'Object name is too long')
  .regex(/^[a-zA-Z0-9_]+$/, 'Object name can only contain letters, numbers, and underscores');

/**
 * Salesforce access token schema
 */
export const accessTokenSchema = z.string().min(20, 'Invalid access token');

/**
 * Salesforce instance URL schema
 */
export const instanceUrlSchema = z
  .string()
  .url('Invalid instance URL')
  .startsWith('https://', 'Instance URL must use HTTPS');

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name is too long').optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ============================================================================
// SALESFORCE ORG SCHEMAS
// ============================================================================

export const addOrgSchema = z.object({
  orgEmail: emailSchema,
  orgPassword: z.string().min(1, 'Organization password is required').max(255),
  securityToken: z.string().min(1, 'Security token is required').max(255),
  isSandbox: z.boolean().default(false),
});

export const deleteOrgSchema = z.object({
  orgId: uuidSchema,
});

export const salesforceCredentialsSchema = z.object({
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const soqlQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(10000, 'Query is too long (max 10,000 characters)'),
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const saveQuerySchema = z.object({
  name: z.string().min(1, 'Query name is required').max(255, 'Query name too long'),
  query: z.string().min(1, 'Query is required').max(10000, 'Query is too long'),
});

export const deleteQuerySchema = z.object({
  queryId: uuidSchema,
});

// ============================================================================
// METADATA SCHEMAS
// ============================================================================

export const getObjectsSchema = z.object({
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const getFieldsSchema = z.object({
  objects: z.array(objectNameSchema).min(1, 'At least one object is required').max(50, 'Too many objects (max 50)'),
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const getObjectDetailsSchema = z.object({
  objectName: objectNameSchema,
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const getRecordCountSchema = z.object({
  objectName: objectNameSchema,
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const objectMetadataSchema = z.object({
  selectedObject: objectNameSchema,
  type: z.enum(['validationRules', 'triggers', 'apexClasses', 'workflows']),
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const fieldAnalysisSchema = z.object({
  objectName: objectNameSchema,
  type: z.enum(['sample', 'fieldCount', 'nullCount', 'percentPresent', 'distinctCount']),
  accessToken: accessTokenSchema,
  instanceUrl: instanceUrlSchema,
});

export const compareFieldsSchema = z.object({
  objectName: objectNameSchema,
  org1: salesforceCredentialsSchema,
  org2: salesforceCredentialsSchema,
});

export const compareObjectsSchema = z.object({
  org1: salesforceCredentialsSchema,
  org2: salesforceCredentialsSchema,
});

// ============================================================================
// PROFILE & SETTINGS SCHEMAS
// ============================================================================

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1).max(255).optional(),
    email: emailSchema.optional(),
  })
  .refine((data) => data.fullName || data.email, {
    message: 'At least one field (fullName or email) must be provided',
  });

export const securitySettingsSchema = z.object({
  action: z.enum([
    'toggle2FA',
    'updatePrivacy',
    'getSessions',
    'revokeSession',
    'revokeAllSessions',
    'getSecuritySettings',
  ]),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const userPreferencesSchema = z.object({
  preferences: z.record(z.string(), z.unknown()),
});

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    formattedErrors[path] = issue.message;
  }

  return formattedErrors;
}

// Type exports
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddOrgInput = z.infer<typeof addOrgSchema>;
export type SalesforceCredentials = z.infer<typeof salesforceCredentialsSchema>;
export type SoqlQueryInput = z.infer<typeof soqlQuerySchema>;
export type GetFieldsInput = z.infer<typeof getFieldsSchema>;
export type FieldAnalysisInput = z.infer<typeof fieldAnalysisSchema>;
