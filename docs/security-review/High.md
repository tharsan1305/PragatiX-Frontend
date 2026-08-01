# High Severity Findings

> **12 High findings identified.**

---

## HIGH-001 — Client-Side Role Determination / Role Inflation

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-001 |
| **Severity** | 🟠 High |
| **CVSS Score** | 8.1 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A01:2021 – Broken Access Control |
| **CWE** | CWE-285: Improper Authorization |
| **MITRE ATT&CK** | T1548 – Abuse Elevation Control Mechanism |

### Affected Location

**File:** `src/features/auth/LoginPage.tsx` — **Lines 57–68** (vulnerable fallback at lines 62–65)

### Vulnerable Code

```typescript
// LoginPage.tsx — Lines 57-68 (vulnerable fallback at line 64)
if (data.role === 'Admin' || data.role === 'Teacher') {
  if (roles.includes('ROLE_ADMIN') || userType === 'ADMIN') {
    finalRole = 'ADMIN';
  } else if (userType === 'TEACHER' || roles.includes('ROLE_TEACHER') || roles.includes('ROLE_DISCIPLINE_COMMITTEE')) {
    finalRole = 'TEACHER';
  } else {
    // If response contains admin or teacher data, allow login
    finalRole = data.role === 'Admin' ? 'ADMIN' : 'TEACHER';  // VULNERABLE: Falls back to form selection
  }
} else {
  finalRole = (isCaptain || userType === 'CAPTAIN') ? 'CAPTAIN' : 'STUDENT';
}
```

### Why This Is Vulnerable

The `else` branch at line 64 sets `finalRole` to whatever the user selected in the login form dropdown, even if the backend response does NOT contain the expected `ROLE_ADMIN` or `ROLE_TEACHER` claim. This means a student who selects "Admin" in the role dropdown and submits their credentials may receive an ADMIN role assignment in the frontend state if the backend response structure does not exactly match the expected fields.

The role is then stored in `localStorage` (via `localStorage.setItem('spdms_user', ...)` at line 45) as part of the user object and used to determine which dashboard to display. The `ProtectedRoute` component reads this role from the `authContext` which initializes from `localStorage`.

### Recommended Fix

```typescript
// SECURE: Only trust roles from backend response — never from the form selection.
const serverRole = (roles[0] || userType || '').toUpperCase().replace('ROLE_', '');
if (!serverRole) {
  setError('Authentication failed: no role assigned by server.');
  return;
}
finalRole = serverRole; // Always use server-assigned role
```

---

## HIGH-002 — Debug Token Bypass in Student Dashboard

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-002 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A07:2021 – Identification and Authentication Failures |
| **CWE** | CWE-489: Active Debug Code |
| **MITRE ATT&CK** | T1078 – Valid Accounts |

### Affected Location

**File:** `src/features/student/tabs/DashboardTab.tsx` — **Lines 53–56**

### Vulnerable Code

```typescript
// DashboardTab.tsx — Lines 53-56
if (token === 'debug_token') {
  setIsLoading(false);
  return; // Skip fetch for mock login
}
```

### Why This Is Vulnerable

The string `'debug_token'` is a hardcoded, well-known bypass token. Any user who sets `localStorage.setItem('spdms_token', 'debug_token')` in their browser console will bypass the auth check in `DashboardTab`, skip the `/api/v1/auth/me` API call, and load the dashboard with mock/default data. While this only shows mock data in this specific tab, it demonstrates that debug code was left in production code.

### Recommended Fix

Remove the debug token check entirely. Use a proper test/mock environment configured via `import.meta.env.MODE`:

```typescript
// Remove this block entirely:
// if (token === 'debug_token') { ... }

// If mocking is needed in development, use:
if (import.meta.env.MODE === 'development' && import.meta.env.VITE_MOCK_API === 'true') {
  // load mock data
}
```

---

## HIGH-003 — Plain HTTP in Production Environment File

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-003 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.4 (AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A02:2021 – Cryptographic Failures |
| **CWE** | CWE-319: Cleartext Transmission of Sensitive Information |

### Affected Location

**File:** `.env.production` — **Line 2**

### Vulnerable Code

```env
# .env.production
VITE_API_BASE_URL=http://localhost:8080
```

### Why This Is Vulnerable

The production environment file specifies an HTTP (not HTTPS) backend URL pointing to `localhost`. If this value is used in a production deployment without override, all API calls (including login with credentials, student PII, JWT tokens in Authorization headers) will be transmitted in cleartext over HTTP, making them interceptable by any network-level attacker (MITM).

Additionally, `.env.production` is tracked in Git (confirmed in `.gitignore` which explicitly does NOT ignore `.env.production`), meaning its contents are visible in repository history.

### Recommended Fix

```env
# .env.production — use HTTPS with the actual production domain
VITE_API_BASE_URL=https://api.pragatix.example.com
```

Add the production URL only at CI/CD deploy time via environment variable injection, not in a committed file.

---

## HIGH-004 — Insecure Sidebar Logout (Does Not Call Auth Logout)

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-004 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.2 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A07:2021 – Identification and Authentication Failures |
| **CWE** | CWE-613: Insufficient Session Expiration |

### Affected Location

**File:** `src/components/layout/Sidebar.tsx` — **Lines 39–43**

### Vulnerable Code

```typescript
// Sidebar.tsx — Lines 39-43
const handleLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
```

### Why This Is Vulnerable

The `Sidebar` component's logout function only removes `auth_token` and `user` from `localStorage`, then redirects to `/login`. It does NOT:
- Remove `spdms_token` (the primary token key used by `authContext`)
- Remove `spdms_user`
- Remove `token` (secondary key)
- Remove `userRole`
- Call the `authContext.logout()` function which clears all state and sessionStorage

After this logout, the `authContext` still holds the token in React state and `spdms_token` remains in `localStorage`. The user is redirected to `/login`, but the token is still valid and present in storage. A subsequent navigation to `/admin` or `/teacher` would re-authenticate successfully from the remaining localStorage entries.

### Recommended Fix

```typescript
// Sidebar.tsx — use the auth context logout function
import { useAuth } from '../../store/authContext';

const { logout } = useAuth();

const handleLogout = () => {
  logout(); // Clears all tokens, all localStorage keys, sessionStorage
};
```

---

## HIGH-005 — Weak Password Minimum Length (4 Characters)

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-005 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A07:2021 – Identification and Authentication Failures |
| **CWE** | CWE-521: Weak Password Requirements |

### Affected Location

**File:** `src/features/admin/tabs/AdminProfileTab.tsx` — **Lines 53–58**

### Vulnerable Code

```typescript
// AdminProfileTab.tsx — Lines 53-58
const handleChangePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newPassword || newPassword.trim().length < 4) {  // VULNERABLE: min 4 chars
    toast.error("Password must be at least 4 characters.");
    return;
  }
```

### Why This Is Vulnerable

A minimum password length of 4 characters allows trivially weak passwords like `1234`, `pass`, `aaaa`. NIST SP 800-63B and OWASP ASVS v4 require minimum 8 characters (12 recommended). This is the admin account password change — the highest-privilege user in the system.

### Recommended Fix

```typescript
if (!newPassword || newPassword.trim().length < 12) {
  toast.error("Password must be at least 12 characters.");
  return;
}
// Also add complexity check or zxcvbn strength meter
```

---

## HIGH-006 — AppLayout Reads Role from localStorage Directly (Bypasses Auth Context)

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-006 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.1 (AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A01:2021 – Broken Access Control |
| **CWE** | CWE-284: Improper Access Control |

### Affected Location

**File:** `src/components/layout/AppLayout.tsx` — **Lines 9–19**

### Vulnerable Code

```typescript
// AppLayout.tsx — Lines 9-19
// In a real app, this role would come from your auth store
const storedUser = localStorage.getItem('user');
let role = null;
if (storedUser) {
  try {
    const user = JSON.parse(storedUser);
    role = user.role;
  } catch (e) { ... }
}
```

### Why This Is Vulnerable

`AppLayout` reads the `user.role` directly from `localStorage` rather than from the authenticated `authContext`. A user can open browser DevTools, run `localStorage.setItem('user', JSON.stringify({role:'ADMIN'}))`, and `AppLayout` will render the admin navigation sidebar. While `ProtectedRoute` guards the actual routes, this creates a confusing and potentially exploitable split between what the UI shows and what the auth context knows.

### Recommended Fix

```typescript
// AppLayout.tsx — use auth context
import { useAuth } from '../../store/authContext';
const { role } = useAuth();
```

---

## HIGH-007 — No Server-Side Token Revocation / Missing Backend Logout Call

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-007 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.2 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A07:2021 – Identification and Authentication Failures |
| **CWE** | CWE-613: Insufficient Session Expiration |

### Affected Location

**File:** `src/store/authContext.tsx` — **Lines 174–186**

### Vulnerable Code

```typescript
// authContext.tsx — Lines 174-186
const logout = () => {
  setToken(null);
  setUser(null);
  setRole(null);
  setSubRolesState([]);
  localStorage.removeItem('spdms_token');
  // ... other localStorage clears
  sessionStorage.clear();
  window.location.href = '/login';
  // MISSING: No API call to backend to revoke/invalidate the JWT
};
```

### Why This Is Vulnerable

The logout function clears client-side storage but does not call any backend endpoint to invalidate the JWT. If the token is still valid on the server (JWT expiry has not passed), an attacker who captured the token before logout can continue using it until natural expiry. For admin tokens this is a significant risk.

### Recommended Fix

```typescript
const logout = async () => {
  try {
    await apiClient.post('/api/v1/auth/logout'); // Backend adds token to denylist
  } catch { /* still proceed with local cleanup */ }
  // ... rest of cleanup
};
```

---

## HIGH-008 — User PII Stored in localStorage as JSON

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-008 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.5 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A02:2021 – Cryptographic Failures |
| **CWE** | CWE-312: Cleartext Storage of Sensitive Information |

### Affected Location

**File:** `src/store/authContext.tsx` — **Lines 73–81**

### Vulnerable Code

```typescript
// authContext.tsx — Lines 73-81
useEffect(() => {
  if (user) {
    localStorage.setItem('spdms_user', JSON.stringify(user)); // Stores full user object including PII
    localStorage.setItem('user', JSON.stringify(user));
  }
}, [user]);
```

The `UserData` interface includes: `userId`, `username`, `fullName`, `email`, `studentId`, `sprNo`, `department`, `section`, `year`, `score`, `totalXp`, `isCaptain`, plus arbitrary extra fields via `[key: string]: any`.

### Why This Is Vulnerable

PII (full name, email, student ID, SPR number, department details) is stored in plaintext in `localStorage`. This is accessible by any XSS and also by any browser extension running on the page.

### Recommended Fix

Store only the minimum required data (e.g., `userId`, `role`) in localStorage. Fetch full profile from `/api/v1/auth/me` on each session initialization rather than persisting it locally.

---

## HIGH-009 — Vite Proxy `secure: false` — TLS Verification Disabled

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-009 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.4 (AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A02:2021 – Cryptographic Failures |
| **CWE** | CWE-295: Improper Certificate Validation |

### Affected Location

**File:** `vite.config.ts` — **Lines 7–15**

### Vulnerable Code

```typescript
// vite.config.ts — Lines 7-15 (secure: false at line 12)
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080/',
      changeOrigin: true,
      secure: false,  // VULNERABLE: Disables TLS certificate verification
    },
  },
},
```

### Why This Is Vulnerable

`secure: false` in the Vite proxy disables TLS certificate verification for proxied requests. While this is a development-only configuration, the habit of ignoring certificate validation is dangerous and this exact pattern is often accidentally replicated in staging/production Axios configurations. If the Axios client ever uses a similar pattern (or if this dev proxy is accidentally used against a real HTTPS endpoint), MITM attacks become possible.

### Recommended Fix

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8080/',
    changeOrigin: true,
    // Remove 'secure: false' — only needed if target uses self-signed cert
    // If backend has self-signed cert in dev, document explicitly and limit to dev only
  },
},
```

---

## HIGH-010 — Dual Auth Stores with Desynchronized State

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-010 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.0 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A01:2021 – Broken Access Control |
| **CWE** | CWE-284: Improper Access Control |

### Affected Locations

- `src/store/authContext.tsx` (primary auth store)
- `src/store/authStore.ts` (secondary Zustand auth store)

### Why This Is Vulnerable

The application maintains two separate authentication stores: `authContext.tsx` (React Context, primary) and `authStore.ts` (Zustand, appears to be legacy). Both stores read from and write to `localStorage` using overlapping but different key names. `authStore` uses `auth_token` and `token`; `authContext` uses `spdms_token` and `token`. The `logout()` in `authStore` only removes `auth_token`, `token`, and `user` — not `spdms_token` or `spdms_user`.

This desynchronization means:
- A logout through `authStore` leaves `spdms_token` in storage.
- A login through `authContext` may not be reflected in `authStore.isAuthenticated`.
- Components that accidentally use `useAuthStore()` instead of `useAuth()` will have incorrect auth state.

### Recommended Fix

Remove `authStore.ts` entirely and consolidate all authentication state in `authContext.tsx`. Audit all components to ensure they only use `useAuth()` from `authContext`.

---

## HIGH-011 — XP Claim Silently Returns `true` on API Failure

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-011 |
| **Severity** | 🟠 High |
| **CVSS Score** | 7.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N) |
| **OWASP Top 10** | A04:2021 – Insecure Design |
| **CWE** | CWE-394: Unexpected Status Code or Return Value |

### Affected Location

**File:** `src/store/xpStore.ts` — **Lines 122–135**

### Vulnerable Code

```typescript
// xpStore.ts — Lines 122-135
submitXpClaim: async (category, activityName, xpPoints, evidenceUrl) => {
  try {
    const response = await apiClient.post('/api/v1/xp/submit', { ... });
    return response.data.success === true;
  } catch (error) {
    console.error('Failed to submit XP claim');
    return true; // VULNERABLE: Simulate success on offline/mock mode like Flutter
  }
}
```

### Why This Is Vulnerable

When the API call to submit an XP claim fails (network error, 500, 401, etc.), the function silently returns `true`, indicating success to the caller. This means:
- The student's UI shows a "claim submitted successfully" message even when the claim was NOT submitted.
- Students lose track of whether their XP claims were actually processed.
- The comment "Simulate success on offline/mock mode" suggests this was intended for offline mode but was left in production code.

### Recommended Fix

```typescript
submitXpClaim: async (...) => {
  try {
    const response = await apiClient.post('/api/v1/xp/submit', { ... });
    return response.data.success === true;
  } catch (error) {
    console.error('Failed to submit XP claim', error);
    return false; // Return false — let the UI handle the error state
  }
}
```

---

## HIGH-012 — `react-router-dom` CSRF Bypass via Known CVE (GHSA-qwww-vcr4-c8h2)

| Field | Value |
|-------|-------|
| **Finding ID** | HIGH-012 |
| **Severity** | 🟠 High |
| **CVSS Score** | 6.5 (AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N) |
| **OWASP Top 10** | A01:2021 – Broken Access Control |
| **CWE** | CWE-352: Cross-Site Request Forgery |
| **Source** | npm audit (SAST/SCA) — confirmed `npm audit --omit=dev` |

### Affected Dependency

**Package:** `react-router-dom` — pinned exact version **7.18.2** (in `package.json` line 23)

### Why This Is Vulnerable

`react-router-dom@7.18.2` pulls in `react-router@7.12.0–8.2.0`, which is affected by **GHSA-qwww-vcr4-c8h2** ("React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response", CWE-352). `npm audit` reports **2 HIGH severity vulnerabilities** in the production dependency tree (one for `react-router`, one for its direct dependant `react-router-dom`).

The advisory affects the RSC mode data-router where a crafted cross-origin request can cause an action to execute before the expected 400 response check. While this SPA uses classic `BrowserRouter` (not RSC mode) and mitigates CSRF via the Bearer token header (see MED-001), the advisory is flagged HIGH by npm audit and will fail `npm audit --audit-level=high` in CI, blocking pipeline gating.

### Recommended Fix

```bash
npm install react-router-dom@7.11.0   # Per advisory: downgrade to 7.11.0
```

### Affected Reports

Cross-referenced in `CSRF_Report.md`, `Dependency_Report.md`, `Configuration_Report.md` (package.json notes), `ASVS_Report.md` (V14.2.1), `Risk_Matrix.md`, and `Final_Security_Report.md` (top High findings table).

**Confidence: HIGH** — Confirmed by `npm audit --omit=dev` (see `Dependency_Report.md`).
