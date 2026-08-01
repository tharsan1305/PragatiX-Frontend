# Informational Findings

> **7 Informational findings.** These are observations that do not represent immediate vulnerabilities but are worth noting for security posture improvement.

---

## INFO-001 — React StrictMode Enabled (Good Practice)

**File:** `src/main.tsx`

The application wraps the root component in `<React.StrictMode>`. This is a positive security and quality practice: StrictMode intentionally double-invokes lifecycle methods and render functions in development to surface side effects, helping identify unsafe patterns early.

**Status: Positive Finding — No action required.**

---

## INFO-002 — Inactivity Session Timeout Implemented (30 Minutes)

**File:** `src/store/authContext.tsx` — Lines 149–172

A 30-minute inactivity timer is implemented using `mousemove`, `keypress`, `click`, `scroll`, and `touchstart` events. The timer resets on any user activity and calls `logout()` on expiry. This is a good security control aligned with OWASP ASVS V3.3.

**Observation:** The timer relies on browser events. If a user has the tab open but unfocused (e.g., reading a static page), the timer will still count down even though the user is effectively inactive. Consider using the Page Visibility API to pause the timer when the tab is hidden.

---

## INFO-003 — Multi-Tab Logout Synchronization Implemented

**File:** `src/store/authContext.tsx` — Lines 132–146

The `storage` event listener ensures that if `spdms_token` is removed in one tab (e.g., via logout), all other tabs on the same origin will also clear their auth state and redirect to `/login`. This is a good practice that prevents session leakage across tabs.

**Status: Positive Finding — No action required.**

---

## INFO-004 — Zod Schema Validation on Login Form

**File:** `src/features/auth/LoginPage.tsx`

The login form uses Zod (`loginSchema`) and React Hook Form for input validation. This is the only form in the application with proper schema-based validation. All other forms use manual `trim()` checks or none at all.

**Recommendation:** Extend Zod validation to all administrative forms (create student, create teacher, create activity, change password).

---

## INFO-005 — `ErrorBoundary` Component Present

**File:** `src/components/ErrorBoundary.tsx`

A React error boundary is implemented and wraps the entire application in `main.tsx`. This prevents unhandled rendering errors from exposing raw stack traces to the user (the generic error UI is shown instead). This is a good security practice.

**Minor Finding:** The `console.error` in `componentDidCatch` should be conditional on `DEV` mode (see LOW-003).

---

## INFO-006 — CI/CD Pipeline Includes Security Tooling

**File:** `docs/DEVELOPER-SETUP.md`, `.github/workflows/PragatiX-Frontend.yml`

The CI pipeline includes: TypeScript strict checking, Oxlint, Vitest, Semgrep SAST, CodeQL, Gitleaks credential scanning, Vite env leak checker, npm audit, Trivy/Grype/Syft for SBOM. This is a mature and comprehensive security pipeline.

**Observation:** Ensure the Semgrep and CodeQL findings are reviewed regularly and not just set to pass-always. The Gitleaks scan should cover full commit history.

---

## INFO-007 — `useApi` Generic Hook Has Good Error Handling Pattern

**File:** `src/hooks/useApi.ts`

The `useApi` generic hook correctly extracts error messages from `err.response?.data?.message` with a fallback to `err.message`, preventing raw Axios error objects from propagating to components. This is a clean and consistent error handling pattern.

**Suggestion:** Extend this hook's error handling to detect 401 responses and trigger automatic logout, centralizing the session expiry logic rather than having it duplicated in the Axios interceptor.
