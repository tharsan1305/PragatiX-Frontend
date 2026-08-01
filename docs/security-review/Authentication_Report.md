# Authentication Security Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| CRIT-001 | JWT stored in localStorage | Critical |
| CRIT-003 | Default password is student DOB / `123456` | Critical |
| HIGH-001 | Client-side role determination | High |
| HIGH-002 | Debug token bypass (`debug_token`) | High |
| HIGH-004 | Sidebar logout incomplete | High |
| HIGH-005 | Password min length 4 chars | High |
| HIGH-007 | No backend logout / token revocation | High |
| MED-010 | No brute-force protection on login form | Medium |
| LOW-008 | No token refresh mechanism | Low |
| NMV-001 | Backend JWT validation — needs verification | NMV |
| NMV-003 | Login rate limiting — needs verification | NMV |

---

## Authentication Flow Analysis

### Login Flow (Staff/Admin/Teacher)

```
User → LoginPage.tsx
     → authService.loginStaff() → POST /api/v1/auth/login
     → Response: { success, data: { token, roles, fullName, ... } }
     → loginPage.onSubmit() determines finalRole (VULNERABLE — HIGH-001)
     → login(token, user) → authContext.tsx
     → localStorage.setItem('spdms_token', token) (VULNERABLE — CRIT-001)
     → navigate(`/${finalRole.toLowerCase()}`)
```

### Login Flow (Student)

```
User → LoginPage.tsx (role = "Student")
     → authService.loginStudent() → POST /api/v1/auth/student-login
     → { identity, password } — identity is username/reg no; password is used for DOB-based login too
     → Same token storage pattern as staff
```

### Parent Login

```
authService.parentLogin() → POST /api/v1/auth/parent-login
     → { sprNo, dateOfBirth }
     → dateOfBirth is used as authentication factor — knowledge-based, guessable
```

The parent login using only SPR number + date of birth as the two factors is a **Needs Manual Verification** concern — if the parent portal exposes student discipline data, this is a low-strength authentication mechanism.

### Captain Login (Separate Page)

`CaptainLoginPage.tsx` is a standalone login page at `/captain-login` that:
- Does not use `authContext.login()`
- Manually writes tokens to `localStorage` (`spdms_token`, `auth_token`)
- Does not store `userRole`
- Navigates directly to `/captain/dashboard`

This page bypasses the `authContext` login flow entirely, meaning the stored user object is incomplete, and `ProtectedRoute` may fail to apply captain-specific role checks correctly.

### Session Management

| Control | Status |
|---------|--------|
| 30-minute inactivity timeout | ✅ Implemented |
| Multi-tab logout sync | ✅ Implemented |
| Token refresh on expiry | ❌ Not implemented |
| Backend token revocation on logout | ❌ Not implemented |
| Secure cookie storage | ❌ Not implemented (localStorage used) |
| HttpOnly flag | ❌ N/A (localStorage cannot be HttpOnly) |

---

## OWASP ASVS V3 Authentication Compliance

| ASVS Requirement | Status |
|------------------|--------|
| V3.1.1 — No persistent session tokens in URL | ✅ |
| V3.2.1 — New session on login | ✅ (new token issued) |
| V3.2.3 — Session tokens use at least 128-bit randomness | NMV (backend) |
| V3.3.1 — Logout invalidates server session | ❌ No backend logout call |
| V3.3.2 — Idle session timeout | ✅ 30 minutes |
| V3.5.2 — Stateless tokens protect against attacks | NMV (JWT algorithm) |
| V3.7.1 — Protect against brute force | ❌ (client side) / NMV (server side) |

---

## Recommended Architecture

```
Frontend                     Backend
--------                     -------
POST /api/v1/auth/login  →   Validate credentials
                         ←   Set httpOnly Secure SameSite=Strict cookie: spdms_access_token=<short_jwt>
                             Set httpOnly Secure SameSite=Strict cookie: spdms_refresh_token=<long_jwt>

All API requests          →  Cookie automatically included (no JS token access needed)
Token expiry              →  POST /api/v1/auth/refresh → new access token in cookie
Logout                    →  POST /api/v1/auth/logout → backend denylist + clear cookies
```
