# JSForce Rate Limiting - Setup Guide

## Overview

This application implements rate limiting for all JSForce API calls to prevent abuse and excessive resource usage.

## Configuration

### Default Limits

- **100 requests per minute** per user
- Rate limits are user-specific (tracked by user ID from auth token)
- Sliding window algorithm for accurate throttling

### Rate Limit Storage

- **In-memory storage** (suitable for single-instance deployments)
- Automatic cleanup every 5 minutes
- For multi-instance deployments, consider implementing Redis

## Usage

### Making API Requests

All JSForce endpoints will return standard rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
```

When rate limit is exceeded (429 status):

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

### Rate Limited Endpoints

All endpoints that make JSForce calls are rate limited:

- `/api/soql` - SOQL queries
- `/api/objects` - List objects
- `/api/fields` - Field metadata
- `/api/fieldAnalysis` - Field statistics
- `/api/objectMetadata` - Validation rules, triggers, workflows
- `/api/getObjectDetails` - Object describe
- `/api/getRecordCount` - Record counts
- `/api/compareFields` - Cross-org field comparison
- `/api/compareObjects` - Cross-org object comparison
- `/api/addOrg` - Add Salesforce org
- `/api/salesforceLogin` - Salesforce authentication
- `/api/profile` - User profile and API usage
- `/api/metadata/describe` - Metadata describe

## Customization

### Adjust Global Rate Limits

Edit `lib/rateLimiter.js`:

```javascript
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100; // 100 requests
```

### Custom Limits Per Endpoint

Apply different limits to specific endpoints:

```javascript
// In pages/api/someEndpoint.js
export default jsforceRateLimiter(handler, {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 500, // 500 requests
});
```

## Testing

### Check Rate Limit Status

```javascript
// Browser console
const token = localStorage.getItem("token");
fetch("/api/objects", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ accessToken: "sf-token", instanceUrl: "sf-url" }),
}).then((r) => console.log(r.headers.get("X-RateLimit-Remaining")));
```

### Test Rate Limiting

```javascript
// Make 105 requests to trigger rate limit
for (let i = 0; i < 105; i++) {
  fetch("/api/objects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accessToken: "sf-token", instanceUrl: "sf-url" }),
  }).then((r) => {
    if (r.status === 429) console.log(`Request ${i}: Rate limited!`);
  });
}
```

## Production Deployment

### Single Instance (Current Setup)

✅ Ready to deploy - no additional configuration needed

### Multi-Instance (Horizontal Scaling)

For deployments with multiple servers/instances, implement Redis-based rate limiting to share state across instances.

## Monitoring

Monitor rate limit hits in your application logs:

```
Rate limiter error: [error details]
```

Consider adding alerts for:

- High rate limit hit rates per user
- Unusual traffic patterns
- Potential DDoS attempts

## Security Benefits

- ✅ Protection against DDoS attacks
- ✅ Prevention of resource exhaustion
- ✅ Cost control for Salesforce API usage
- ✅ Fair usage enforcement
- ✅ User-specific quotas

## Support

For questions or issues with rate limiting, check:

- [walkthrough.md](file:///C:/Users/hp/.gemini/antigravity/brain/4f522ad5-f603-4adb-961d-2ab48218127e/walkthrough.md) - Detailed implementation guide
- [lib/rateLimiter.js](file:///c:/Users/hp/Documents/Salesforce%20tool/salesforce-fields-metadata-extracter/lib/rateLimiter.js) - Source code with inline documentation
