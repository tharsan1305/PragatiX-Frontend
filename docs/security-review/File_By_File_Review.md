# File-by-File Security Review

> Every eligible file has been reviewed. Files with no findings are explicitly noted.

---

## Configuration Files

### `package.json`
- **Purpose:** Project metadata, scripts, dependencies.
- **Attack Surface:** Dependency vulnerabilities, script injection.
- **Rating:** ⚠️ Issues found.
- **Findings:** `react-router-dom@7.18.2` is in the vulnerable range of GHSA-qwww-vcr4-c8h2 (react-router CSRF bypass, HIGH-012, CWE-352). npm audit reports 2 HIGH severity production vulns. Fix: downgrade to `7.11.0`.

### `vite.config.ts`
- **Purpose:** Build tool configuration.
- **Attack Surface:** Build process, dev server proxy, source maps.
- **Rating:** ⚠️ Issues found.
- **Findings:** HIGH-009 (`secure: false`), implicit source map generation in production, `as any` cast.

### `tsconfig.json`
- **Purpose:** TypeScript project references.
- **Rating:** ✅ No security issues.
- **Findings:** None — references only.

### `tsconfig.app.json`
- **Purpose:** TypeScript compiler options for source code.
- **Rating:** ⚠️ Issues found.
- **Findings:** LOW-001 (no `strict: true`), LOW-009 (`skipLibCheck: true`).

### `tsconfig.node.json`
- **Purpose:** TypeScript compiler options for Vite config.
- **Rating:** ✅ No security issues.
- **Findings:** None — mirrors app config for Node context.

### `tailwind.config.js`
- **Purpose:** TailwindCSS configuration.
- **Rating:** ✅ No security issues.
- **Findings:** None. Standard configuration.

### `postcss.config.js`
- **Purpose:** PostCSS plugins.
- **Rating:** ✅ No security issues.
- **Findings:** None. Standard Tailwind/Autoprefixer setup.

### `.env`
- **Purpose:** Local development API URL.
- **Rating:** ✅ No security issues (not tracked in Git).
- **Findings:** None — only `http://localhost:8080`.

### `.env.development`
- **Purpose:** Development environment configuration.
- **Rating:** ✅ No security issues (not tracked in Git).
- **Findings:** None.

### `.env.example`
- **Purpose:** Template for developer setup.
- **Rating:** ✅ No security issues (intentionally tracked).
- **Findings:** None — contains only example values.

### `.env.production`
- **Purpose:** Production environment configuration.
- **Rating:** ❌ Security issue.
- **Findings:** HIGH-003 (HTTP URL, tracked in Git).

### `.gitignore`
- **Purpose:** Git ignore patterns.
- **Rating:** ⚠️ Issues found.
- **Findings:** `.env.production` is not excluded (HIGH-003).

### `.oxlintrc.json`
- **Purpose:** Linting rules.
- **Rating:** ✅ No security issues.
- **Findings:** None. Includes `react/rules-of-hooks` enforcement — good.

---

## Entry Points

### `index.html`
- **Purpose:** SPA shell, CSP, security headers, loader UI.
- **Attack Surface:** CSP configuration, inline scripts, security headers.
- **Rating:** ❌ Critical issues.
- **Findings:** CRIT-002 (CSP unsafe-inline/eval), Security_Headers_Report (X-Frame-Options missing), inline script forces unsafe-inline.

### `src/main.tsx`
- **Purpose:** React application root.
- **Rating:** ✅ Secure.
- **Findings:** None. `React.StrictMode` enabled, `ErrorBoundary` wrapping, `AuthProvider` at root. No security issues.

### `src/App.tsx`
- **Purpose:** Router configuration and route definitions.
- **Rating:** ✅ Good.
- **Findings:** None critical. All routes correctly protected. Catch-all redirects to `/login`.

---

## Configuration

### `src/config/apiConfig.ts`
- **Purpose:** API base URL configuration.
- **Rating:** ✅ No security issues.
- **Findings:** None — simple config that reads from env var.

---

## Store / State Management

### `src/store/authContext.tsx`
- **Purpose:** Primary authentication state (React Context).
- **Rating:** ❌ Critical issues.
- **Findings:** CRIT-001 (JWT in localStorage), HIGH-007 (no backend logout), HIGH-008 (PII in localStorage), HIGH-010 (dual store), MED-012 (timeout value in console), INFO-002, INFO-003.

### `src/store/authStore.ts`
- **Purpose:** Legacy Zustand authentication store.
- **Rating:** ⚠️ Issues found.
- **Findings:** CRIT-001 (JWT in localStorage), HIGH-010 (dual store — incomplete logout), MED-014 (dead code), LOW-003 (console.error on parse fail).

### `src/store/studentStore.ts`
- **Purpose:** Student list and CRUD state management.
- **Rating:** ✅ No security issues.
- **Findings:** None. Standard Zustand store with proper error handling.

### `src/store/xpStore.ts`
- **Purpose:** XP data store with mock fallback data.
- **Rating:** ⚠️ Issues found.
- **Findings:** HIGH-011 (XP claim returns true on failure), MED-004 (studentId logged in error).

---

## API Layer

### `src/api/client.ts`
- **Purpose:** Axios instance, interceptors, auth header injection.
- **Rating:** ❌ Issues found.
- **Findings:** CRIT-001 (reads JWT from localStorage), MED-007 (no timeout), MED-013 (window.location.href), HIGH-003 (HTTP fallback default).

### `src/services/apiClient.ts`
- **Purpose:** Re-export of API client.
- **Rating:** ✅ No security issues.
- **Findings:** None — trivial re-export.

### `src/services/authService.ts`
- **Purpose:** Authentication API calls.
- **Rating:** ✅ No security issues.
- **Findings:** None. Clean service with proper endpoint separation.

### `src/services/adminService.ts`
- **Purpose:** Admin CRUD operations.
- **Rating:** ⚠️ Issues.
- **Findings:** `data: any` typing on all CRUD operations — no client-side validation.

### `src/services/studentService.ts`
- **Purpose:** Student CRUD and bulk operations.
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-002 (file upload without type/size validation in `bulkParse`).

### `src/services/activityService.ts`
- **Purpose:** Activity completion request operations.
- **Rating:** ✅ No security issues.
- **Findings:** None. Clean service layer.

### `src/services/attendanceService.ts`
- **Purpose:** Attendance marking and retrieval.
- **Rating:** ✅ No security issues.
- **Findings:** None. Status enum limits valid values.

### `src/services/badgeService.ts`
- **Purpose:** Badge operations.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/services/captainService.ts`
- **Purpose:** Captain team operations.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/services/leaderboardService.ts`
- **Purpose:** Leaderboard data.
- **Rating:** ✅ No security issues.
- **Findings:** None. Period parameter is typed as literal union.

### `src/services/notificationService.ts`
- **Purpose:** User and student notifications.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/services/penaltyService.ts`
- **Purpose:** Penalty issuance and management.
- **Rating:** ⚠️ Minor concern.
- **Findings:** `VIOLATION_PENALTIES` is a reference table but is not enforced in the `issuePenalty` call — any `points` value can be submitted.

### `src/services/teamService.ts`
- **Purpose:** Team/group CRUD.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/services/xpService.ts`
- **Purpose:** XP data and level calculations.
- **Rating:** ✅ No security issues.
- **Findings:** None. `getLevelFromXp` is a pure function with no security implications.

### `src/services/index.ts`
- **Purpose:** Re-export barrel.
- **Rating:** ✅ No security issues.
- **Findings:** None.

---

## Custom Hooks

### `src/hooks/useApi.ts`
- **Purpose:** Generic data fetching hook.
- **Rating:** ✅ Good.
- **Findings:** None. INFO-007 (positive finding).

---

## Core Utilities

### `src/core/utils/dateFormat.ts`
- **Purpose:** Date formatting helpers.
- **Rating:** ✅ No security issues.
- **Findings:** None. Uses `try/catch`, returns safe defaults.

### `src/core/utils/extractData.ts`
- **Purpose:** API response unwrapping.
- **Rating:** ✅ No security issues.
- **Findings:** None.

---

## Components

### `src/components/ProtectedRoute.tsx`
- **Purpose:** Route-level access control.
- **Rating:** ✅ Good.
- **Findings:** None critical. `replace` prop used correctly. Role matching logic is correct.

### `src/components/ErrorBoundary.tsx`
- **Purpose:** Application error boundary.
- **Rating:** ⚠️ Minor issue.
- **Findings:** LOW-003 (console.error in production).

### `src/components/common/ConfirmationModal.tsx`
- **Purpose:** Reusable confirmation dialog.
- **Rating:** ✅ No security issues.
- **Findings:** None. Well-designed modal with accessibility attributes.

### `src/components/common/Footer.tsx`
- **Purpose:** Application footer.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/components/common/LogoutModal.tsx`
- **Purpose:** Logout confirmation modal.
- **Rating:** ✅ No security issues.
- **Findings:** None. `aria-modal`, `aria-labelledby`, keyboard ESC support — good.

### `src/components/common/PageLoader.tsx`
- **Purpose:** Loading overlay.
- **Rating:** ✅ No security issues.
- **Findings:** None. Static message rendering.

### `src/components/common/ScoreBadge.tsx`
- **Purpose:** Score display badge.
- **Rating:** ✅ No security issues.
- **Findings:** None. Renders numeric score.

### `src/components/common/TeamScoreCard.tsx`
- **Purpose:** Team score display.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/components/common/XpProgressBar.tsx`
- **Purpose:** XP progress visualization.
- **Rating:** ✅ No security issues.
- **Findings:** None. `Math.min/max` clamps prevent style injection via width.

### `src/components/layout/AppLayout.tsx`
- **Purpose:** Shared layout shell.
- **Rating:** ⚠️ Issues found.
- **Findings:** HIGH-006 (reads role from localStorage directly). Appears unused.

### `src/components/layout/Sidebar.tsx`
- **Purpose:** Navigation sidebar.
- **Rating:** ⚠️ Issues found.
- **Findings:** HIGH-004 (incomplete logout). Appears unused in current implementation.

---

## Auth Features

### `src/features/auth/LoginPage.tsx`
- **Purpose:** Main login form.
- **Rating:** ⚠️ Issues found.
- **Findings:** HIGH-001 (client-side role inflation), MED-010 (no rate limiting UI).

### `src/features/auth/pages/CaptainLoginPage.tsx`
- **Purpose:** Captain-specific login page.
- **Rating:** ❌ Issues found.
- **Findings:** CRIT-001 (JWT in localStorage), bypass of `authContext.login()` — writes tokens directly.

### `src/features/auth/services/auth.service.ts`
- **Purpose:** Auth API calls wrapper.
- **Rating:** ✅ No security issues.
- **Findings:** None. Clean service with proper error propagation.

---

## Admin Features

### `src/features/admin/AdminDashboard.tsx`
- **Purpose:** Admin portal main layout.
- **Rating:** ✅ No security issues.
- **Findings:** None. Stack-based navigation is safe.

### `src/features/admin/tabs/ActivityTab.tsx`
- **Purpose:** Stage management UI.
- **Rating:** ✅ No security issues.
- **Findings:** None. Uses `ConfirmationModal` for delete — good practice.

### `src/features/admin/tabs/AdminAttendanceTab.tsx`
- **Purpose:** Attendance summary view.
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-015 (CSV injection in export, lines 267–284).

### `src/features/admin/tabs/AdminBadgeRequestsTab.tsx`
- **Purpose:** Badge request approval.
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-003 (unvalidated `proofLink` URL, lines 206–213), LOW-005 (unvalidated `badgeIcon` URL, lines 171–175). Note: `rel="noopener noreferrer"` is correctly present on the proof link.

### `src/features/admin/tabs/AdminProfileTab.tsx`
- **Purpose:** Admin profile and password change.
- **Rating:** ⚠️ Issues found.
- **Findings:** HIGH-005 (min password 4 chars), hardcoded fallback email `admin@spdms.com`.

### `src/features/admin/tabs/DepartmentsTab.tsx`
- **Purpose:** Department CRUD.
- **Rating:** ✅ No security issues.
- **Findings:** None beyond general `any` typing concerns.

### `src/features/admin/tabs/OverviewTab.tsx`
- **Purpose:** Admin dashboard stats.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/features/admin/tabs/StudentsTab.tsx`
- **Purpose:** Student management CRUD.
- **Rating:** ❌ Critical issues.
- **Findings:** CRIT-003 (DOB-based/123456 default password, lines 311–319).

### `src/features/admin/tabs/TeachersTab.tsx`
- **Purpose:** Teacher/staff management.
- **Rating:** ⚠️ Issues found.
- **Findings:** LOW-004 (password input `type="text"` not `type="password"`).

### `src/features/admin/activity/api/activityService.ts`
- **Purpose:** Activity API calls (admin).
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-004 (console.log of endpoint paths and IDs in production code). Fallback URL pattern (API9 concern).

### `src/features/admin/activity/components/ActivityCard.tsx`
- **Purpose:** Activity display card.
- **Rating:** ✅ No security issues.
- **Findings:** None. All data rendered via JSX.

### `src/features/admin/activity/components/ActivityForm.tsx`
- **Purpose:** Activity create/edit form.
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-005 (no `maxLength` on free-text fields).

### `src/features/admin/activity/types/ActivityTypes.ts`
- **Purpose:** TypeScript type definitions.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/features/admin/activity/pages/ActivityExecutionPageV2.tsx`
- **Purpose:** Activity execution and XP award.
- **Rating:** ⚠️ Issues found.
- **Findings:** Misleading label (`fontinally:` instead of `finally` — compiles as label, runs cleanup unconditionally; fragile), no max XP validation on award input.

### `src/features/admin/activity/pages/ActivityListPage.tsx`
- **Purpose:** Activity list page.
- **Rating:** ✅ No specific security issues.
- **Findings:** None beyond general patterns (`any` typing, unvalidated IDs passed to `Number()`).

### `src/features/admin/pages/CreateStagePage.tsx`
- **Purpose:** Stage creation form.
- **Rating:** ⚠️ Minor.
- **Findings:** MED-005 (no maxLength on name/description fields).

### `src/features/admin/activity/pages/AdminActivityDetailPage.tsx`
- **Purpose:** Activity detail view.
- **Rating:** ✅ No security issues.

### `src/features/admin/activity/pages/AssignFacultyPage.tsx`
- **Purpose:** Assign faculty to activities.
- **Rating:** ✅ No security issues.

### `src/features/admin/activity/pages/CreateActivityPage.tsx`
- **Purpose:** Activity creation wrapper.
- **Rating:** ✅ No security issues.

### `src/features/admin/activity/pages/CreateGroupPage.tsx`
- **Purpose:** Group activity creation.
- **Rating:** ✅ No security issues.

### `src/features/admin/activity/pages/EditActivityPage.tsx`
- **Purpose:** Activity edit wrapper.
- **Rating:** ✅ No security issues.

### `src/features/admin/activity/pages/GroupActivityDeptPage.tsx` / `GroupActivitySecPage.tsx` / `GroupActivityYearPage.tsx`
- **Purpose:** Group activity drill-down navigation.
- **Rating:** ✅ No security issues.

### `src/features/admin/activity/pages/GroupActivityExecutionPage.tsx`
- **Purpose:** Group activity evaluation and XP award.
- **Rating:** ⚠️ Minor.
- **Findings:** `activityId`/`assignmentId` from `useParams()` passed to API without numeric validation (see React_Security_Report note).

### `src/features/admin/pages/EditStagePage.tsx` / `StageDetailsPage.tsx`
- **Purpose:** Stage edit and detail views.
- **Rating:** ⚠️ Minor.
- **Findings:** IDs from `useParams()` passed to API without validation.

---

## Teacher Features

### `src/features/teacher/TeacherDashboard.tsx`
- **Purpose:** Teacher portal layout.
- **Rating:** ✅ No security issues.
- **Findings:** None. Sub-role check is UI-only (backend must enforce).

### `src/features/teacher/tabs/ActivityTab.tsx`
- **Purpose:** Department activities view (read-only).
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/features/teacher/tabs/AttendanceTab.tsx`
- **Purpose:** Attendance marking.
- **Rating:** ✅ No security issues.
- **Findings:** None beyond general patterns.

### `src/features/teacher/tabs/ProfileTab.tsx`
- **Purpose:** Teacher profile and logout.
- **Rating:** ✅ No security issues.
- **Findings:** None. Uses `authContext.logout()` correctly.

### `src/features/teacher/tabs/RemovalRequestsTab.tsx`
- **Purpose:** Badge claim and group removal approvals.
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-003 (unvalidated `evidenceUrl`, line 159), MED-006 (`rel="noreferrer"` without explicit `noopener`, line 159).

### `src/features/teacher/tabs/CCInboxTab.tsx`
- **Purpose:** Class coordinator penalty inbox.
- **Rating:** ✅ No security issues.

### `src/features/teacher/tabs/HodPerformanceTab.tsx`
- **Purpose:** HOD department performance.
- **Rating:** ✅ No security issues.

### `src/features/teacher/tabs/LeaderboardTab.tsx`
- **Purpose:** Teacher leaderboard view.
- **Rating:** ⚠️ Minor.
- **Findings:** Fallback mock data on API failure (same pattern as HIGH-011).

### `src/features/teacher/tabs/PerformanceActivitiesTab.tsx`
- **Purpose:** Teacher XP performance award.
- **Rating:** ⚠️ Minor.
- **Findings:** MED-009 pattern — uses `alert()` (lines 229, 241, 246, 249) instead of a proper modal for XP award confirmation.

### `src/features/teacher/tabs/TeacherGroupManagementTab.tsx`
- **Purpose:** Teacher group/member management.
- **Rating:** ✅ No security issues.

---

## Student Features

### `src/features/student/StudentDashboardPage.tsx`
- **Purpose:** Student portal layout.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/features/student/tabs/DashboardTab.tsx`
- **Purpose:** Student XP dashboard.
- **Rating:** ❌ Issues found.
- **Findings:** HIGH-002 (debug token bypass, lines 53–56).

### `src/features/student/tabs/ActivitiesTab.tsx`
- **Purpose:** Student activity stage view.
- **Rating:** ✅ No security issues.

### `src/features/student/tabs/LeaderboardTab.tsx`
- **Purpose:** Student leaderboard.
- **Rating:** ✅ No security issues.

### `src/features/student/tabs/PointReviewTab.tsx`
- **Purpose:** Student XP claim submission.
- **Rating:** ⚠️ Minor.
- **Findings:** XP claim submission path relies on `submitXpClaim` (HIGH-011) which silently returns `true` on failure.

### `src/features/student/pages/StudentDetailsPage.tsx`
- **Purpose:** Individual student details, point adjustment.
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-009 (window.confirm/alert), no max XP range validation on point adjustment.

### `src/features/student/pages/StudentListPage.tsx`
- **Purpose:** Student directory.
- **Rating:** ✅ No security issues.
- **Findings:** None.

### `src/features/student/services/student.service.ts`
- **Purpose:** Student API calls.
- **Rating:** ✅ No security issues.
- **Findings:** None. `encodeURIComponent` used on search keyword — good.

---

## Captain Features

### `src/features/captain/CaptainDashboardPage.tsx`
- **Purpose:** Captain portal layout.
- **Rating:** ✅ No security issues.

### `src/features/captain/CaptainDashboard.tsx`
- **Purpose:** Captain team stats view.
- **Rating:** ⚠️ Minor.
- **Findings:** Reads `spdms_user` directly from `localStorage` (line 12) instead of `useAuth()` — same HIGH-008/PII pattern; also uses `JSON.parse` without try/catch.

### `src/features/captain/tabs/CaptainGroupTab.tsx`
- **Purpose:** Captain group view.
- **Rating:** ✅ No security issues.
- **Findings:** None. Read-only view.

---

## Documentation & Security Files

### `README.md`
- **Rating:** ⚠️ Issues found.
- **Findings:** MED-011 (says "Revup-Frontend", wrong project name).

### `docs/DEVELOPER-SETUP.md`
- **Rating:** ✅ Good security documentation.
- **Findings:** None — documents security scanning tools well.

### `docs/DEVELOPER_GUIDE.md`
- **Rating:** ✅ Informational.
- **Findings:** None.

### `security/FRONTEND_SECURITY.md`
- **Rating:** ⚠️ Outdated / inaccurate.
- **Findings:** The document states "Bearer Token Pattern: token is managed securely" — this is inaccurate given CRIT-001. The document should be updated after remediation.
