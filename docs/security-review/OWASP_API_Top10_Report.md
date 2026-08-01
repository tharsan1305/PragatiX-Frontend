# OWASP API Security Top 10 (2023) Report

| # | Threat | Status | Findings |
|---|--------|--------|---------|
| API1 | Broken Object Level Authorization | NMV | NMV-002 |
| API2 | Broken Authentication | ❌ | CRIT-001, HIGH-007 |
| API3 | Broken Object Property Level Auth | NMV | Business logic gaps |
| API4 | Unrestricted Resource Consumption | ⚠️ | MED-007, MED-010 |
| API5 | Broken Function Level Authorization | ⚠️ | HIGH-001, role checks |
| API6 | Unrestricted Access to Sensitive Business Flows | ❌ | HIGH-011, CRIT-003 |
| API7 | Server-Side Request Forgery | N/A | Frontend SPA |
| API8 | Security Misconfiguration | ❌ | HIGH-003, CRIT-002, NMV-005 |
| API9 | Improper Inventory Management | ⚠️ | Fallback URL endpoints |
| API10 | Unsafe Consumption of APIs | ⚠️ | MED-003, LOW-005 |

---

## API1: Broken Object Level Authorization (BOLA/IDOR)

**Status: NMV** — Cannot confirm or deny from frontend code alone. See IDOR_Report.md and NMV-002.

The frontend makes requests to ID-parameterized endpoints (`/api/v1/students/{id}`, `/api/v1/xp/{studentId}/summary`, etc.) where the authorization check depends entirely on the backend. Frontend provides no additional BOLA mitigations.

---

## API2: Broken Authentication

**Status: FAIL**

- JWT stored in JavaScript-accessible localStorage (CRIT-001) — XSS-stealable.
- No server-side token revocation on logout (HIGH-007).
- Parent login uses only DOB as second factor — knowledge-based, guessable.

---

## API3: Broken Object Property Level Authorization

**Status: NMV**

Some update operations send `payload` objects with full user data:

```typescript
// StudentsTab.tsx handleSave
const payload: any = {
  fullName, email, phone, sprNo, dateOfBirth,
  departmentId, yearId, semesterId, sectionId,
  teamId, active, guardian: {...}
};
await apiClient.put(`/api/v1/students/${editingStudent.id}`, payload);
```

A teacher could potentially include unauthorized fields (e.g., `disciplineScore`, `roles`) in the payload. The backend must use a whitelist of allowed updatable fields per role.

---

## API4: Unrestricted Resource Consumption

**Status: PARTIAL CONCERN**

- No Axios timeout (MED-007) — requests can hang indefinitely.
- No client-side rate limiting on login (MED-010).
- `size=100` default for student lists — acceptable for current scale.
- No pagination on leaderboard or notification endpoints.
- File upload without size limit (MED-002).

---

## API5: Broken Function Level Authorization

**Status: PARTIAL CONCERN**

Frontend uses `ProtectedRoute` for route-level access. However, the actual API functions (e.g., `DELETE /api/v1/admin/users/{id}`, `POST /api/v1/students/{id}/make-captain`) must be secured at the backend. Frontend-only role checks are not sufficient.

---

## API6: Unrestricted Access to Sensitive Business Flows

**Status: FAIL**

- XP claim returns success even on API failure (HIGH-011) — undermines business flow integrity.
- Default student password is predictable (CRIT-003) — simplifies credential stuffing.
- No CAPTCHA or rate limiting on login for credential stuffing prevention (MED-010).

---

## API8: Security Misconfiguration

**Status: FAIL**

- HTTP in production configuration (HIGH-003).
- CSP with `unsafe-inline` and `unsafe-eval` (CRIT-002).
- CORS configuration unverified (NMV-005).
- Vite proxy with `secure: false` (HIGH-009).

---

## API9: Improper Inventory Management

**Status: PARTIAL CONCERN**

`activityService.ts` (admin) tries multiple fallback endpoints:

```typescript
const endpoints: string[] = [];
endpoints.push(`/api/v1/admin/stages/${stageId}/activities?subgroup=...`);
endpoints.push(`/api/v1/admin/subgroups/${subgroupId}/activities`);
endpoints.push(`/api/v1/admin/activities?subgroup=...`);
endpoints.push('/api/v1/admin/activities');
// Tries each in order, catches errors silently
```

This pattern suggests undocumented or deprecated API endpoints are being probed. Improper API inventory leads to maintenance blindness — if a deprecated endpoint has security issues, it may not be caught in review.

---

## API10: Unsafe Consumption of APIs

**Status: PARTIAL CONCERN**

- `proofLink` and `evidenceUrl` from API rendered as clickable links without URL validation (MED-003).
- `badgeIcon` URL from API rendered in `<img src>` without validation (LOW-005).
- Activity names, student names, and descriptions rendered directly from API (safe due to React JSX, but CSP does not protect against XSS if it occurs).
