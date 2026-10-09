# Middleware Knowledge

## auth.js

### Overview

Authentication and authorization middleware providing JWT-based security with role-based access control.

### Functions

#### auth(required=true)

- **Purpose**: Validates JWT tokens for authentication
- **Parameter**: `required` (boolean) - whether auth is mandatory
- **Returns**: Middleware function
- **Behavior**:
  - Extracts token from `Authorization: Bearer <token>` header
  - Verifies token using JWT utility
  - Sets `req.user` with decoded payload
  - Returns 401 if token invalid/missing and required=true
  - Allows request to proceed if required=false and no token

#### requireRoles(...roles)

- **Purpose**: Enforces role-based access control
- **Parameters**: Variable number of role strings
- **Returns**: Middleware function
- **Behavior**:
  - Checks if `req.user.role` matches any of the provided roles
  - Returns 401 if user not authenticated
  - Returns 403 if user role not in allowed roles
  - Allows request to proceed if role matches

### Usage Patterns

#### Basic Authentication

```javascript
router.get("/protected", auth(), handler);
// Requires valid JWT token
```

#### Optional Authentication

```javascript
router.get("/optional", auth(false), handler);
// Token validated if present, but not required
```

#### Role-based Access

```javascript
router.post("/admin-only", auth(), requireRoles(ROLES.ADMIN), handler);
// Requires valid token AND admin role
```

#### Multiple Roles

```javascript
router.get(
  "/staff-access",
  auth(),
  requireRoles(ROLES.ADMIN, ROLES.EVALUATOR),
  handler
);
// Allows either admin or evaluator roles
```

### Security Features

#### Token Validation

- **Format**: Expects `Bearer <jwt-token>` format
- **Verification**: Uses secure JWT verification
- **Expiration**: Respects token expiration times
- **Error Handling**: Clear error messages for auth failures

#### Role-based Security

- **Granular Control**: Function-level role restrictions
- **Multiple Roles**: Supports multiple allowed roles per endpoint
- **Fail-safe**: Denies access by default

#### Error Responses

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Valid token but insufficient permissions

### Integration with Routes

- **Chain Order**: Must be used before role middleware
- **User Context**: Provides `req.user` object for subsequent middleware
- **Route Protection**: Easy to apply to entire route groups

### Token Payload Structure

Expected JWT payload format:

```javascript
{
  id: "user_mongodb_id",
  email: "user@example.com",
  role: "ADMIN|EVALUATOR|STUDENTS",
  // other user fields...
}
```

### Error Handling

- **Invalid Token**: Returns 401 with "Invalid token" message
- **Missing Token**: Returns 401 with "Unauthorized" message (if required)
- **Insufficient Role**: Returns 403 with "Forbidden" message
- **No User Context**: Returns 401 if role check called without auth

### Best Practices

1. **Always authenticate first**: Use `auth()` before `requireRoles()`
2. **Principle of least privilege**: Only grant necessary roles
3. **Clear role definitions**: Use constants from ROLES module
4. **Consistent error handling**: Standard HTTP status codes
5. **Token refresh**: Implement token refresh for better UX

## Future Middleware

Add new middleware by creating file and wiring in server.js or specific routes.
