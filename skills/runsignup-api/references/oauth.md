# RunSignup OAuth2 Reference

## Overview

RunSignup implements the **OAuth2 Authorization Code flow with PKCE** support.

- **Base API Server:** `https://api.runsignup.com`
- **Contact:** info@runsignup.com
- **OpenAPI Spec:** `https://runsignup.com/API/OAuth2/openapi-spec.json`

---

## Scopes

| Scope | Description |
|---|---|
| `rsu_api_read` | RunSignup API Read Access |
| `rsu_api_write` | RunSignup API Write Access |
| `mcp.access` | RunSignup MCP Access |
| `rsu_admin.super_user` | Company Admin: Super User |
| `rsu_admin.developer` | Company Admin: Developer |
| `rsu_admin.finance` | Company Admin: Finance |
| `rsu_admin.onboarding_retention` | Company Admin: Onboarding and Retention |
| `rsu_admin.employee` | Company Admin: Employee |

Multiple scopes are space-separated (e.g., `rsu_api_read rsu_api_write`).

---

## Token Lifetimes

| Token | Lifetime |
|---|---|
| Authorization Code | 5 minutes |
| Access Token | ~1 month (2,592,000 seconds) |
| Refresh Token | 20 years |

---

## Authorization Flow

1. Register application → receive `client_id` and `client_secret`
2. Redirect user to authorization endpoint
3. User logs in and grants permissions
4. Receive authorization code via redirect callback
5. Exchange code for access + refresh tokens
6. Use `Authorization: Bearer <access_token>` on API requests
7. Refresh access token when expired

---

## Endpoints

### 1. Authorization Request

```
GET https://api.runsignup.com/Profile/OAuth2/RequestGrant
```

| Parameter | Required | Description |
|---|---|---|
| `response_type` | Yes | Must be `"code"` |
| `client_id` | Yes | OAuth2 client identifier |
| `redirect_uri` | Yes | Callback URI; must match registered |
| `scope` | No | Space-separated scopes |
| `state` | No | CSRF protection (recommended) |
| `code_challenge` | No | PKCE challenge; pattern: `^[A-Za-z0-9\-._~]{43,128}$` |
| `code_challenge_method` | No | `"plain"` or `"S256"` (S256 recommended); defaults to `"plain"` |

**Response:** `302` redirect to callback with `code` param, or `400` on bad request.

---

### 2. Token Exchange

```
POST https://api.runsignup.com/rest/v2/auth/auth-code-redemption.json
Content-Type: application/x-www-form-urlencoded
```

| Parameter | Required | Description |
|---|---|---|
| `grant_type` | Yes | Must be `"authorization_code"` |
| `client_id` | Yes | OAuth2 client identifier |
| `client_secret` | Yes | OAuth2 client secret (base64 encoded) |
| `code` | Yes | Authorization code from step 1 |
| `redirect_uri` | Yes | Same URI used in auth request |
| `code_verifier` | No | PKCE verifier (required if `code_challenge` was used) |

**Responses:** `200` → `TokenResponse`, `400`/`401` → `OAuth2Error`

---

### 3. Token Refresh

```
POST https://api.runsignup.com/rest/v2/auth/refresh-token.json
Content-Type: application/x-www-form-urlencoded
```

| Parameter | Required | Description |
|---|---|---|
| `grant_type` | Yes | Must be `"refresh_token"` |
| `refresh_token` | Yes | Refresh token from prior exchange |
| `client_id` | Yes | OAuth2 client identifier |
| `client_secret` | Yes | OAuth2 client secret (base64 encoded) |
| `scope` | No | Defaults to original scope |

**Responses:** `200` → `TokenResponse`, `400`/`401` → `OAuth2Error`

---

## Response Schemas

### TokenResponse

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200a1b2c3d4e5f6...",
  "scope": "rsu_api_read rsu_api_write"
}
```

### OAuth2Error

```json
{
  "error": "invalid_grant",
  "error_description": "...",
  "error_uri": "https://...",
  "hint": "..."
}
```

**Error codes:** `invalid_request`, `invalid_client`, `invalid_grant`, `unauthorized_client`, `unsupported_grant_type`, `invalid_scope`

---

## Additional Resources

- Developer Guide: `https://runsignup.com/Profile/OAuth2/DeveloperGuide` (requires login)
- API Keys: `https://runsignup.com/API/ApiKeys`
- Getting Started: `https://runsignup.com/API/GettingStarted`
- Error Codes: `https://runsignup.com/API/ErrorCodes`
- Open Source / GitHub: `https://github.com/RunSignUp-Team/OpenSource`
