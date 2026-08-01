# Secrets & Sensitive Data Exposure Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| HIGH-003 | `.env.production` tracked in Git with HTTP URL | High |
| HIGH-008 | Full user PII in localStorage | High |
| CRIT-001 | JWT token in localStorage | Critical |
| MED-004 | `studentId` logged to console in errors | Medium |
| HIGH-002 | Debug token string `'debug_token'` hardcoded | High |

---

## Hardcoded Secrets Scan

No hardcoded API keys, Firebase tokens, AWS access keys, JWT signing secrets, or authentication tokens were found in the source code.

**Confirmed Absent:**
- No `sk-`, `pk-`, `AKIA`, `AIza`, `ghp_`, `xox` patterns detected.
- No Firebase config objects.
- No embedded private keys or certificates.

---

## `.env` File Analysis

| File | Git-Tracked | Contains Secrets? | Risk |
|------|-------------|-------------------|------|
| `.env` | ❌ No | API URL only | None |
| `.env.development` | ❌ No | API URL only | None |
| `.env.example` | ✅ Yes | Template only | None (intentional) |
| `.env.production` | ✅ **Yes** | HTTP API URL | **HIGH-003** |

The `.env.production` file is tracked in Git and contains `VITE_API_BASE_URL=http://localhost:8080`. While this is not a secret, tracking production configuration in source control establishes a pattern where future developers may inadvertently add real secrets to production env files.

---

## Sensitive Data in localStorage

The following sensitive data is persisted in `localStorage` (accessible to any JavaScript on the page):

| Key | Content | Sensitivity |
|-----|---------|-------------|
| `spdms_token` | JWT Bearer token | **Critical** |
| `token` | JWT Bearer token (duplicate) | **Critical** |
| `auth_token` | JWT Bearer token (duplicate) | **Critical** |
| `spdms_user` | Full user object (name, email, studentId, sprNo, roles) | **High** |
| `user` | Full user object (duplicate) | **High** |
| `userRole` | Role string | Medium |

---

## Sensitive Data in Console Output

The following `console.error`/`console.log` calls output potentially sensitive information:

| File | Line | Data Logged |
|------|------|-------------|
| `xpStore.ts` | 86 | `studentId` in error message |
| `authContext.tsx` | 101 | Session expiry / 401 notification |
| `authContext.tsx` | 158 | 30-minute inactivity timeout notification |
| `activityService.ts (admin)` | 122–127 | `{ subgroupId, stageId, subgroupName, endpoint }` |
| `authStore.ts` | 27 | Parse error on localStorage user |

The most concerning is `activityService.ts` which logs internal endpoint paths and IDs to the console:

```typescript
console.log({
  subgroupId: targetSubgroupId,
  stageId,
  subgroupName,
  endpoint  // Full API endpoint path logged in production
});
```

---

## Recommendations

1. **Remove the `console.log` in `activityService.ts`** (admin) that logs endpoint paths.
2. **Remove the `debug_token` string** from `DashboardTab.tsx`.
3. **Remove `spdms_user` and `user` from localStorage** — replace with server-side session state.
4. **Add `.env.production` to `.gitignore`** and inject production values via CI/CD environment variables.
5. **Implement a structured logger** with production-safe log levels (see MED-004 recommendation).
