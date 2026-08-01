# Executive Summary — PragatiX Web Frontend Security Assessment

**Assessment Date:** 2026-08-01
**Assessor Role:** Principal AppSec Engineer / White-Box Secure Code Review
**Project:** PragatiX (SPDMS) — React + Vite SPA
**Repository Root:** `N:\SPDMS\spdms_web`
**Assessment Type:** Full White-Box Source Code Review

---

## Overall Security Score: 42 / 100

| Rating Category     | Score |
|---------------------|-------|
| Authentication      | 35/100 |
| Authorization       | 50/100 |
| Data Protection     | 40/100 |
| Input Validation    | 45/100 |
| Configuration       | 55/100 |
| Dependency Security | 55/100 |
| Secrets Management  | 60/100 |
| Transport Security  | 30/100 |

**Overall Risk Rating: HIGH**

---

## Finding Count Summary

| Severity              | Count |
|-----------------------|-------|
| 🔴 Critical            | 3     |
| 🟠 High                | 12    |
| 🟡 Medium              | 15    |
| 🔵 Low                 | 9     |
| ℹ️ Informational       | 7     |
| 🔍 Needs Manual Verification | 5 |
| **Total**             | **51** |

---

## Files Reviewed: 105

| Category | Count |
|----------|-------|
| Configuration files (package.json, vite.config, tsconfig*, tailwind, postcss, .env*, .gitignore, .oxlintrc) | 13 |
| Entry point (index.html) | 1 |
| Store/State files | 4 |
| API client files | 1 |
| Service layer files (src/services + feature services) | 17 |
| Component files | 11 |
| Feature/page files | 51 |
| Core utils, hooks, config, setup (dateFormat, extractData, useApi, apiConfig, setupTests) | 5 |
| Entry points (main.tsx, App.tsx) | 2 |

**Files with findings: 75** (of 105 reviewed, per File_By_File_Review.md)

---

## Top 5 Security Risks

1. **[CRIT-001] JWT Token Stored in localStorage** — Tokens are written to `localStorage` by `authContext.tsx`, `authStore.ts`, and `CaptainLoginPage.tsx`. Any XSS vulnerability can steal the token entirely. This is the single highest-impact risk given the privileged role system.

2. **[CRIT-003] Weak & Predictable Default Passwords** — `StudentsTab.tsx` generates a new student's default password as their date-of-birth in `DDMMYYYY` format (`pass = ${parts[2]}${parts[1]}${parts[0]}`), falling back to the hardcoded string `'123456'`. These can be trivially brute-forced or guessed.

3. **[CRIT-002] Content Security Policy allows `unsafe-inline` + `unsafe-eval`** — The CSP meta tag in `index.html` contains `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. This completely negates XSS protection from CSP, meaning any injected script will execute.

4. **[HIGH-001] Client-Side Role Determination** — `LoginPage.tsx` partially determines the user's role from the selected role dropdown (`data.role === 'Admin'`), not exclusively from backend-signed claims. An attacker who manipulates the local role state may escalate privileges client-side.

5. **[HIGH-003] Plain HTTP in Production** — `.env.production` sets `VITE_API_BASE_URL=http://localhost:8080` (HTTP, not HTTPS) and this file is tracked in Git. All API traffic in production would be unencrypted if this value is not overridden at deploy time.

---

## Quick Wins (Can be fixed in < 1 day)

1. **[CRIT-001]** Move JWT storage from `localStorage` to `httpOnly` cookies (or at minimum `sessionStorage` with short lifetime).
2. **[CRIT-002]** Remove `'unsafe-inline'` and `'unsafe-eval'` from the CSP `script-src` directive.
3. **[HIGH-002]** Remove the debug token check `if (token === 'debug_token')` from `DashboardTab.tsx`.
4. **[HIGH-005]** Enforce minimum password length ≥ 8 in `AdminProfileTab.tsx` (currently 4).
5. **[MED-003]** Add `rel="noopener noreferrer"` to all `target="_blank"` anchor tags.
6. **[HIGH-003]** Fix `.env.production` to use HTTPS and remove it from Git tracking.
7. **[CRIT-003]** Remove the hardcoded fallback password `'123456'` in `StudentsTab.tsx`.
8. **[MED-011]** Strip the incorrect README (`README.md` says "RevUp-Frontend").
9. Downgrade `react-router-dom` to `7.11.0` to clear GHSA-qwww-vcr4-c8h2 (HIGH-012).

---

## Long-Term Recommendations

1. Implement `httpOnly`, `Secure`, `SameSite=Strict` cookie-based token storage with a backend `/refresh` endpoint.
2. Tighten CSP with hash-based or nonce-based script approval.
3. Add a server-side CSRF token mechanism (double-submit cookie or synchronizer token).
4. Implement proper input sanitization library (e.g., DOMPurify) for any user-supplied content rendered to the DOM.
5. Introduce API rate-limiting indicators on login endpoints.
6. Add a dedicated `file-type` validation library for any file uploads.
7. Replace `any` types throughout the codebase with strict TypeScript interfaces to prevent type-confusion vulnerabilities.
8. Establish a formal Secrets Management process (e.g., environment injection at CI/CD, never committed `.env.*` files).
9. Add security response headers (X-Frame-Options, Permissions-Policy, Cache-Control) at the server/CDN layer.
10. Set up automated dependency auditing in CI (already partially done — enforce zero-tolerance for critical CVEs).

---

## Production Readiness Assessment

| Check | Status |
|-------|--------|
| No hardcoded secrets in source | ⚠️ Weak default passwords in source code |
| HTTPS enforced in production | ❌ `.env.production` uses HTTP |
| Debug code removed | ❌ `debug_token` check present |
| Secure token storage | ❌ JWT in localStorage |
| Strong CSP | ❌ `unsafe-inline` + `unsafe-eval` |
| Input validation on all forms | ⚠️ Partial (Zod on login, none elsewhere) |
| No sensitive data in console.log | ⚠️ Multiple `console.error` with API responses |
| Dependency vulnerabilities | ❌ 2 HIGH prod vulns (`react-router` CSRF bypass, GHSA-qwww-vcr4-c8h2) |
| Role-based access control | ⚠️ Client-side role inflation risk |
| Error handling | ⚠️ Some catch blocks swallow errors silently |

**Verdict: NOT PRODUCTION READY without addressing Critical and High findings.**

---

## Final Conclusion

PragatiX is a feature-rich academic discipline management SPA with a thoughtful architecture. However, it has several security design decisions that are inappropriate for a system managing student PII, discipline records, and privileged administrative actions. The most urgent concerns are token storage in localStorage, the absence of HTTPS enforcement in production configuration, weak default passwords, and a CSP that does not protect against XSS. These issues must be remediated before deployment to any environment accessible outside a trusted local network.
