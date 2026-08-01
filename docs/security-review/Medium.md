# Medium Severity Findings

> **15 Medium findings identified.**

---

## MED-001 — No CSRF Protection on State-Changing API Calls

| Field | Value |
|-------|-------|
| **Finding ID** | MED-001 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 6.5 (AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N) |
| **OWASP Top 10** | A01:2021 – Broken Access Control |
| **CWE** | CWE-352: Cross-Site Request Forgery |

### Affected Locations

All `apiClient.post`, `apiClient.put`, `apiClient.delete` calls across the entire service layer.

### Explanation

No CSRF token is included in any of the state-changing API requests (POST, PUT, DELETE). While Bearer-token authentication provides some CSRF mitigation for JSON APIs (since cross-origin requests from other sites cannot read localStorage), if any endpoint ever uses cookie-based auth (e.g., after the recommended migration in CRIT-001), CSRF protection will be required.

Currently the application relies on the `Authorization: Bearer <token>` header (from localStorage) to mitigate CSRF. This is acceptable while tokens remain in localStorage, but the recommended fix for CRIT-001 (moving to `httpOnly` cookies) would introduce CSRF risk without a corresponding protection mechanism.

### Recommended Fix

Implement the double-submit cookie pattern or add a custom `X-Requested-With` header to all requests, and validate it on the backend.

```typescript
// apiClient.ts — add CSRF header
apiClient.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  return config;
});
```

---

## MED-002 — File Upload Without Type/Size Validation

| Field | Value |
|-------|-------|
| **Finding ID** | MED-002 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 6.1 (AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N) |
| **OWASP Top 10** | A04:2021 – Insecure Design |
| **CWE** | CWE-434: Unrestricted Upload of File with Dangerous Type |

### Affected Location

**File:** `src/services/studentService.ts` — **Lines 36–42**

### Vulnerable Code

```typescript
// studentService.ts — Lines 36-42
bulkParse: (file: File) => {
  const form = new FormData();
  form.append('file', file);  // No type check, no size limit
  return apiClient.post('/api/v1/students/bulk-parse', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
},
```

### Why This Is Vulnerable

The `bulkParse` function accepts any `File` object without validating file type or size. An attacker or malicious admin could upload:
- Non-Excel files to probe backend parser behavior
- Extremely large files to cause DoS
- Polyglot files that appear as Excel but contain malicious content

### Recommended Fix

```typescript
bulkParse: (file: File) => {
  const ALLOWED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only Excel files (.xlsx, .xls) are allowed.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File size must not exceed 5MB.');
  }
  const form = new FormData();
  form.append('file', file);
  return apiClient.post('/api/v1/students/bulk-parse', form);
},
```

---

## MED-003 — Unvalidated External URL Rendered as Clickable Link (Open Redirect / Phishing)

| Field | Value |
|-------|-------|
| **Finding ID** | MED-003 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 5.4 (AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N) |
| **OWASP Top 10** | A03:2021 – Injection |
| **CWE** | CWE-601: URL Redirection to Untrusted Site |

### Affected Locations

| File | Line | Code |
|------|------|------|
| `src/features/admin/tabs/AdminBadgeRequestsTab.tsx` | 203–214 | `<a href={proofLink} target="_blank" rel="noopener noreferrer">` |
| `src/features/teacher/tabs/RemovalRequestsTab.tsx` | 157–162 | `<a href={claim.evidenceUrl \|\| "#"} target="_blank" rel="noreferrer">` |

### Vulnerable Code

```tsx
// AdminBadgeRequestsTab.tsx
<a 
  href={proofLink}           // proofLink comes directly from API response — unvalidated
  target="_blank" 
  rel="noopener noreferrer" 
>
  View Verification Proof Document
</a>
```

```tsx
// RemovalRequestsTab.tsx
<a href={claim.evidenceUrl || "#"} target="_blank" rel="noreferrer">
  {claim.evidenceUrl || "No evidence provided"}
</a>
```

### Why This Is Vulnerable

`proofLink` and `evidenceUrl` are rendered directly from the backend API response with no URL validation. If a student submits a badge claim with a malicious `evidenceUrl` like `javascript:alert(document.cookie)` or a phishing URL, admins/teachers who click "View Verification Proof Document" could be redirected to a malicious site or trigger JavaScript execution.

Note: `rel="noopener noreferrer"` is present (good), which prevents `window.opener` attacks. However, `javascript:` URLs can still execute even with these attributes in some browsers.

### Recommended Fix

```typescript
// Validate URL before rendering
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// In component:
{proofLink && isSafeUrl(proofLink) && (
  <a href={proofLink} target="_blank" rel="noopener noreferrer">
    View Verification Proof Document
  </a>
)}
```

---

## MED-004 — console.error Logging of Full API Error Responses (PII/Token Leakage in DevTools)

| Field | Value |
|-------|-------|
| **Finding ID** | MED-004 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 5.3 (AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A09:2021 – Security Logging and Monitoring Failures |
| **CWE** | CWE-532: Insertion of Sensitive Information into Log File |

### Affected Locations (Sample — pattern exists in 15+ files)

| File | Line | Code |
|------|------|------|
| `src/store/xpStore.ts` | 86 | `console.error('Failed to fetch summary for student:', studentId, error)` |
| `src/features/admin/activity/api/activityService.ts` | 122–127 | `console.log({ subgroupId, stageId, subgroupName, endpoint })` |
| `src/store/authStore.ts` | 27 | `console.error('Failed to parse user from local storage')` |
| `src/store/authContext.tsx` | 101 | `console.warn("Token expired or unauthorized, logging out.")` |

### Why This Is Vulnerable

`console.error` and `console.log` statements in production code expose:
- Internal API endpoint paths
- Student IDs in error messages (`'Failed to fetch summary for student:', studentId`)
- Axios error objects that include the full request configuration (including the `Authorization` header and thus the Bearer token) in `error.config`
- Backend error messages that may reveal internal stack traces or database details

### Recommended Fix

Replace all `console.error`/`console.log` in service and store files with a conditional logging utility:

```typescript
// src/core/utils/logger.ts
const isDev = import.meta.env.MODE === 'development';

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDev) console.error(message, ...args);
    // In production: send to error tracking service (Sentry, etc.)
  },
  warn: (message: string) => {
    if (isDev) console.warn(message);
  },
};
```

---

## MED-005 — No Input Length Limits on Free-Text Fields

| Field | Value |
|-------|-------|
| **Finding ID** | MED-005 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 5.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N) |
| **OWASP Top 10** | A03:2021 – Injection |
| **CWE** | CWE-20: Improper Input Validation |

### Affected Locations (Sample)

- `src/features/admin/activity/components/ActivityForm.tsx` — `name`, `description`, `justification` fields have no `maxLength`
- `src/features/admin/tabs/StudentsTab.tsx` — `address`, `guardianName`, `fullName` fields have no `maxLength`
- `src/features/admin/pages/CreateStagePage.tsx` — `name`, `description` fields have no `maxLength`

### Vulnerable Code

```tsx
// ActivityForm.tsx
<input 
  required 
  type="text" 
  value={formData.name || ''} 
  onChange={e => handleChange('name', e.target.value)} 
  className="..."
  placeholder="e.g. Monday Remember / Regret Journal" 
  // No maxLength attribute
/>
```

### Why This Is Vulnerable

Without length limits, an attacker can submit extremely long strings that may cause:
- Backend database column overflow errors (revealing schema information)
- Frontend rendering performance issues (DoS via 1MB+ text fields)
- Log file bloat

### Recommended Fix

Add `maxLength` to all text inputs. Validate string lengths with Zod schemas before submission.

---

## MED-006 — Missing `noopener` on Some External Links

| Field | Value |
|-------|-------|
| **Finding ID** | MED-006 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 4.3 (AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N) |
| **CWE** | CWE-1022: Use of Web Link to Untrusted Target with window.opener Access |

### Affected Location

**File:** `src/features/teacher/tabs/RemovalRequestsTab.tsx` — **Line 159**

### Vulnerable Code

```tsx
<a href={claim.evidenceUrl || "#"} target="_blank" rel="noreferrer">
  {/* Missing 'noopener' — only 'noreferrer' present */}
```

### Why This Is Vulnerable

`rel="noreferrer"` implies `noopener` in modern browsers, but for maximum compatibility both should be explicit: `rel="noopener noreferrer"`.

### Recommended Fix

```tsx
<a href={claim.evidenceUrl} target="_blank" rel="noopener noreferrer">
```

---

## MED-007 — Axios Request Has No Timeout Configured

| Field | Value |
|-------|-------|
| **Finding ID** | MED-007 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H) |
| **OWASP Top 10** | A05:2021 – Security Misconfiguration |
| **CWE** | CWE-400: Uncontrolled Resource Consumption |

### Affected Location

**File:** `src/api/client.ts` — **Lines 7–12**

### Vulnerable Code

```typescript
// client.ts — Lines 7-12
export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // No timeout configured
});
```

### Why This Is Vulnerable

Without a timeout, API calls can hang indefinitely if the backend is slow or unresponsive. This can cause the UI to appear frozen and tie up browser resources. In a school system with many concurrent users, slow backend responses can cause cascading UI DoS.

### Recommended Fix

```typescript
export const apiClient = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  headers: { 'Content-Type': 'application/json' },
});
```

---

## MED-008 — API Error Messages Surfaced Directly to Users

| Field | Value |
|-------|-------|
| **Finding ID** | MED-008 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 4.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) |
| **OWASP Top 10** | A09:2021 – Security Logging and Monitoring Failures |
| **CWE** | CWE-209: Generation of Error Message Containing Sensitive Information |

### Affected Locations (Pattern — 20+ instances)

```typescript
toast.error(e.response?.data?.message || 'Failed to delete stage');
```

### Why This Is Vulnerable

Backend error messages are passed directly to `toast.error()`. If the backend returns verbose errors containing stack traces, SQL queries, or internal paths, these will be displayed to the user. Backend error message content should be sanitized or mapped to user-friendly messages before display.

---

## MED-009 — `window.confirm` / `alert` Used for Security-Sensitive Actions

| Field | Value |
|-------|-------|
| **Finding ID** | MED-009 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 3.5 (AV:N/AC:L/PR:L/UI:R/S:U/C:N/I:L/A:N) |
| **CWE** | CWE-1021: Improper Restriction of Rendered UI Layers |

### Affected Locations

- `src/features/student/pages/StudentDetailsPage.tsx` — Line 114: `window.confirm('Are you sure you want to delete this student profile?')`
- `src/features/student/pages/StudentDetailsPage.tsx` — Line 117: `alert('Student deleted successfully')`
- `src/features/student/pages/StudentDetailsPage.tsx` — Line 98: `alert('Points adjusted successfully!')`

### Why This Is Vulnerable

`window.confirm` and `alert` dialogs can be suppressed, auto-dismissed, or manipulated by browser automation tools and browser extensions. Security-sensitive confirmations (delete student, adjust points) should use the application's own `ConfirmationModal` component, which is already implemented and used elsewhere.

---

## MED-010 — No Rate Limiting Indication on Login Form

| Field | Value |
|-------|-------|
| **Finding ID** | MED-010 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 5.9 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N) |
| **OWASP Top 10** | A07:2021 – Identification and Authentication Failures |
| **CWE** | CWE-307: Improper Restriction of Excessive Authentication Attempts |

### Affected Location

**File:** `src/features/auth/LoginPage.tsx`

### Why This Is a Finding

The login form has no client-side brute-force protection (no lockout after N failures, no CAPTCHA, no progressive delay). While rate limiting should primarily be enforced server-side, the frontend should also implement protective UX (disable submit after 5 failures, show lockout message). This is a Needs Manual Verification item for server-side but is confirmed absent on the client side.

---

## MED-011 — README Still References "RevUp-Frontend" (Information Disclosure)

| Field | Value |
|-------|-------|
| **Finding ID** | MED-011 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 3.1 (AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-200: Exposure of Sensitive Information |

### Affected Location

**File:** `README.md` — **Line 1**

### Vulnerable Code

```markdown
# Revup-Frontend
React + TypeScript + Vite application for RevUp.
```

### Why This Is a Finding

The README exposes that this codebase was originally derived from or is related to another project called "RevUp." This information disclosure could assist attackers in identifying the application's code provenance, finding common vulnerabilities if RevUp is open-source, or social-engineering developers.

---

## MED-012 — Inactivity Timer Uses `console.warn` with Session Expiry Message

| Field | Value |
|-------|-------|
| **Finding ID** | MED-012 |
| **Severity** | 🟡 Medium (Low impact, Medium for info disclosure) |
| **CVSS Score** | 3.1 |
| **CWE** | CWE-532: Insertion of Sensitive Information into Log File |

### Affected Location

**File:** `src/store/authContext.tsx` — **Line 158**

### Vulnerable Code

```typescript
// authContext.tsx — Line 158
console.warn('Session expired due to 30 minutes of inactivity.');
```

This message confirms to anyone with DevTools open that the session timeout is exactly 30 minutes — useful information for timing attacks.

---

## MED-013 — `window.location.href` Used for Navigation (Bypasses Router)

| Field | Value |
|-------|-------|
| **Finding ID** | MED-013 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 4.3 (AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N) |
| **CWE** | CWE-601: URL Redirection to Untrusted Site |

### Affected Locations

- `src/store/authContext.tsx` lines 140, 185: `window.location.href = '/login'`
- `src/components/layout/Sidebar.tsx` line 42: `window.location.href = '/login'`
- `src/api/client.ts` line 45: `window.location.href = '/login'`

### Why This Is a Finding

Using `window.location.href` for redirect after logout causes a full page reload (wiping React state), which is the intended behavior. However, if an attacker can influence the value passed to `href`, it could enable open redirect. In the current code all values are hardcoded to `/login` so the risk is low, but the pattern sets a dangerous precedent. React Router's `navigate()` should be used instead.

---

## MED-014 — `authStore.ts` (Zustand) Is a Legacy Duplicate Store

| Field | Value |
|-------|-------|
| **Finding ID** | MED-014 |
| **Severity** | 🟡 Medium |
| **CWE** | CWE-561: Dead Code |

### Affected Location

**File:** `src/store/authStore.ts`

### Why This Is a Finding

`authStore.ts` is a Zustand store that duplicates the authentication state already managed by `authContext.tsx`. It has its own localStorage persistence logic with different key names. This increases the attack surface (more keys to compromise, more logout code to maintain), and creates security confusion. It appears unused in the current feature set but its presence in the codebase could lead to future misuse.

### Recommended Fix

Remove `authStore.ts` entirely after confirming no component imports it.

---

## MED-015 — CSV Injection in Attendance Report Export

| Field | Value |
|-------|-------|
| **Finding ID** | MED-015 |
| **Severity** | 🟡 Medium |
| **CVSS Score** | 5.3 (AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N) |
| **OWASP Top 10** | A03:2021 – Injection |
| **CWE** | CWE-1236: Improper Neutralization of Formula Elements in a CSV File |

### Affected Location

**File:** `src/features/admin/tabs/AdminAttendanceTab.tsx` — **Lines 267–284**

### Vulnerable Code

```typescript
// AdminAttendanceTab.tsx — Lines 271-276
const rows = [
  ['Status', 'Student Name', 'Register Number'],
  ...presentList.map((s: any) => ['Present', s.studentName || s.fullName || '', s.registerNumber || s.regNo || '']),
  ...absentList.map((s: any) => ['Absent', s.studentName || s.fullName || '', s.registerNumber || s.regNo || ''])
];
const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
const encodedUri = encodeURI(csvContent);
```

### Why This Is Vulnerable

The CSV export concatenates student names and register numbers directly into CSV cells without escaping. If a student name or register number begins with `=`, `+`, `-`, or `@` (e.g., a name entered as `=HYPERLINK("https://evil.com","Click")` or `+SUM(A1:A9)`), opening the exported `.csv` file in Microsoft Excel or LibreOffice Calc will evaluate it as a formula. This is a CSV/formula injection that can be used to exfiltrate data from the victim's spreadsheet or phish the admin who opens the report.

### Recommended Fix

```typescript
// Escape formula-prefix characters and quote cells containing separators
function escapeCsvCell(value: string): string {
  const str = String(value ?? '').replace(/"/g, '""');
  if (/[,"\n\r]/.test(str) || /^[=+\-@\t]/.test(str)) {
    return `"${str}"`;
  }
  return str;
}

const rows = [
  ['Status', 'Student Name', 'Register Number'],
  ...presentList.map((s: any) => ['Present', escapeCsvCell(s.studentName || ''), escapeCsvCell(s.registerNumber || '')]),
  ...absentList.map((s: any) => ['Absent', escapeCsvCell(s.studentName || ''), escapeCsvCell(s.registerNumber || '')])
];
```
