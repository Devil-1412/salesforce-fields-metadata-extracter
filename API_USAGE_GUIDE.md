# Profile Page API Usage Guide

## 📁 Created Files

### API Endpoints
1. ✅ **`pages/api/profile.js`** - Updated to include `is_sandbox` field
2. 🆕 **`pages/api/updateProfile.js`** - Update user profile information
3. 🆕 **`pages/api/changePassword.js`** - Change user password
4. 🆕 **`pages/api/securitySettings.js`** - Manage security settings
5. 🆕 **`pages/api/userPreferences.js`** - Manage user preferences
6. 🆕 **`pages/api/deleteOrg.js`** - Delete organization

### Database Migration
7. 🆕 **`SUPABASE_MIGRATION.sql`** - Complete SQL migration file

---

## 🗄️ Database Setup

### Step 1: Run SQL Migration
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `SUPABASE_MIGRATION.sql`
4. Copy and paste the entire content
5. Click **Run** to execute

This will create:
- `user_preferences` table
- `security_settings` table
- `active_sessions` table
- Update `organizations` table (adds `is_sandbox` if missing)
- Set up RLS policies
- Create triggers for `updated_at` timestamps

---

## 📡 API Endpoint Details

### 1. Update Profile (`/api/updateProfile`)

**Method**: POST  
**Body**:
```json
{
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Usage Example**:
```javascript
const response = await fetch("/api/updateProfile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: userEmail,
    full_name: "New Name"
  })
});
```

---

### 2. Change Password (`/api/changePassword`)

**Method**: POST  
**Body**:
```json
{
  "email": "user@example.com",
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Validation**:
- New password must be at least 8 characters
- Must include letters and numbers
- Current password must be verified

**Usage Example**:
```javascript
const response = await fetch("/api/changePassword", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: userEmail,
    currentPassword: currentPass,
    newPassword: newPass
  })
});
```

---

### 3. Security Settings (`/api/securitySettings`)

**Method**: POST  
**Body** (varies by action):

#### Toggle 2FA
```json
{
  "email": "user@example.com",
  "action": "toggle2FA",
  "data": {
    "enabled": true
  }
}
```

#### Update Privacy Settings
```json
{
  "email": "user@example.com",
  "action": "updatePrivacy",
  "data": {
    "profileVisible": true,
    "dataSharing": false
  }
}
```

#### Get Sessions
```json
{
  "email": "user@example.com",
  "action": "getSessions"
}
```

#### Revoke Session
```json
{
  "email": "user@example.com",
  "action": "revokeSession",
  "data": {
    "sessionId": "session-uuid"
  }
}
```

#### Revoke All Sessions
```json
{
  "email": "user@example.com",
  "action": "revokeAllSessions"
}
```

#### Get Security Settings
```json
{
  "email": "user@example.com",
  "action": "getSecuritySettings"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "two_factor_enabled": false,
    "profile_visible": true,
    "data_sharing": false
  }
}
```

---

### 4. User Preferences (`/api/userPreferences`)

**Method**: POST  
**Body**:

#### Update Preferences
```json
{
  "email": "user@example.com",
  "action": "update",
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "emailUpdates": false,
    "language": "en"
  }
}
```

#### Get Preferences
```json
{
  "email": "user@example.com",
  "action": "get"
}
```

**Response**:
```json
{
  "success": true,
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "emailUpdates": false,
    "language": "en"
  }
}
```

**Valid Values**:
- `theme`: "light" | "dark"
- `language`: "en" | "es" | "fr" | "de"
- `notifications`: boolean
- `emailUpdates`: boolean

**Usage Example**:
```javascript
// Update preferences
const response = await fetch("/api/userPreferences", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: userEmail,
    action: "update",
    preferences: {
      theme: "dark",
      notifications: true,
      emailUpdates: true,
      language: "en"
    }
  })
});

// Get preferences
const getResponse = await fetch("/api/userPreferences", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: userEmail,
    action: "get"
  })
});
```

---

### 5. Delete Organization (`/api/deleteOrg`)

**Method**: POST  
**Body**:
```json
{
  "email": "user@example.com",
  "orgId": "organization-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

**Security**:
- Verifies organization belongs to user
- Returns 403 if user doesn't own the organization

**Usage Example**:
```javascript
const response = await fetch("/api/deleteOrg", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: userEmail,
    orgId: organizationId
  })
});
```

---

## 🔗 Integration with Profile Page

### Example: Update Profile Tab

```javascript
// In app/profile/page.js
const handleUpdateProfile = async (newFullName) => {
  try {
    const res = await fetch("/api/updateProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        full_name: newFullName
      })
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Profile updated!");
      // Refresh user data
      fetchProfile();
    }
  } catch (err) {
    toast.error("Failed to update profile");
  }
};
```

### Example: Update Preferences

```javascript
// In app/profile/page.js
const handleUpdatePreferences = async (newPrefs) => {
  try {
    const res = await fetch("/api/userPreferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        action: "update",
        preferences: newPrefs
      })
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Preferences saved!");
      setPreferences(data.preferences);
    }
  } catch (err) {
    toast.error("Failed to update preferences");
  }
};
```

### Example: Toggle 2FA

```javascript
// In app/profile/page.js
const handleToggle2FA = async (enabled) => {
  try {
    const res = await fetch("/api/securitySettings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        action: "toggle2FA",
        data: { enabled }
      })
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`2FA ${enabled ? 'enabled' : 'disabled'}`);
    }
  } catch (err) {
    toast.error("Failed to update 2FA settings");
  }
};
```

---

## 🔒 Security Notes

1. **Password Changes**: Uses Supabase Auth API (secure)
2. **Session Management**: Tracks sessions for security
3. **RLS Policies**: Row Level Security ensures users only access their data
4. **Validation**: All inputs are validated server-side
5. **Error Handling**: Errors don't expose sensitive information

---

## ✅ Testing Checklist

After running the migration:

- [ ] Verify tables exist in Supabase
- [ ] Test `/api/updateProfile` endpoint
- [ ] Test `/api/changePassword` endpoint
- [ ] Test `/api/userPreferences` (update & get)
- [ ] Test `/api/securitySettings` (all actions)
- [ ] Test `/api/deleteOrg` endpoint
- [ ] Verify RLS policies work correctly
- [ ] Check that `updated_at` triggers work
- [ ] Test error handling for invalid inputs

---

## 🐛 Troubleshooting

### Issue: "User not found"
- **Solution**: Ensure email exists in `profiles` table

### Issue: "Table doesn't exist"
- **Solution**: Run the SQL migration file in Supabase

### Issue: "Permission denied"
- **Solution**: Check RLS policies are enabled and correct

### Issue: Password change fails
- **Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables

---

## 📝 Next Steps

1. Run the SQL migration in Supabase
2. Test each API endpoint
3. Integrate API calls into profile page components
4. Add loading states and error handling
5. Consider adding rate limiting for security endpoints

