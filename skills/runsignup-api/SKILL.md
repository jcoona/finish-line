---
name: runsignup-api
description: Reference the RunSignup API specification for authentication, OAuth2 flows, and API method endpoints. Use when answering questions about RunSignup API integration, looking up endpoints, understanding OAuth2 scopes/token flows, or building features that call the RunSignup API.
---

# RunSignup API

**Base URL:** `https://runsignup.com`
**API Server:** `https://api.runsignup.com`

## Reference Files

- **OAuth2 authentication** (scopes, token lifetimes, endpoints, PKCE, request/response schemas): read [`references/oauth.md`](references/oauth.md)
- **All API method endpoints** (races, participants, results, teams, tickets, volunteers, etc.): read [`references/api-methods.md`](references/api-methods.md)

## Key Facts

- All API requests use `Authorization: Bearer <access_token>`
- Access tokens last ~1 month; refresh tokens last 20 years
- Two primary scopes: `rsu_api_read` and `rsu_api_write`
- Most race-scoped endpoints use the pattern `/API/race/:race_id/<resource>`
- v2 endpoints use the pattern `/API/v2/<resource>.json`
- Individual method detail pages (params, response schemas, examples) live at `https://runsignup.com` + the endpoint path
- **`user_id` parameter:** Many methods list `user_id` as a parameter, but per RunSignup's official docs: _"ID of user unless using OAuth 2.0. For OAuth, do not include a user ID."_ Since this app authenticates via OAuth2 Bearer Token, omit `user_id` from all requests.

## Useful Links

- Getting Started: `https://runsignup.com/API/GettingStarted`
- Error Codes: `https://runsignup.com/API/ErrorCodes`
- API Keys: `https://runsignup.com/API/ApiKeys`
- Open Source / GitHub: `https://github.com/RunSignUp-Team/OpenSource`
