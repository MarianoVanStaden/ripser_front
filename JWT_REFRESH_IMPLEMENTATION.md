# JWT Token Refresh Implementation

## Overview
This document describes the JWT token refresh mechanism implemented in the Ripser frontend application.

## Architecture

### 1. Token Storage
- **Access Token**: Stored in `localStorage` as `auth_token` (15-30 min expiration)
- **Refresh Token**: Stored in `localStorage` as `auth_refresh_token` (7 days expiration)
- **User Data**: Stored in `localStorage` as `auth_user`

### 2. Token Refresh Flow

```
┌─────────────────┐
│   API Request   │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│  Axios Request Interceptor │
│  (Adds Bearer Token)       │
└────────┬───────────────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ 401?   │──No──► Return Response
    └───┬────┘
        │Yes
        ▼
┌──────────────────────┐
│ error === "token_    │
│ expired"?            │
└───┬──────────────────┘
    │Yes
    ▼
┌─────────────────────────┐
│ Call /auth/refresh with │
│ refreshToken            │
└────────┬────────────────┘
         │
         ▼
    ┌─────────┐
    │Success? │──No──► Clear tokens, redirect to /login
    └───┬─────┘
        │Yes
        ▼
┌──────────────────────────┐
│ Store new access token   │
│ Store new refresh token  │
│ (if provided)            │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Retry original request   │
│ with new token           │
└──────────────────────────┘
```

### 3. Implementation Files

#### `src/api/config.ts`
Contains the main Axios interceptor that:
- **Request Interceptor**: Automatically adds `Authorization: Bearer <token>` to all requests
- **Response Interceptor**: 
  - Detects `401` status with `error: "token_expired"`
  - Prevents infinite loops by checking `_retry` flag and excluding `/auth/refresh` endpoint
  - Calls `authApi.refresh()` with stored refresh token
  - Updates tokens in localStorage
  - Retries the original request with new token
  - Redirects to `/login` if refresh fails

#### `src/api/authApi.ts`
Provides authentication endpoints:
- `login(credentials)`: Returns access token, refresh token, and user data
- `validateToken(token)`: Validates if a token is still valid
- `refresh(refreshToken)`: Returns new access token (and optionally new refresh token)

#### `src/context/AuthContext.tsx`
Manages authentication state:
- Validates token on app startup
- Provides `login()` and `logout()` functions
- Stores/retrieves tokens from localStorage
- Has a secondary 401 interceptor that only handles non-`token_expired` errors

## Key Features

### 1. Automatic Token Refresh
When an API request receives a `401` response with `error: "token_expired"`:
1. The refresh token is automatically retrieved from localStorage
2. A refresh request is sent to `/auth/refresh`
3. New tokens are stored
4. The original request is retried with the new access token
5. **All of this happens transparently to the user** - no interruption

### 2. Infinite Loop Prevention
- The `_retry` flag ensures each request only attempts refresh once
- The `/auth/refresh` endpoint is excluded from refresh attempts
- If refresh fails, tokens are cleared and user is redirected to login

### 3. Error Handling

#### Backend Response Format
```json
{
  "error": "token_expired",
  "message": "El token JWT ha expirado"
}
```

#### Frontend Detection
```typescript
const errorCode = error.response?.data?.error;
if (status === 401 && errorCode === 'token_expired') {
  // Attempt token refresh
}
```

### 4. Dual Interceptor Strategy
- **config.ts interceptor**: Handles `token_expired` errors with automatic refresh
- **AuthContext interceptor**: Handles other 401 errors (invalid token, revoked token, etc.)

This prevents double-logout scenarios while ensuring proper session management.

### 5. Detailed Logging
The implementation includes comprehensive console logging:
- `🔄` Token refresh initiated
- `📡` Calling refresh endpoint
- `✅` Token refreshed successfully
- `🔁` Retrying original request
- `❌` Errors during refresh
- `🚪` Redirecting to login
- `⚠️` Unauthorized requests

## Security Considerations

### 1. Token Storage
- Tokens are stored in `localStorage` (consider using `httpOnly` cookies for enhanced security in future)
- Tokens are automatically cleared on logout or refresh failure

### 2. CSRF Protection
- Not implemented yet (recommended to add CSRF tokens for state-changing requests)

### 3. Token Expiration
- Access tokens expire in 15-30 minutes (backend configured)
- Refresh tokens expire in 7 days (backend configured)
- Expired refresh tokens require re-login

## Usage Examples

### Making Authenticated Requests
```typescript
import { api } from './api/config';

// No need to manually add token - interceptor handles it
const response = await api.get('/clientes');
```

### Login Flow
```typescript
import { useAuth } from './context/AuthContext';

const { login } = useAuth();

try {
  await login('username', 'password');
  // Tokens automatically stored and set
} catch (error) {
  console.error('Login failed:', error);
}
```

### Logout Flow
```typescript
import { useAuth } from './context/AuthContext';

const { logout } = useAuth();

logout(); // Clears all tokens and redirects to login
```

## Future Enhancements

### 1. Proactive Token Refresh
Refresh the token before it expires (e.g., when <5 minutes remaining):

```typescript
import jwtDecode from 'jwt-decode';

const checkTokenExpiration = (token: string) => {
  try {
    const decoded: any = jwtDecode(token);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh if less than 5 minutes remaining
    if (timeUntilExpiry < 5 * 60 * 1000) {
      return true; // Should refresh
    }
  } catch (error) {
    return true; // Invalid token, should refresh
  }
  return false;
};
```

### 2. Request Queue Management
Handle multiple simultaneous requests during token refresh:

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// In the 401 interceptor:
if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then((token) => {
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  });
}

isRefreshing = true;
// ... refresh logic ...
processQueue(null, newToken);
isRefreshing = false;
```

### 3. Refresh Token Rotation
Already partially implemented (backend sends new refresh token in response).

### 4. Activity-Based Token Renewal
Refresh token on user activity (mouse movement, clicks, etc.).

### 5. Secure Token Storage
Consider migrating from `localStorage` to `httpOnly` cookies or IndexedDB.

## Testing Checklist

- [x] Token refresh on 401 with `token_expired` error
- [x] Original request retry after successful refresh
- [x] Redirect to login on refresh failure
- [x] No infinite loops on refresh endpoint failure
- [x] Proper token cleanup on logout
- [ ] Multiple simultaneous requests during refresh (future enhancement)
- [ ] Proactive token refresh before expiration (future enhancement)

## Debugging

### Check Current Token State
```javascript
// In browser console:
console.log('Access Token:', localStorage.getItem('auth_token'));
console.log('Refresh Token:', localStorage.getItem('auth_refresh_token'));
console.log('User:', localStorage.getItem('auth_user'));
```

### Decode JWT Token
```javascript
// In browser console (requires jwt-decode library):
import jwtDecode from 'jwt-decode';
const token = localStorage.getItem('auth_token');
console.log('Decoded:', jwtDecode(token));
```

### Force Token Expiration
Manually set an expired token in localStorage to test the refresh mechanism.

## Backend Integration

### Required Endpoints

#### POST /auth/login
```json
Request:
{
  "usernameOrEmail": "string",
  "password": "string"
}

Response:
{
  "id": 1,
  "username": "string",
  "email": "string",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST /auth/refresh
```json
Request:
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..." // Optional - for rotation
}
```

#### POST /auth/validate
```json
Request:
{
  "token": "eyJhbGc..."
}

Response:
{
  "valid": true
}
```

### Error Response Format
```json
{
  "error": "token_expired",
  "message": "El token JWT ha expirado"
}
```

## Configuration

### Backend Configuration (application.properties)
```properties
# JWT Configuration
jwt.secret=your-secret-key-here
jwt.expiration=1800000      # 30 minutes in milliseconds
jwt.refresh-expiration=604800000  # 7 days in milliseconds
```

### Frontend Configuration (config.ts)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

## Troubleshooting

### Issue: Infinite Redirect Loop to /login
- **Cause**: Token refresh keeps failing
- **Solution**: Check backend `/auth/refresh` endpoint, verify refresh token validity

### Issue: Request Not Retried After Refresh
- **Cause**: `_retry` flag not properly set
- **Solution**: Verify the response interceptor is setting `originalRequest._retry = true`

### Issue: User Logged Out Unexpectedly
- **Cause**: Multiple 401 interceptors triggering logout
- **Solution**: Ensure AuthContext interceptor ignores `token_expired` errors (already implemented)

### Issue: CORS Errors During Refresh
- **Cause**: Backend not allowing refresh endpoint
- **Solution**: Add `/auth/refresh` to CORS allowed endpoints in backend configuration

---

**Last Updated**: January 2025  
**Author**: Ripser Development Team  
**Version**: 1.0
