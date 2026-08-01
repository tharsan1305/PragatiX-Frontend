# Risk Matrix

## Scoring Methodology

- **Likelihood**: 1 (Very Low) to 5 (Very High) — probability of exploitation
- **Impact**: 1 (Minimal) to 5 (Catastrophic) — business/data impact if exploited
- **Risk Score**: Likelihood × Impact (1–25)

| Score | Risk Level |
|-------|-----------|
| 20–25 | 🔴 Critical |
| 15–19 | 🟠 High |
| 9–14  | 🟡 Medium |
| 4–8   | 🔵 Low |
| 1–3   | ℹ️ Informational |

---

## Risk Matrix

| Finding ID | Title | Likelihood | Impact | Risk Score | Level |
|------------|-------|-----------|--------|-----------|-------|
| CRIT-001 | JWT in localStorage | 4 | 5 | 20 | 🔴 Critical |
| CRIT-002 | CSP unsafe-inline/eval | 3 | 5 | 15 | 🟠 High (CVSS: Critical) |
| CRIT-003 | Default DOB/123456 password | 4 | 5 | 20 | 🔴 Critical |
| HIGH-001 | Client-side role inflation | 3 | 5 | 15 | 🟠 High |
| HIGH-002 | Debug token bypass | 3 | 4 | 12 | 🟡 Medium |
| HIGH-003 | HTTP in .env.production | 3 | 5 | 15 | 🟠 High |
| HIGH-004 | Incomplete sidebar logout | 3 | 4 | 12 | 🟡 Medium |
| HIGH-005 | Password min 4 chars | 3 | 4 | 12 | 🟡 Medium |
| HIGH-006 | AppLayout reads localStorage | 2 | 4 | 8 | 🔵 Low |
| HIGH-007 | No backend logout call | 3 | 4 | 12 | 🟡 Medium |
| HIGH-008 | PII in localStorage | 4 | 4 | 16 | 🟠 High |
| HIGH-009 | Vite proxy secure: false | 2 | 4 | 8 | 🔵 Low |
| HIGH-010 | Dual auth stores desync | 2 | 4 | 8 | 🔵 Low |
| HIGH-011 | XP claim returns true on fail | 3 | 3 | 9 | 🟡 Medium |
| MED-001 | No CSRF tokens | 2 | 3 | 6 | 🔵 Low |
| MED-002 | No file upload validation | 3 | 3 | 9 | 🟡 Medium |
| MED-003 | Unvalidated URL in href | 3 | 3 | 9 | 🟡 Medium |
| MED-004 | PII in console.error | 2 | 3 | 6 | 🔵 Low |
| MED-005 | No input length limits | 3 | 2 | 6 | 🔵 Low |
| MED-006 | Missing explicit `noopener` | 2 | 2 | 4 | 🔵 Low |
| MED-007 | No Axios timeout | 4 | 2 | 8 | 🔵 Low |
| MED-008 | Backend errors to users | 3 | 2 | 6 | 🔵 Low |
| MED-009 | window.confirm on delete | 2 | 3 | 6 | 🔵 Low |
| MED-010 | No login rate limiting | 3 | 3 | 9 | 🟡 Medium |
| MED-011 | README project disclosure | 1 | 2 | 2 | ℹ️ Info |
| MED-012 | Timeout value in console | 2 | 1 | 2 | ℹ️ Info |
| MED-013 | window.location.href usage | 2 | 2 | 4 | 🔵 Low |
| MED-014 | Dead authStore.ts | 1 | 2 | 2 | ℹ️ Info |
| MED-015 | CSV injection in export | 2 | 3 | 6 | 🔵 Low |
| LOW-001 | No TypeScript strict mode | 3 | 2 | 6 | 🔵 Low |
| LOW-003 | ErrorBoundary console.error | 2 | 2 | 4 | 🔵 Low |
| LOW-004 | Password input type="text" | 2 | 2 | 4 | 🔵 Low |
| LOW-005 | Unvalidated badge image URL | 2 | 2 | 4 | 🔵 Low |
| NMV-001 | Backend JWT validation | 3 | 5 | 15 | 🟠 High (NMV) |
| NMV-002 | IDOR on API endpoints | 3 | 5 | 15 | 🟠 High (NMV) |
| NMV-003 | Login rate limiting (backend) | 4 | 4 | 16 | 🟠 High (NMV) |
| NMV-004 | Stored XSS via API data | 2 | 5 | 10 | 🟡 Medium (NMV) |
| NMV-005 | CORS misconfiguration | 2 | 4 | 8 | 🔵 Low (NMV) |
| HIGH-012 | react-router CSRF bypass (GHSA-qwww-vcr4-c8h2) | 3 | 4 | 12 | 🟠 High (SCA) |

---

## Top Risk Summary

```
CRITICAL RISK (Score 20-25)
├── CRIT-001: JWT in localStorage          [20] ← Fix NOW
└── CRIT-003: Predictable default password [20] ← Fix NOW

HIGH RISK (Score 15-19)
├── HIGH-001: Client-side role inflation   [15]
├── HIGH-003: HTTP in production           [15]
├── HIGH-008: PII in localStorage          [16]
├── NMV-001:  Backend JWT validation       [15]
├── NMV-002:  IDOR on endpoints           [15]
└── NMV-003:  Login rate limiting         [16]

MEDIUM RISK (Score 9-14)
├── HIGH-002: Debug token bypass           [12]
├── HIGH-004: Incomplete logout            [12]
├── HIGH-005: Weak password policy         [12]
├── HIGH-007: No backend logout call       [12]
├── HIGH-011: XP claim false success        [9]
├── MED-002:  No file validation           [9]
├── MED-003:  Unvalidated URL in href      [9]
├── MED-010:  No login rate limiting       [9]
└── HIGH-012: react-router CSRF bypass     [12]
```

---

## Remediation Timeline Recommendation

| Timeline | Findings |
|----------|---------|
| **Immediate (Day 0)** | CRIT-001, CRIT-002, CRIT-003, HIGH-002, HIGH-003, HIGH-004, HIGH-012 |
| **Sprint 1 (Week 1)** | HIGH-001, HIGH-005, HIGH-007, HIGH-008, HIGH-011, MED-003, MED-015 |
| **Sprint 2 (Week 2)** | MED-002, MED-007, MED-010, LOW-001, LOW-004, HIGH-009 |
| **Sprint 3 (Month 1)** | NMV-001 through NMV-005 verification, architecture changes (cookie auth, structured logging) |
| **Backlog** | Remaining Low and Informational findings |
