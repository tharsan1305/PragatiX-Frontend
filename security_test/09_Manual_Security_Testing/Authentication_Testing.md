# Authentication Testing Checklist

| Test ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| AUTH-01 | Unauthenticated access to `/student` | Redirected to `/login` | PASS |
| AUTH-02 | Unauthenticated access to `/admin` | Redirected to `/login` | PASS |
| AUTH-03 | Login with invalid credentials | Display error toast, no token saved | PASS |
| AUTH-04 | Session logout execution | LocalStorage token purged, redirected to `/login` | PASS |
