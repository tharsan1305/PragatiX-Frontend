# OWASP Top 10 (2021) Report

| # | Category | Status | Findings |
|---|----------|--------|---------|
| A01 | Broken Access Control | ⚠️ Partial | HIGH-001, HIGH-006, NMV-002 |
| A02 | Cryptographic Failures | ❌ Fail | CRIT-001, HIGH-003, HIGH-008, HIGH-009 |
| A03 | Injection (XSS/etc.) | ⚠️ Partial | CRIT-002, MED-003, MED-015 |
| A04 | Insecure Design | ⚠️ Partial | CRIT-003, HIGH-011, MED-002 |
| A05 | Security Misconfiguration | ❌ Fail | CRIT-002, HIGH-003, HIGH-009, MED-007 |
| A06 | Vulnerable Components | ❌ Fail | HIGH-012 (`react-router-dom` CSRF bypass, GHSA-qwww-vcr4-c8h2) |
| A07 | Auth Failures | ❌ Fail | CRIT-001, CRIT-003, HIGH-002, HIGH-004, HIGH-005, HIGH-007 |
| A08 | Software & Data Integrity | ⚠️ Partial | HIGH-011 |
| A09 | Security Logging & Monitoring | ⚠️ Partial | MED-004, MED-008 |
| A10 | SSRF | ✅ N/A | Frontend SPA — no server-side requests |

---

## A01: Broken Access Control

**Findings:** HIGH-001 (client-side role inflation), HIGH-006 (AppLayout reads localStorage role), NMV-002 (IDOR)

The primary access control concern is that role determination partially relies on client-side logic in `LoginPage.tsx`. The `ProtectedRoute` system is structurally sound but can be undermined if the underlying state (from localStorage) is manipulated.

**Status: PARTIAL PASS** — Route-level protection exists; object-level authorization requires backend verification.

---

## A02: Cryptographic Failures

**Findings:** CRIT-001 (JWT in localStorage), HIGH-003 (.env.production HTTP), HIGH-008 (PII in localStorage), HIGH-009 (TLS disabled in dev)

The most significant cryptographic failure is storing sensitive tokens and PII in localStorage without encryption. HTTP usage in the production configuration would transmit all data in cleartext.

**Status: FAIL** — Critical remediation required before production deployment.

---

## A03: Injection

**XSS:** React's auto-escaping prevents virtually all XSS via JSX. No `dangerouslySetInnerHTML` usage. The CSP (CRIT-002) negates its own protection via `unsafe-inline`.

**HTML Injection:** Not possible via standard JSX rendering.

**CSV Injection:** MED-015 — student names in CSV export not escaped.

**SQL/NoSQL Injection:** Frontend sends data to REST API; SQL injection is a backend concern. No evidence of frontend-constructed queries.

**Status: PARTIAL PASS** — XSS resistance is good; CSP is ineffective; CSV injection present.

---

## A04: Insecure Design

**Findings:** CRIT-003 (DOB default password), HIGH-011 (XP claim false success), MED-002 (no file validation)

The default password generation from date of birth is a fundamental design flaw that should be redesigned. The XP claim silent failure is an insecure design in error handling.

**Status: PARTIAL PASS** — Some flows have insecure design patterns.

---

## A05: Security Misconfiguration

**Findings:** CRIT-002 (CSP), HIGH-003 (.env.production), HIGH-009 (Vite proxy), MED-007 (no timeout), source maps not disabled

Multiple configuration issues: CSP with unsafe directives, HTTP in production config, TLS disabled in proxy.

**Status: FAIL**

---

## A06: Vulnerable and Outdated Components

`react-router-dom@7.18.2` is pinned within the vulnerable range of **GHSA-qwww-vcr4-c8h2** (react-router CSRF bypass, CWE-352, HIGH) — HIGH-012. `npm audit --omit=dev` reports **2 HIGH** production vulnerabilities (react-router + react-router-dom). Fix: downgrade to `7.11.0`. All other direct dependencies are recent with no known CVEs. CI pipeline includes npm audit and Grype scanning.

**Status: FAIL** — blocking for production deployment.

---

## A07: Identification and Authentication Failures

**Findings:** CRIT-001, CRIT-003, HIGH-002, HIGH-004, HIGH-005, HIGH-007

Multiple authentication failures: insecure token storage, predictable default passwords, debug bypass, incomplete logout, weak password policy, no server-side revocation.

**Status: FAIL** — Most critical category.

---

## A08: Software and Data Integrity Failures

The XP claim `submitXpClaim` returning `true` on failure (HIGH-011) is a data integrity issue — the application proceeds as if data was saved when it was not.

**Status: PARTIAL PASS**

---

## A09: Security Logging and Monitoring Failures

The application logs sensitive information to the browser console in production (MED-004). Backend error messages are surfaced to users without sanitization (MED-008). No structured logging or error monitoring (e.g., Sentry) is implemented.

**Status: PARTIAL PASS**

---

## A10: Server-Side Request Forgery

Not applicable to a pure frontend SPA. All requests originate from the user's browser. No server-side request proxying occurs in the frontend code.

**Status: N/A**
