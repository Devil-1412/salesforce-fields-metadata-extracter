# API Documentation - Salesforce Metadata Extractor

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [Salesforce Organization APIs](#salesforce-organization-apis)
- [Metadata & Object APIs](#metadata--object-apis)
- [SOQL & Query APIs](#soql--query-apis)
- [User Profile APIs](#user-profile-apis)
- [Saved Queries APIs](#saved-queries-apis)
- [Comparison APIs](#comparison-apis)

---

## Rate Limiting

**All JSForce-based APIs** are rate limited:

- **Limit**: 100 requests per minute per user
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `Retry-After`: Seconds to wait if rate limited (429 response)

---

## Authentication APIs

### POST `/api/signup`

**Purpose**: Create a new user account

**Auth Required**: No

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "User created. Please verify your email if required.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Validation**:

- Email must be valid format
- Password minimum 8 characters with letters and numbers
- Rate limited: 10 requests per minute per IP

---

### POST `/api/login`

**Purpose**: Authenticate user and create session

**Auth Required**: No

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "hasOrganization": true
}
```

**Features**:

- Sets httpOnly cookies for access token (15 min expiry) and refresh token (7 day expiry)
- Tracks session in `active_sessions` table
- Captures IP address, device info, user agent
- Checks if user has linked Salesforce orgs
- Tokens are NOT returned in response body (stored in cookies only)

---

### POST `/api/refresh`

**Purpose**: Refresh expired access token using refresh token

**Auth Required**: Yes (refresh token in httpOnly cookie)

**Request Body**: None (tokens read from cookies)

**Response** (200):

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "expiresIn": 900
}
```

**Response** (401 - refresh token expired):

```json
{
  "success": false,
  "error": "Invalid or expired refresh token",
  "requiresLogin": true
}
```

**Features**:

- Uses Supabase's `refreshSession()` for token rotation
- Updates `active_sessions` table with new access token
- Sets new access and refresh token cookies
- Implements refresh token rotation (one-time use)
- Automatic frontend refresh happens every 12 minutes

---

### POST `/api/logout`

**Purpose**: Invalidate user session and clear tokens

**Auth Required**: Yes (httpOnly cookie)

**Request Headers**: None (token read from cookie)

**Request Body**: None

**Response** (200):

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Features**:

- Removes session from `active_sessions` table
- Calls Supabase Auth admin signOut
- Clears both access and refresh token cookies

---

### POST `/api/changePassword`

**Purpose**: Update user password

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## Salesforce Organization APIs

### POST `/api/salesforceLogin`

**Purpose**: Authenticate to all user's Salesforce orgs

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{}
```

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "accessToken": "00D...",
      "instanceUrl": "https://na123.salesforce.com",
      "orgName": "My Org",
      "success": true
    }
  ],
  "failed": []
}
```

**Features**:

- Decrypts stored credentials (AES-256)
- Logs into all user's orgs concurrently
- Returns access tokens and instance URLs

---

### POST `/api/addOrg`

**Purpose**: Add new Salesforce org to user account

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "orgEmail": "admin@company.com",
  "orgPassword": "password123",
  "securityToken": "ABC123XYZ",
  "isSandbox": false
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "Organization connected and verified successfully",
  "instanceUrl": "https://na123.salesforce.com"
}
```

**Features**:

- Validates credentials by logging into Salesforce
- Encrypts password and security token (AES-256)
- Stores encrypted credentials in database

---

### POST `/api/deleteOrg`

**Purpose**: Remove Salesforce org from user account

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{
  "orgId": "org-uuid"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

---

## Metadata & Object APIs

### POST `/api/objects`

**Purpose**: List all Salesforce objects in org

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com"
}
```

**Response** (200):

```json
{
  "success": true,
  "object": [
    {
      "name": "Account",
      "label": "Account",
      "keyPrefix": "001",
      "custom": false,
      "createdById": "005...",
      "createdDate": "2024-01-01T00:00:00.000Z",
      "lastModifiedById": "005...",
      "lastModifiedDate": "2024-06-15T10:30:00.000Z"
    }
  ]
}
```

**Features**:

- Uses `describeGlobal()` to get all objects
- Fetches metadata for creation/modification info
- Returns both standard and custom objects

---

### POST `/api/fields`

**Purpose**: Get field metadata for specified objects

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "objects": ["Account", "Contact"]
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "Account": [
      {
        "label": "Account Name",
        "ApiName": "Name",
        "type": "string",
        "length": 255,
        "Nullable": false,
        "Createable": true,
        "Updateable": true,
        "PicklistValues": [],
        "Description": "Account name"
      }
    ]
  }
}
```

**Features**:

- Describes each object to get field details
- Returns comprehensive field metadata (50+ properties)
- Includes picklist values, relationships, validation rules

---

### POST `/api/getObjectDetails`

**Purpose**: Get detailed metadata for a single object

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "objectName": "Account"
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "name": "Account",
    "label": "Account",
    "fields": [...],
    "recordTypeInfos": [...],
    "childRelationships": [...]
  }
}
```

---

### POST `/api/getRecordCount`

**Purpose**: Get record count for an object

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "objectName": "Account"
}
```

**Response** (200):

```json
{
  "success": true,
  "count": 12543
}
```

**Query**: `SELECT COUNT() FROM ObjectName`

---

### POST `/api/objectMetadata`

**Purpose**: Get validation rules, triggers, workflows, apex classes

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "selectedObject": "Account",
  "type": "validationRules"
}
```

**Type Options**:

- `validationRules` - Get validation rules
- `triggers` - Get Apex triggers
- `apexClasses` - Get related Apex classes
- `workflows` - Get workflow rules

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "03d...",
      "name": "Check_Credit_Limit",
      "active": true,
      "errorMessage": "Credit limit exceeded"
    }
  ]
}
```

---

### POST `/api/fieldAnalysis`

**Purpose**: Analyze field usage and statistics

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "objectName": "Account",
  "type": "sample"
}
```

**Type Options**:

- `sample` - Get sample values for all fields
- `fieldCount` - Count non-null values per field
- `nullCount` - Count null values per field
- `percentPresent` - Calculate % of records with data
- `distinctCount` - Count distinct values per field

**Response** (200):

```json
{
  "success": true,
  "data": {
    "Name": "Acme Corporation",
    "Phone": "(555) 123-4567",
    "Industry": "Technology"
  }
}
```

---

### POST `/api/metadata/describe`

**Purpose**: Generic metadata describe endpoint

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body** (for specific object):

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "objectName": "Account"
}
```

**Request Body** (for all objects):

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com"
}
```

**Response** (200 - specific object):

```json
{
  "success": true,
  "data": {
    "name": "Account",
    "label": "Account",
    "fields": [
      {
        "name": "Id",
        "label": "Account ID",
        "type": "id",
        "sortable": true,
        "filterable": true
      }
    ]
  }
}
```

**Response** (200 - all objects):

```json
{
  "success": true,
  "data": [
    {
      "name": "Account",
      "label": "Account",
      "labelPlural": "Accounts",
      "keyPrefix": "001"
    }
  ]
}
```

---

## SOQL & Query APIs

### POST `/api/soql`

**Purpose**: Execute SOQL query

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "accessToken": "00D...",
  "instanceUrl": "https://na123.salesforce.com",
  "query": "SELECT Id, Name FROM Account LIMIT 10"
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "totalSize": 10,
    "done": true,
    "records": [
      {
        "attributes": {
          "type": "Account",
          "url": "/services/data/v60.0/sobjects/Account/001..."
        },
        "Id": "001...",
        "Name": "Acme Corporation"
      }
    ]
  }
}
```

**⚠️ Security Note**: Currently executes queries without validation (CRITICAL VULNERABILITY - pending fix)

---

### POST `/api/queries/save`

**Purpose**: Save SOQL query to user's library

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{
  "name": "All Active Accounts",
  "query": "SELECT Id, Name FROM Account WHERE IsActive = true"
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "Query saved successfully",
  "queryId": "query-uuid"
}
```

---

### POST `/api/queries/list`

**Purpose**: List all saved queries for user

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{}
```

**Response** (200):

```json
{
  "success": true,
  "queries": [
    {
      "id": "uuid",
      "name": "All Active Accounts",
      "query": "SELECT Id, Name FROM Account WHERE IsActive = true",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/queries/delete`

**Purpose**: Delete saved query

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{
  "queryId": "query-uuid"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Query deleted successfully"
}
```

---

## User Profile APIs

### POST `/api/profile`

**Purpose**: Get user profile and org API usage

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{}
```

**Response** (200):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "user@example.com",
    "plan": "free"
  },
  "organization": [
    {
      "id": "org-uuid",
      "org_email": "admin@company.com",
      "instance_url": "https://na123.salesforce.com",
      "is_sandbox": false,
      "apiUsage": {
        "limit": 15000,
        "used": 14500
      }
    }
  ]
}
```

**Features**:

- Fetches user profile from `profiles` table
- Logs into each org to get API usage limits
- Decrypts credentials (AES-256) for auth

---

### POST `/api/updateProfile`

**Purpose**: Update user profile information

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{
  "fullName": "John Smith",
  "email": "newEmail@example.com"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### POST `/api/securitySettings`

**Purpose**: Get user's active sessions and security settings

**Auth Required**: Yes (Bearer token)

**Request Body**:

```json
{}
```

**Response** (200):

```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-uuid",
      "device_info": "Windows PC",
      "ip_address": "192.168.1.100",
      "last_activity": "2024-01-15T14:30:00.000Z",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "twoFactorEnabled": false
}
```

---

### POST `/api/userPreferences`

**Purpose**: Get/update user preferences

**Auth Required**: Yes (Bearer token)

**Request Body** (GET):

```json
{
  "action": "get"
}
```

**Request Body** (UPDATE):

```json
{
  "action": "update",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Response** (200):

```json
{
  "success": true,
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

---

## Comparison APIs

### POST `/api/compareObjects`

**Purpose**: Compare objects between two Salesforce orgs

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "org1": {
    "accessToken": "00D...",
    "instanceUrl": "https://na123.salesforce.com"
  },
  "org2": {
    "accessToken": "00D...",
    "instanceUrl": "https://cs45.salesforce.com"
  }
}
```

**Response** (200):

```json
{
  "comparison": [
    {
      "keyPrefix": "001",
      "objectName": "Account",
      "org1Present": true,
      "org2Present": true
    },
    {
      "keyPrefix": "a00",
      "objectName": "CustomObject__c",
      "org1Present": true,
      "org2Present": false
    }
  ]
}
```

**Features**:

- Compares object presence across orgs
- Shows which objects exist in each org
- Useful for org synchronization analysis

---

### POST `/api/compareFields`

**Purpose**: Compare field definitions between two orgs

**Auth Required**: Yes (Bearer token)

**Rate Limited**: Yes

**Request Body**:

```json
{
  "selectedObjects": ["Account", "Contact"],
  "org1": {
    "accessToken": "00D...",
    "instanceUrl": "https://na123.salesforce.com"
  },
  "org2": {
    "accessToken": "00D...",
    "instanceUrl": "https://cs45.salesforce.com"
  }
}
```

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "objectName": "Account",
      "fields": [
        {
          "fieldName": "CustomField__c",
          "type1": "text",
          "type2": "text",
          "length1": 255,
          "length2": 100,
          "required1": false,
          "required2": true,
          "diff": true
        }
      ]
    }
  ]
}
```

**Features**:

- Compares field types, lengths, and requirements
- Highlights differences between orgs
- Useful for deployment validation

---

## Error Responses

All APIs follow a consistent error response format:

### 400 - Bad Request

```json
{
  "success": false,
  "error": "Missing required parameters"
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing authentication token"
}
```

### 429 - Too Many Requests

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "error": "Server error"
}
```

---

## Security Features

### Implemented ✅

- **Rate Limiting**: 100 req/min per user on all JSForce APIs
- **Encryption**: AES-256 encryption for Salesforce credentials
- **Session Tracking**: Active sessions with device and IP tracking
- **Authentication**: JWT-based authentication via Supabase
- **Password Validation**: Minimum 8 characters with letters and numbers

### Pending ⚠️

- **SOQL Validation**: Query sanitization and validation (vulnerability 1.3)
- **CSRF Protection**: Token validation on state-changing operations
- **2FA/MFA**: Two-factor authentication implementation
- **Input Sanitization**: Cross-site scripting (XSS) protection

---

## Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Encryption
ENCRYPTION_KEY=64-character-hex-string
```

---

## Common Request Patterns

### Making Authenticated Requests

```javascript
const token = localStorage.getItem("token");

fetch("/api/objects", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    accessToken: sfAccessToken,
    instanceUrl: sfInstanceUrl,
  }),
});
```

### Handling Rate Limits

```javascript
const response = await fetch('/api/objects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
});

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  // Wait and retry
}
```

### Checking Rate Limit Status

```javascript
const remaining = response.headers.get("X-RateLimit-Remaining");
const limit = response.headers.get("X-RateLimit-Limit");
console.log(`${remaining}/${limit} requests remaining`);
```

---

## API Versioning

Current Version: **v1** (implicit)

All APIs are currently unversioned. Future versions may use path-based versioning:

- `/api/v1/objects`
- `/api/v2/objects`
