# IDOR (Insecure Direct Object Reference) Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| NMV-002 | IDOR on student/activity numeric ID endpoints | NMV |

---

## IDOR Surface Analysis

The application makes extensive use of numeric IDs in API paths. The following endpoints are at risk:

| Endpoint | Called From | Risk |
|----------|------------|------|
| `GET /api/v1/students/{id}` | StudentDetailsPage, studentService | Any auth'd user with the numeric ID |
| `POST /api/v1/students/{id}/adjust-points` | StudentDetailsPage | Should require TEACHER/ADMIN with dept authority |
| `POST /api/v1/students/{id}/make-captain` | StudentDetailsPage | Should require ADMIN |
| `POST /api/v1/students/{id}/remove-captain` | StudentDetailsPage | Should require ADMIN |
| `GET /api/v1/students/{id}/discipline-logs` | StudentDetailsPage | Should require TEACHER/ADMIN |
| `GET /api/v1/activity-completion-requests/student/{studentId}` | activityService | Should be own data only |
| `GET /api/v1/xp/{studentId}/summary` | xpStore | Should be own data only |
| `GET /api/v1/xp/{studentId}/history` | xpStore | Should be own data only |
| `GET /api/v1/notifications/user/{userId}` | notificationService | Should be own data only |
| `DELETE /api/v1/admin/users/{id}` | TeachersTab | Admin only |
| `DELETE /api/v1/students/{id}` | StudentsTab | Admin only |

---

## Frontend IDOR Controls

The `ProtectedRoute` component enforces **route-level** access control. However, once a user is on an authorized route, there are no additional frontend checks verifying that the object being accessed "belongs" to the requesting user.

### Example IDOR Scenario

1. Student A is logged in as STUDENT role.
2. Student A finds Student B's numeric ID from a leaderboard API response.
3. Student A directly calls `GET /api/v1/xp/{studentB.id}/summary` — bypassing the frontend entirely.
4. If the backend does not verify that Student A is requesting their own XP data, Student B's XP history is returned.

### XpStore Usage

```typescript
// xpStore.ts — fetchSummary
fetchSummary: async (studentId) => {
  const response = await apiClient.get(`/api/v1/xp/${studentId}/summary`);
  // studentId comes from the logged-in user's profile
  // but the API endpoint itself must verify on backend
}
```

The `studentId` used is the logged-in user's own ID (from `/api/v1/auth/me`), so normal usage is non-exploitable via the frontend. The IDOR risk exists only in direct API calls.

---

## Backend Verification Required (NMV-002)

The following must be verified at the backend:

1. `GET /api/v1/students/{id}` — Does the backend check that the requester has authority over this student?
2. `GET /api/v1/xp/{studentId}/summary` — Does the backend check `studentId == authenticatedUser.id` for STUDENT role?
3. `POST /api/v1/students/{id}/adjust-points` — Does the backend check the requester is ADMIN/TEACHER with dept scope?
4. `GET /api/v1/activity-completion-requests/student/{studentId}` — Is scope enforced?

---

## Recommendations

1. Backend must enforce object-level authorization on all ID-parameterized endpoints.
2. For student-facing endpoints (XP, history, notifications), backend should auto-scope to `authenticatedUser.studentId` without requiring a parameter.
3. Add integration tests specifically for IDOR scenarios (unauthorized cross-student data access).
