# Final Security Assessment Report — PragatiX Web Frontend

**Date:** 2026-08-01  
**Assessor:** Principal AppSec Engineer (White-Box Review)  
**Scope:** Full source code review — `N:\SPDMS\spdms_web`  
**Classification:** CONFIDENTIAL — For Development Team and Security Officers

---

## 1. Executive Summary

PragatiX is a React 19 + Vite 8 Single Page Application for student discipline management at an academic institution. The application manages sensitive student PII (names, DOBs, email addresses, guardian contact information, discipline records, and XP scores) for multiple user roles including administrators, teachers, class coordinators, HODs, captains, and students.

A complete white-box security assessment was performed, reviewing 105 files (91 source + 14 configuration/entry files) including all configuration, source code, environment files, and documentation. **51 security findings** were identified across Critical, High, Medium, Low, and Informational categories, plus 5 items requiring manual penetration testing verification.

**Overall Security Score: 42/100**  
**Overall Risk Rating: HIGH**  
**Production Readiness: NOT READY**

---

## 2. Finding Counts

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 12 |
| 🟡 Medium | 15 (including MED-015) |
| 🔵 Low | 9 |
| ℹ️ Informational | 7 |
| 🔍 Needs Manual Verification | 5 |
| **Total** | **51** |

---

## 3. Files Reviewed

**Total: 105 files**  
**Files with findings: 75**  
**Files with no findings: 30**

---

## 4. Critical Findings (Must Fix Before Deployment)

### CRIT-001 — JWT Token Stored in localStorage
**Risk: Account takeover via XSS. Any injected script can steal admin/teacher tokens.**  
**Fix:** Migrate to `httpOnly` cookies set by the backend. Remove all `localStorage.setItem(token)` calls.  
**Files:** `authContext.tsx`, `authStore.ts`, `LoginPage.tsx`, `CaptainLoginPage.tsx`, `client.ts`

### CRIT-002 — CSP with `unsafe-inline` and `unsafe-eval`
**Risk: CSP provides zero XSS protection. Any injected script executes freely.**  
**Fix:** Move the inline loader script to `/public/loader-dismiss.js`, then remove `unsafe-inline` and `unsafe-eval` from the CSP.  
**File:** `index.html`

### CRIT-003 — Default Student Password is Date of Birth or `123456`
**Risk: Any person with access to student DOB (which may be semi-public) can log into that student's account.**  
**Fix:** Remove the DOB-based and `'123456'` fallback password generation. Require explicit password entry or implement a secure one-time link mechanism.  
**File:** `src/features/admin/tabs/StudentsTab.tsx`

---

## 5. Top High Findings

| ID | Title | Impact | Fix Time |
|----|-------|--------|----------|
| HIGH-001 | Client-side role determination | Privilege escalation | 1 hour |
| HIGH-002 | Debug token bypass in production | Auth bypass | 5 minutes |
| HIGH-003 | HTTP in `.env.production` | MITM on all traffic | 15 minutes |
| HIGH-004 | Incomplete sidebar logout | Session persistence | 10 minutes |
| HIGH-005 | Password minimum 4 characters | Brute force | 5 minutes |
| HIGH-007 | No backend logout call | Token reuse post-logout | 30 minutes |
| HIGH-008 | Full user PII in localStorage | PII exposure via XSS | With CRIT-001 fix |
| HIGH-011 | XP claim silently returns true on fail | Data integrity | 5 minutes |
| HIGH-012 | `react-router-dom` CSRF bypass (GHSA-qwww-vcr4-c8h2) | CSRF on state-changing routes | Downgrade to 7.11.0 |

---

## 6. Security Architecture Assessment

### Authentication: INSUFFICIENT
The application uses a dual-store pattern (`authContext` + `authStore`) that creates desynchronized logout behavior. Tokens are stored in JavaScript-accessible storage, making them vulnerable to XSS theft. The login role determination partially uses user-controlled input (form dropdown) rather than server-side claims exclusively.

### Authorization: ACCEPTABLE (with caveats)
Route-level RBAC via `ProtectedRoute` is correctly structured. Sub-role gating (CC, HOD tabs) is UI-level only. Object-level authorization (IDOR) requires backend verification. The `ProtectedRoute` logic itself is sound.

### Input Validation: INCOMPLETE
Only the login form uses schema-based validation (Zod). All admin forms use minimal HTML `required` attributes with no length limits, format validation, or Zod schemas. File upload has no type or size validation.

### Output Encoding: GOOD
React's JSX auto-escaping prevents the majority of XSS scenarios. `dangerouslySetInnerHTML` is not used anywhere. The only output encoding gaps are unvalidated URLs in `href` and `src` attributes.

### Transport Security: INSUFFICIENT
The production environment configuration specifies an HTTP (not HTTPS) backend URL. This is the single most critical deployment risk.

### Configuration Security: ISSUES
CSP is present but ineffective due to `unsafe-inline` and `unsafe-eval`. Multiple security headers are absent (X-Frame-Options, HSTS). Source maps are not disabled for production builds.

### Logging and Monitoring: INADEQUATE
35+ `console.error`/`console.log` calls in production code, some including user IDs and internal endpoint paths. No structured logging or error monitoring integration.

---

## 7. Positive Security Controls

The following security practices are well-implemented and should be preserved:

✅ **React StrictMode** — active on all components  
✅ **ErrorBoundary** — prevents raw error exposure to users  
✅ **No `dangerouslySetInnerHTML`** — XSS risk from React rendering eliminated  
✅ **ProtectedRoute with `replace` prop** — prevents back-navigation to protected pages  
✅ **30-minute inactivity timeout** — limits session exposure  
✅ **Multi-tab logout synchronization** — via `storage` event  
✅ **CI/CD security pipeline** — Semgrep, CodeQL, Gitleaks, npm audit, Trivy/Grype/Syft  
✅ **SBOM generation** — `sbom.cdx.json` maintained  
✅ **`encodeURIComponent` on search parameters** — prevents URL injection  
✅ **Catch-all route redirects to `/login`** — no unprotected routes  
✅ **`rel="noopener noreferrer"` on most external links**  
✅ **`X-Content-Type-Options: nosniff`** in index.html  
✅ **Strict-origin referrer policy** in index.html  
✅ **SBOM generation + CI security pipeline** with Semgrep, CodeQL, Gitleaks, Trivy/Grype/Syft  

---

## 8. Developer Checklist

### Before Every Commit
- [ ] No `console.log`/`console.error` statements that include user IDs, tokens, or endpoint paths
- [ ] All new forms use Zod validation schemas
- [ ] All password inputs use `type="password"`
- [ ] New `<a target="_blank">` tags include `rel="noopener noreferrer"`
- [ ] External URLs from API rendered in `href`/`src` are validated via `isSafeUrl()`

### Before Every PR
- [ ] No new `localStorage.setItem(token)` patterns
- [ ] No `window.confirm()` for security-sensitive actions (use `ConfirmationModal`)
- [ ] No hardcoded email addresses, passwords, or fallback credentials
- [ ] New API endpoints have error handling that does NOT silently return success
- [ ] File upload inputs include type and size validation

### Before Production Deployment
- [ ] CRIT-001 (localStorage JWT) remediated or acknowledged with compensating controls
- [ ] CRIT-002 (CSP) fixed — `unsafe-inline` and `unsafe-eval` removed
- [ ] CRIT-003 (default passwords) removed
- [ ] HIGH-002 (debug token) removed
- [ ] HIGH-003 (.env.production) set to HTTPS URL and removed from Git
- [ ] `react-router-dom` downgraded to 7.11.0 (resolves GHSA-qwww-vcr4-c8h2)
- [ ] Source maps disabled (`build.sourcemap: false`)
- [ ] X-Frame-Options and HSTS configured at CloudFront/CDN level
- [ ] Backend logout endpoint verified to invalidate tokens

---

## 9. Secure Deployment Checklist

- [ ] **HTTPS**: All traffic encrypted. Backend URL is `https://...`
- [ ] **CDN Headers**: X-Frame-Options: DENY, HSTS, Permissions-Policy set at CloudFront
- [ ] **CSP**: `unsafe-inline` and `unsafe-eval` removed; nonce-based scripts
- [ ] **Source Maps**: Disabled in production build
- [ ] **Environment Variables**: Injected via CI/CD, not committed to Git
- [ ] **Token Storage**: httpOnly cookies (or acknowledged risk with localStorage + compensating XSS controls)
- [ ] **Backend Rate Limiting**: Verified on login endpoints
- [ ] **Backend JWT**: Algorithm verified (RS256/ES256), strong secret, expiry enforced
- [ ] **Backend CORS**: Origin whitelist matches production frontend domain only
- [ ] **Error Monitoring**: Sentry or equivalent configured, no PII in error payloads
- [ ] **Dependency Audit**: `npm audit --audit-level=high` passes in CI

---

## 10. Production Readiness Assessment

| Category | Status | Blocker? |
|----------|--------|---------|
| Critical vulnerabilities remediated | ❌ 3 critical open | YES |
| HTTPS in production | ❌ HTTP configured | YES |
| Debug code removed | ❌ `debug_token` present | YES |
| Strong password policy | ❌ Min 4 chars, DOB default | YES |
| Secure headers | ⚠️ Partial | Recommended |
| Input validation | ⚠️ Partial | Recommended |
| Dependency vulnerabilities | ❌ 2 HIGH (react-router CSRF, GHSA-qwww-vcr4-c8h2) | Yes (downgrade to 7.11.0) |
| SBOM and audit pipeline | ✅ Present | No |
| Backend security (NMV) | 🔍 Unverified | Requires testing |

**VERDICT: Do not deploy to production until the 4 blockers above are resolved.**

---

## 11. Final Conclusion

PragatiX is a well-structured, feature-complete academic management application. The development team has invested in CI/CD security tooling, code quality enforcement, and thoughtful UX patterns. However, the application carries several security design decisions that are inappropriate for production deployment of a system managing student PII and privileged academic operations.

The most urgent remediation is the migration of JWT tokens from `localStorage` to a secure storage mechanism, combined with fixing the CSP configuration and removing the predictable default password generation. These three changes alone would significantly raise the security posture from HIGH risk to MEDIUM.

The application's architecture is fundamentally sound: React's auto-escaping prevents most XSS, the route protection system is well-designed, and the CI/CD pipeline demonstrates security-conscious development practices. With the fixes outlined in this report, PragatiX can be brought to a production-ready security level within one to two development sprints.

---

*Report generated by white-box source code review of 105 files (91 source + 14 config/entry), with 75 files documented in File_By_File_Review.md.*  
*Assessment methodology: OWASP Top 10 (2021), OWASP API Security Top 10 (2023), OWASP ASVS 4.0 Level 2, CWE Top 25, MITRE ATT&CK.*
