# API Security Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| MED-001 | No CSRF protection | Medium |
| MED-007 | No Axios request timeout | Medium |
| MED-008 | Backend error messages surfaced to users | Medium |
| HIGH-011 | XP claim returns `true` on API failure | High |
| NMV-002 | IDOR on ID-parameterized endpoints | NMV |
| NMV-005 | CORS configuration — needs verification | NMV |

---

## API Client Configuration

**File:** `src/api/client.ts`

```typescript
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  // Issues: No timeout, no retry logic, no request ID
});
```

| Security Control | Status |
|-----------------|--------|
| Bearer token in Authorization header | ✅ |
| Timeout configuration | ❌ Missing |
| Retry logic (with back-off) | ❌ Missing |
| Request correlation ID | ❌ Missing |
| HTTPS enforcement | ❌ HTTP in .env.production |
| TLS certificate validation | ❌ `secure: false` in Vite proxy (dev) |

---

## Interceptor Security Review

### Request Interceptor

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('spdms_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  const isAuthRoute = config.url?.includes('/api/v1/auth/login') || ...;
  if (token && !isAuthRoute && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- ✅ Auth endpoints correctly excluded from token injection (no double-auth header on login).
- ✅ Token read fresh on every request (not cached at startup).
- ❌ Token read from localStorage (CRIT-001).
- ❌ No `X-Requested-With` header added for CSRF protection (MED-001).

### Response Interceptor

```typescript
if (error.response && error.response.status === 401) {
  // Clear all tokens
  // Redirect to /login
}
```

- ✅ 401 handling correctly clears tokens and redirects.
- ❌ No retry logic for transient network errors.
- ❌ No handling of 403 (forbidden) responses — user gets no meaningful feedback.
- ❌ `window.location.href` used instead of React Router navigate (MED-013).

---

## Service Layer Review

### Dual-Client Usage

The codebase has two API client exports that are effectively the same instance:

- `src/api/client.ts` → exports `apiClient`
- `src/services/apiClient.ts` → re-exports `apiClient` from `src/api/client.ts`

This is harmless but confusing. Standardize on one import path.

### Missing Validation on Service Inputs

All service functions accept `any` typed parameters and pass them directly to API calls:

```typescript
// adminService.ts
createUser: (data: any) => apiClient.post('/api/v1/admin/users', data),
updateUser: (id: string | number, data: any) => apiClient.put(`/api/v1/admin/users/${id}`, data),
```

The `data: any` pattern means no client-side validation of the payload structure before it is sent. This increases the likelihood of sending malformed data that could cause backend errors with verbose responses.

---

## Endpoints with No Error Handling

| Service | Function | Concern |
|---------|----------|---------|
| `activityService` (admin) | `fetchActivities` | Silently catches errors and tries fallback URLs |
| `xpStore.ts` | `fetchHistory`, `fetchStreaks` | Catches error and falls back to mock data silently |
| `activityService.ts` (admin) | `mapActivityToStage` | Two-URL fallback with silent first failure |

---

## OWASP API Security Top 10 Compliance

| Threat | Status |
|--------|--------|
| API1:2023 – Broken Object Level Authorization | NMV (backend) |
| API2:2023 – Broken Authentication | ❌ JWT in localStorage |
| API3:2023 – Broken Object Property Level Auth | NMV |
| API4:2023 – Unrestricted Resource Consumption | ❌ No timeout, no rate limit on client |
| API5:2023 – Broken Function Level Authorization | ⚠️ Client-side role checks only |
| API6:2023 – Unrestricted Access to Sensitive Business Flows | ❌ XP claim ignores errors |
| API7:2023 – Server-Side Request Forgery | NMV |
| API8:2023 – Security Misconfiguration | ❌ HTTP in prod, CSP issues |
| API9:2023 – Improper Inventory Management | ⚠️ Fallback URL endpoints suggest undocumented APIs |
| API10:2023 – Unsafe Consumption of APIs | ⚠️ Unvalidated URLs from API rendered directly |
