# OWASP ASVS 4.0 Compliance Report

> ASVS Level 2 target (standard applications handling sensitive data).

## V1 — Architecture

| Requirement | Status | Notes |
|-------------|--------|-------|
| V1.1.1 — Secure SDLC | ✅ | CI pipeline with SAST, audit |
| V1.2.1 — Unique module accounts | ⚠️ | Two parallel auth stores |
| V1.4.1 — Enforced access controls at trusted layer | ⚠️ | Frontend only; backend NMV |
| V1.4.4 — Single, well-tested access control mechanism | ❌ | Two auth stores (HIGH-010) |

## V2 — Authentication

| Requirement | Status | Notes |
|-------------|--------|-------|
| V2.1.1 — Password min 12 chars | ❌ | Min 4 chars (HIGH-005) |
| V2.1.2 — Password max 128 chars | ❌ | No maximum enforced |
| V2.1.3 — Password truncation prohibited | ✅ | No evidence of truncation |
| V2.1.6 — Paste into password fields | ✅ | Standard inputs allow paste |
| V2.2.1 — Anti-automation controls | ❌ | No CAPTCHA / rate limiting (MED-010) |
| V2.2.2 — Weak credential check | ❌ | Default password is DOB / 123456 (CRIT-003) |
| V2.3.1 — System-generated initial passwords | ❌ | DOB-based or '123456' (CRIT-003) |
| V2.5.1 — Secure credential reset | NMV | No password reset flow visible |
| V2.7.1 — OTP / MFA option | ❌ | No MFA |

## V3 — Session Management

| Requirement | Status | Notes |
|-------------|--------|-------|
| V3.2.1 — New session token on login | ✅ | New JWT per login |
| V3.2.3 — Session token entropy ≥ 64 bits | NMV | Backend JWT secret |
| V3.2.4 — Session token stored securely | ❌ | localStorage (CRIT-001) |
| V3.3.1 — Logout invalidates server-side session | ❌ | No backend logout (HIGH-007) |
| V3.3.2 — Idle session timeout | ✅ | 30 minutes |
| V3.3.3 — Session timeout after inactivity | ✅ | Implemented |
| V3.4.1 — Cookie-based tokens use SameSite | ❌ | Not using cookies |
| V3.4.2 — Cookie-based tokens use HttpOnly | ❌ | Not using cookies |
| V3.4.3 — Cookie-based tokens use Secure | ❌ | Not using cookies |

## V4 — Access Control

| Requirement | Status | Notes |
|-------------|--------|-------|
| V4.1.1 — All access control decisions at trusted layer | ❌ | Client-side role inflation (HIGH-001) |
| V4.1.2 — Default deny | ✅ | Catch-all → /login |
| V4.2.1 — IDOR protection | NMV | Backend verification required |
| V4.3.1 — Admin UI protected | ✅ | ProtectedRoute on /admin |

## V5 — Validation

| Requirement | Status | Notes |
|-------------|--------|-------|
| V5.1.1 — HTTP parameter pollution protection | ✅ | Axios handles params safely |
| V5.2.1 — All untrusted HTML sanitized | ✅ | React auto-escaping |
| V5.3.1 — Output encoding for HTML context | ✅ | React JSX |
| V5.3.2 — Output encoding for URL context | ❌ | Unvalidated URLs (MED-003) |
| V5.4.1 — TypeScript strict mode | ❌ | Not enabled (LOW-001) |

## V7 — Error Handling and Logging

| Requirement | Status | Notes |
|-------------|--------|-------|
| V7.1.1 — No credentials/tokens in logs | ❌ | API error objects can contain token in config |
| V7.1.2 — No PII in logs | ❌ | studentId in console.error (MED-004) |
| V7.4.1 — Generic error messages to users | ✅ | ErrorBoundary shows generic message |
| V7.4.2 — Stack traces not shown to users | ✅ | ErrorBoundary hides stack trace |

## V9 — Communications

| Requirement | Status | Notes |
|-------------|--------|-------|
| V9.1.1 — TLS for all connections | ❌ | HTTP in .env.production (HIGH-003) |
| V9.1.2 — TLS certificate validation | ❌ | `secure: false` in Vite proxy (HIGH-009) |

## V14 — Configuration

| Requirement | Status | Notes |
|-------------|--------|-------|
| V14.1.2 — Compiler warnings treated as errors | ⚠️ | skipLibCheck true (LOW-009) |
| V14.2.1 — All components up to date | ⚠️ | `react-router-dom` 7.18.2 in vulnerable range (GHSA-qwww-vcr4-c8h2, HIGH-012) |
| V14.2.2 — No unneeded features | ⚠️ | authStore.ts appears unused |
| V14.4.1 — HTTP security headers | ❌ | X-Frame-Options, HSTS missing |
| V14.4.3 — Content-Security-Policy | ❌ | unsafe-inline, unsafe-eval (CRIT-002) |
| V14.4.4 — X-Content-Type-Options | ✅ | nosniff in index.html |
| V14.5.1 — CORS origin whitelist | NMV | Backend configuration |
