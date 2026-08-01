# Low Severity Findings

> **9 Low findings identified.**

---

## LOW-001 — TypeScript `strict` Mode Not Enabled

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-001 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 2.1 |
| **CWE** | CWE-20: Improper Input Validation |

### Affected Location

**File:** `tsconfig.app.json`

### Explanation

The TypeScript configuration does not enable `"strict": true`. While individual options like `noUnusedLocals` and `noUnusedParameters` are set, the absence of `strict` mode means the following checks are disabled: `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitAny`. Without `noImplicitAny`, variables can silently be typed as `any`, removing all type safety. The codebase extensively uses `any` types (e.g., `data: any`, `error: any`), which can mask type confusion vulnerabilities.

### Recommended Fix

```json
{
  "compilerOptions": {
    "strict": true,
    // ... other options
  }
}
```

Enabling strict mode will expose many implicit `any` usages that should be replaced with proper interfaces.

---

## LOW-002 — `target="_blank"` Without Full `rel="noopener noreferrer"` (Multiple Locations)

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-002 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 3.1 |
| **CWE** | CWE-1022: Use of Web Link to Untrusted Target |

### Affected Locations

Any `<a target="_blank">` should have both `noopener` and `noreferrer`. This was partially addressed (see MED-006) but should be audited across the full codebase.

---

## LOW-003 — Error Boundary Exposes Raw Error to Console

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-003 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 2.7 |
| **CWE** | CWE-209: Generation of Error Message Containing Sensitive Information |

### Affected Location

**File:** `src/components/ErrorBoundary.tsx` — **Lines 22–24**

### Vulnerable Code

```typescript
public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('Unhandled React Error Boundary Catch:', error, errorInfo);
}
```

### Explanation

The full error object and `errorInfo` (including component stack) are logged to the console. In production, this reveals internal component names and state to anyone with DevTools open. The user-facing message is appropriately generic ("Something went wrong"), but the console logging should be conditional on development mode.

### Recommended Fix

```typescript
public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  if (import.meta.env.DEV) {
    console.error('Error Boundary:', error, errorInfo);
  }
  // In production, send to error monitoring service
}
```

---

## LOW-004 — Password Field in Teacher Creation Form Has `type="text"` (Plaintext Visible)

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-004 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 3.5 |
| **CWE** | CWE-549: Missing Password Field Masking |

### Affected Location

**File:** `src/features/admin/tabs/TeachersTab.tsx` — **Line 319**

### Vulnerable Code

```tsx
{!editingUser && (
  <>
    <div>
      <label>Password *</label>
      <input required type="text" value={formData.password} ...  // type="text" NOT type="password"
    </div>
  </>
)}
```

### Why This Is a Finding

The teacher/user creation form uses `type="text"` for the password input instead of `type="password"`. This means:
- The password is visible in plaintext while being typed.
- Password managers do not recognize the field as a password field.
- Browser autocomplete may not treat it correctly.

### Recommended Fix

Change `type="text"` to `type="password"` for the password input field.

---

## LOW-005 — Badge Image URL Rendered Without Content Validation

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-005 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 3.1 |
| **CWE** | CWE-79: Cross-Site Scripting (indirect) |

### Affected Location

**File:** `src/features/admin/tabs/AdminBadgeRequestsTab.tsx` — **Lines 171–175**

### Vulnerable Code

```tsx
{badgeIcon ? (
  <img 
    src={badgeIcon}  // URL comes directly from API response
    alt="badge" 
    className="w-7 h-7 object-contain" 
    onError={(e: any) => { e.target.style.display='none'; }}
  />
) : (
```

### Explanation

`badgeIcon` is sourced from the API response without URL validation. A malicious `badgeIcon` URL could include `javascript:` protocol URIs or cause the browser to make requests to attacker-controlled servers (tracking pixels). The `onError` handler uses `e.target.style.display='none'` with an `any` cast — acceptable workaround but could be typed more safely.

---

## LOW-006 — No `autocomplete="off"` on Sensitive Admin Forms

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-006 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 2.1 |
| **CWE** | CWE-522: Insufficiently Protected Credentials |

### Affected Locations

- `src/features/admin/tabs/AdminProfileTab.tsx` — change password form
- `src/features/admin/tabs/StudentsTab.tsx` — student registration form
- `src/features/admin/tabs/TeachersTab.tsx` — teacher creation form

### Explanation

Password fields and sensitive forms do not use `autocomplete="new-password"` or `autocomplete="off"` attributes. Browser autofill may populate sensitive fields with cached values from shared computers.

---

## LOW-007 — Missing `aria-label` / Accessibility on Security-Sensitive Buttons

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-007 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 1.8 |
| **CWE** | CWE-1021: Improper Restriction of Rendered UI Layers |

### Explanation

Several delete and approve/reject buttons in the admin interface lack `aria-label` attributes. This is both an accessibility issue and a security UX concern — screen reader users cannot distinguish between "Delete Student" and "Delete Teacher" buttons without proper labels. Poor accessibility in security-critical actions increases the likelihood of accidental data destruction.

---

## LOW-008 — Token Refresh Strategy Not Implemented

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-008 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 2.7 |
| **CWE** | CWE-613: Insufficient Session Expiration |

### Affected Location

**File:** `src/api/client.ts`

### Explanation

The 401 response interceptor immediately clears tokens and redirects to login. There is no token refresh mechanism (refresh token flow). If the backend issues short-lived JWTs (recommended), users will be logged out every time the token expires, with no automatic renewal. While the 30-minute inactivity timeout provides some coverage, a proper refresh token pattern would improve both security (shorter-lived access tokens) and UX.

---

## LOW-009 — `skipLibCheck: true` in TypeScript Configuration

| Field | Value |
|-------|-------|
| **Finding ID** | LOW-009 |
| **Severity** | 🔵 Low |
| **CVSS Score** | 1.5 |
| **CWE** | CWE-1076: Insufficient Adherence to Standards |

### Affected Location

**File:** `tsconfig.app.json` — `"skipLibCheck": true`

### Explanation

`skipLibCheck: true` disables type checking for declaration files in `node_modules`. While this speeds up compilation, it means that type errors in dependency definitions are silently ignored, which can allow type-unsafe patterns involving third-party libraries to pass type checking without warning.
