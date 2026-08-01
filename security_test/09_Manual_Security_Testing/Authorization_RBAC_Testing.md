# Authorization & RBAC Testing Checklist

| Test ID | Test Scenario | Role Under Test | Expected Result | Status |
|---|---|---|---|---|
| RBAC-01 | Student accesses Admin Tab | STUDENT | Access Denied / ProtectedRoute redirect | PASS |
| RBAC-02 | Teacher accesses Captain Config | TEACHER | Restricted UI / Action Disabled | PASS |
| RBAC-03 | Admin accesses full dashboard | ADMIN | Full navigation allowed | PASS |
