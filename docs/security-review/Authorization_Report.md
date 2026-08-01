# Authorization & Access Control Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| HIGH-001 | Client-side role determination | High |
| HIGH-006 | AppLayout reads role from localStorage | High |
| MED-014 | Dual auth stores — desynchronized RBAC state | Medium |
| NMV-002 | IDOR on student/activity endpoints | NMV |

---

## Route Protection Analysis

### ProtectedRoute Component

**File:** `src/components/ProtectedRoute.tsx`

The `ProtectedRoute` component checks `token`, `user`, and `allowedRoles` from `authContext`. The role check logic is:

```typescript
const hasAccess = allowedRoles.some((allowed) => {
  const allowedUpper = allowed.toUpperCase();
  if (currentRole === allowedUpper || userRoles.includes(allowedUpper) || userRoles.includes(`ROLE_${allowedUpper}`)) {
    return true;
  }
  if (allowedUpper === 'CAPTAIN' && isCaptain) return true;
  if (allowedUpper === 'ADMIN' && isAdmin) return true;
  if (allowedUpper === 'TEACHER' && isTeacher) return true;
  return false;
});
```

**Assessment:** The `ProtectedRoute` logic is correctly structured — it checks both the raw role and the `ROLE_` prefixed variant. The `isCaptain`, `isAdmin`, `isTeacher` booleans are computed from `authContext` state, not directly from localStorage, so they are at least as trustworthy as the stored token.

**Key Concern:** Since the token and user object are read from localStorage on initialization, a compromised localStorage (via XSS or direct manipulation) can produce an arbitrary role. The `ProtectedRoute` provides **UI-level protection only** — actual security depends on the backend enforcing role claims in the JWT.

---

## Role-to-Route Mapping

| Route | Allowed Roles | Protection Component |
|-------|--------------|---------------------|
| `/login` | All (public) | None |
| `/students` | ADMIN, TEACHER | ProtectedRoute |
| `/students/:id` | ADMIN, TEACHER | ProtectedRoute |
| `/admin/*` | ADMIN | ProtectedRoute |
| `/teacher/*` | TEACHER | ProtectedRoute |
| `/teacher/students-directory` | TEACHER, ADMIN | ProtectedRoute |
| `/teacher/group-activity/:id/year` | TEACHER, ADMIN | ProtectedRoute |
| `/teacher/group-activity/:id/dept` | TEACHER, ADMIN | ProtectedRoute |
| `/teacher/group-activity/:id/sec` | TEACHER, ADMIN | ProtectedRoute |
| `/teacher/group-activity/:id/execution` | TEACHER, ADMIN | ProtectedRoute |
| `/teacher/group-activity/:id/create-group` | TEACHER, ADMIN | ProtectedRoute |
| `/teacher/activity/:id/execution` | TEACHER, ADMIN | ProtectedRoute |
| `/student/*` | STUDENT, CAPTAIN | ProtectedRoute |
| `/captain/*` | CAPTAIN | ProtectedRoute |
| `*` (catch-all) | None | Redirects to /login |

**Assessment:** Route protection coverage is good. All sensitive routes are protected. The catch-all redirect to `/login` prevents unauthorized access to undefined routes.

---

## Sub-Role Authorization (CC, HOD, DC)

**File:** `src/features/teacher/TeacherDashboard.tsx`

The teacher dashboard dynamically renders tabs based on `subRoles` from `authContext`:

```typescript
const isCC = subRoles.some(r => r.toUpperCase() === 'CC');
const isHOD = subRoles.includes('HOD');
```

Sub-roles are fetched from `/api/v1/auth/me` on teacher dashboard load and stored in `authContext` state (and also in localStorage via `spdms_user`). The sub-role check is client-side UI gating only — actual API authorization must be enforced by the backend.

**Concern:** `subRoles` are stored in the user object in localStorage. A user could modify `localStorage.spdms_user` to add `"subRoles": ["HOD"]` and gain access to the HOD Report tab UI. Backend must validate the sub-role claim on every API call.

---

## Admin Panel Authorization

The admin panel uses a stack-based navigation system rather than URL routes for internal sub-pages (e.g., `push_view('students')`, `push_view('create_stage')`). This means:
- Sub-views within the admin panel are NOT protected by `ProtectedRoute`.
- They rely entirely on the parent `AdminDashboard` being behind the ADMIN `ProtectedRoute`.
- If the parent route protection holds, this is acceptable.

---

## OWASP ASVS V4 Authorization Compliance

| ASVS Requirement | Status |
|------------------|--------|
| V4.1.1 — Access control decisions at trusted layer | ⚠️ Client-side checks only — backend must enforce |
| V4.1.2 — Default deny for unauthenticated users | ✅ (catch-all → /login) |
| V4.1.3 — Least privilege principle | ⚠️ Teachers have wide API access — department scoping NMV |
| V4.2.1 — IDOR protection | NMV |
| V4.3.1 — Admin UI protected | ✅ |
