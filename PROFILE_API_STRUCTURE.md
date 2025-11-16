# Profile Page API Structure Recommendation

Based on your existing API pattern (one file per endpoint), here's the recommended structure:

## 📋 Current Status

### ✅ Already Working
- **`/api/profile`** - Fetches user profile and organizations
- **`/api/addOrg`** - Adds new Salesforce organization (already handles `is_sandbox`)

### ⚠️ Needs Update
- **`/api/profile.js`** - Needs to return `is_sandbox` field for organizations

---

## 🎯 Recommended API Structure

### 1. **Update Existing Files**

#### `/api/profile.js` - UPDATE
**Purpose**: Fetch user profile and organizations  
**Changes Needed**:
- Add `is_sandbox` field to organization query
- Return organization data with all fields

```javascript
// Update line 30 to include is_sandbox
.select("org_email, instance_url, is_sandbox")
```

---

### 2. **Create New API Files** (Following your pattern)

#### `/api/updateProfile.js` - NEW FILE
**Purpose**: Update user profile information  
**Methods**: POST  
**Body**: `{ email, full_name }`  
**Returns**: Updated user profile

**Use Cases**:
- Update full name
- Update email (with verification)

---

#### `/api/changePassword.js` - NEW FILE
**Purpose**: Change user password  
**Methods**: POST  
**Body**: `{ email, currentPassword, newPassword }`  
**Returns**: Success/error message

**Security**:
- Verify current password
- Hash new password
- Update in database

---

#### `/api/securitySettings.js` - NEW FILE
**Purpose**: Manage security settings (2FA, privacy, sessions)  
**Methods**: POST  
**Body**: `{ email, action, data }`

**Actions**:
- `toggle2FA` - Enable/disable 2FA
- `updatePrivacy` - Update privacy settings
- `getSessions` - Get active sessions
- `revokeSession` - Revoke specific session
- `revokeAllSessions` - Sign out from all devices

**Example**:
```javascript
// Enable 2FA
{ email, action: "toggle2FA", enabled: true }

// Update privacy
{ email, action: "updatePrivacy", profileVisible: true, dataSharing: false }

// Get sessions
{ email, action: "getSessions" }

// Revoke all
{ email, action: "revokeAllSessions" }
```

---

#### `/api/userPreferences.js` - NEW FILE
**Purpose**: Manage user preferences (theme, notifications, language)  
**Methods**: POST  
**Body**: `{ email, preferences }`

**Preferences Object**:
```javascript
{
  theme: "light" | "dark",
  notifications: boolean,
  emailUpdates: boolean,
  language: "en" | "es" | "fr" | "de"
}
```

**Actions**:
- `update` - Update all preferences
- `get` - Get current preferences

---

#### `/api/deleteOrg.js` - NEW FILE (Optional)
**Purpose**: Delete/remove an organization  
**Methods**: POST  
**Body**: `{ email, orgId }`  
**Returns**: Success/error message

**Use Cases**:
- Remove disconnected orgs
- Clean up old connections

---

## 📁 Final File Structure

```
pages/api/
├── profile.js              ✅ UPDATE (add is_sandbox)
├── addOrg.js               ✅ Already complete
├── updateProfile.js        🆕 NEW
├── changePassword.js       🆕 NEW
├── securitySettings.js     🆕 NEW
├── userPreferences.js      🆕 NEW
└── deleteOrg.js            🆕 NEW (optional)
```

---

## 🎨 Database Schema Requirements

### `profiles` table (existing)
- `id`
- `email`
- `full_name`
- `password` (hashed)

### `organizations` table (existing)
- `id`
- `user_id`
- `org_email`
- `instance_url`
- `is_sandbox` ✅ Already exists

### `user_preferences` table - NEW
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light',
  notifications BOOLEAN DEFAULT true,
  email_updates BOOLEAN DEFAULT true,
  language VARCHAR(5) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### `security_settings` table - NEW
```sql
CREATE TABLE security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT false,
  profile_visible BOOLEAN DEFAULT true,
  data_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### `active_sessions` table - NEW
```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE,
  device_info TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Implementation Priority

### Phase 1: Essential Updates
1. ✅ Update `/api/profile.js` to include `is_sandbox`
2. 🆕 Create `/api/userPreferences.js` (most visible feature)

### Phase 2: Security Features
3. 🆕 Create `/api/changePassword.js`
4. 🆕 Create `/api/securitySettings.js`

### Phase 3: Additional Features
5. 🆕 Create `/api/updateProfile.js`
6. 🆕 Create `/api/deleteOrg.js` (optional)

---

## 💡 Why This Structure?

1. **Follows Your Pattern**: One file = One endpoint = One responsibility
2. **Easy to Maintain**: Each file is focused and testable
3. **Scalable**: Easy to add new features without bloating files
4. **Clear Separation**: Security, preferences, and profile are separate concerns
5. **RESTful**: Each endpoint has a clear purpose

---

## 📝 Notes

- All endpoints should validate `email` from session/token
- Use Supabase service role key for database operations
- Hash passwords using bcrypt or similar
- Store sessions securely
- Add rate limiting for security endpoints
- Log security-related actions

