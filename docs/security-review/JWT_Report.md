# JWT Security Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| CRIT-001 | JWT in localStorage — XSS accessible | Critical |
| HIGH-007 | No server-side token revocation | High |
| HIGH-008 | Full user PII in localStorage | High |
| LOW-008 | No refresh token mechanism | Low |
| NMV-001 | Backend JWT algorithm and secret — needs verification | NMV |

---

## Token Storage Analysis

The JWT is stored under **three different key names** simultaneously:

| Key | Store | Cleaned on Logout (authContext) | Cleaned on Sidebar Logout |
|-----|-------|----------------------------------|---------------------------|
| `spdms_token` | localStorage | ✅ | ❌ |
| `token` | localStorage | ✅ | ❌ |
| `auth_token` | localStorage | ✅ | ❌ |

All three keys are read in `client.ts` interceptor: `localStorage.getItem('spdms_token') || localStorage.getItem('auth_token') || localStorage.getItem('token')`.

## Token Lifecycle

| Event | Frontend Behavior | Security Issue |
|-------|------------------|----------------|
| Login | Token written to 3 localStorage keys + authContext state | CRIT-001 |
| App load | Token read from localStorage → `/api/v1/auth/me` called | Acceptable |
| 401 response | All tokens cleared, redirect to /login | Acceptable |
| Inactivity (30min) | `logout()` called | Acceptable |
| Tab close | Tokens persist (localStorage survives) | Risk: long-lived token |
| Explicit logout | All tokens cleared client-side, NO backend call | HIGH-007 |
| Multi-tab sync | storage event fires, other tabs clear tokens | ✅ Good |

## Token Content (Needs Manual Verification)

Based on the `UserData` interface in `authContext.tsx`, the decoded JWT or the `/api/v1/auth/me` response contains:

```typescript
{
  userId, username, fullName, email, roles, subRoles,
  studentId, sprNo, department, section, year,
  score, totalXp, isCaptain
}
```

**Concern:** If role claims are embedded in the JWT payload and the frontend trusts them without re-validation on every request, a JWT with manipulated claims (if the backend uses weak secret) could escalate privileges.

## Recommendations

1. **Migrate to httpOnly cookie storage** (see CRIT-001 fix).
2. **Implement token denylist on backend** for logout scenarios.
3. **Use short-lived access tokens** (15 minutes) with longer-lived refresh tokens (7 days).
4. **Verify JWT algorithm is RS256 or ES256** — avoid HS256 with weak shared secrets.
5. **Remove PII from JWT payload** — include only `sub` (userId) and `roles`.
