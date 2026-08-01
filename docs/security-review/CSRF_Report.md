# CSRF (Cross-Site Request Forgery) Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| MED-001 | No CSRF tokens on state-changing requests | Medium |
| HIGH-012 | `react-router-dom` CSRF bypass (GHSA-qwww-vcr4-c8h2, CWE-352) | High (SCA) |

---

## Current CSRF Posture

The application currently uses **Bearer token authentication** with the token stored in `localStorage`. Browser-based CSRF attacks **cannot exploit localStorage** because:

- Cross-origin `fetch`/`XMLHttpRequest` requests cannot read `localStorage` from another origin.
- The Axios interceptor adds `Authorization: Bearer <token>` from JavaScript — a cross-origin attacker's page cannot do this.
- CORS (if properly configured on backend) prevents cross-origin credentialed requests.

**Therefore, the current CSRF risk is LOW** while tokens remain in localStorage.

---

## Future Risk: Cookie-Based Auth

If the recommended fix for CRIT-001 is implemented (httpOnly cookies), CSRF protection **becomes mandatory**. Browsers automatically send cookies with cross-origin requests (subject to SameSite policy). Without CSRF protection:

1. An attacker creates a page: `https://evil.com/attack.html`
2. Page submits a form to `POST https://pragatix.example.com/api/v1/students/123/adjust-points`
3. Browser sends the httpOnly session cookie automatically
4. Backend processes the request as authenticated

### Mitigation when moving to cookies

```typescript
// Option 1: Double-submit cookie (stateless)
// Backend sets: Set-Cookie: csrf_token=<random>; SameSite=Strict (NOT httpOnly)
// Frontend reads: const csrfToken = getCookie('csrf_token');
// Frontend sends: X-CSRF-Token: <value>
// Backend validates: header matches cookie value

// Option 2: Synchronizer token
// Backend generates unique token per session
// Frontend fetches from /api/v1/csrf-token endpoint
// Sends as X-CSRF-Token header on all mutating requests

// SameSite=Strict is the simplest mitigation:
// Set-Cookie: spdms_session=...; SameSite=Strict; HttpOnly; Secure
// With SameSite=Strict, cross-site requests will never include the cookie
```

---

## Current Implementation

No CSRF token is sent in any request headers. The Axios interceptors in `client.ts` only add:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

No `X-CSRF-Token` or `X-Requested-With` header is present.

---

## Recommendations

1. **Short term (current localStorage pattern):** Add `X-Requested-With: XMLHttpRequest` header to all mutating requests. Many backends use this to distinguish AJAX from form submissions.
2. **Long term (httpOnly cookie pattern):** Implement full CSRF token mechanism with `SameSite=Strict` cookies as the primary defense.
