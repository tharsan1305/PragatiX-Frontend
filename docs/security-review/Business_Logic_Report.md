# Business Logic Security Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| HIGH-011 | XP claim returns `true` on failure | High |
| CRIT-003 | Default password is student DOB | Critical |
| HIGH-001 | Role determined client-side | High |

---

## Business Logic Flows

### XP Awarding Flow

1. Teacher selects student → clicks "Pass / Award"
2. `ActivityExecutionPageV2` opens modal with XP value
3. Teacher confirms → `activityService.awardXp()` → `POST /api/v1/student-xp/award`
4. XP deducted/added to student discipline score

**Risk:** No client-side validation that `awardXp` is within the activity's configured `xpLimit`. A teacher can manually change the XP value in the modal input to any arbitrary number. Backend must enforce the limit:

```typescript
// ActivityExecutionPageV2.tsx — modal
<input
  type="number"
  required
  value={awardXp}
  onChange={(e) => setAwardXp(parseInt(e.target.value) || 0)}
  // No max value set! Should be: max={data?.activity?.xpReward || data?.xpLimit}
/>
```

### Penalty Flow

1. Teacher issues penalty → `penaltyService.issuePenalty()` → `POST /api/v1/penalty-requests`
2. Admin/CC approves → `POST /api/v1/penalty-requests/{id}/approve`
3. XP deducted from student score

**Risk:** The `VIOLATION_PENALTIES` object in `penaltyService.ts` defines point values:

```typescript
VIOLATION_PENALTIES: {
  'Ragging': 50,
  'Severe Misconduct': 100,
  'Non-presentable Attire': 40,
  // ...
}
```

This is a reference table only — the actual points submitted in `issuePenalty()` are the `points` parameter passed by the calling component, not necessarily from this table. A component could pass any number. Backend must validate penalty point values against the configured violation type.

### Captain Appointment Flow

1. Teacher/Admin clicks "Make Captain" on StudentDetailsPage
2. `POST /api/v1/students/{id}/make-captain` called
3. No confirmation dialog — immediate action

**Risk:** The make/remove captain action is performed without a `ConfirmationModal` dialog. A misclick could accidentally change a student's captain status. While `ConfirmationModal` exists in the codebase, it's not used here (raw `window.confirm` / direct API call pattern used instead).

### Badge Approval Flow

1. Student submits badge claim with `evidenceUrl`
2. Teacher sees claim in `RemovalRequestsTab` or admin sees in `AdminBadgeRequestsTab`
3. Teacher/Admin clicks "Approve" or "Reject"
4. No secondary authorization check (e.g., HOD approval for high-tier badges)

**Risk (NMV):** Are there any high-value badges that should require multi-level approval? The current flow is single-level. If badge awards carry significant XP, a single compromised teacher account could fraudulently approve large XP awards.

### Student Deletion

1. Admin/Teacher can delete a student from the admin UI
2. `handleDelete` in `StudentDetailsPage.tsx` uses `window.confirm` (MED-009)
3. `DELETE /api/v1/students/{id}` called immediately after confirmation

**Risk:** `window.confirm` can be bypassed or auto-confirmed in automated attacks. Use `ConfirmationModal` instead. Also verify backend requires ADMIN role for this endpoint.

---

## Race Condition Risks

The attendance submission in `AttendanceTab.tsx` does not prevent double-submission:

```typescript
const submitAttendance = async () => {
  setSubmitting(true);
  // ... API call
  setSubmitting(false);
};
```

The `disabled={submitting}` on the button prevents UI double-click, but a rapid double-click before React re-renders could submit twice. Consider using a `useRef` flag for immediate locking:

```typescript
const isSubmitting = useRef(false);
const submitAttendance = async () => {
  if (isSubmitting.current) return;
  isSubmitting.current = true;
  try { /* ... */ } finally {
    isSubmitting.current = false;
  }
};
```

---

## Missing Business Rules

| Rule | Current Status |
|------|---------------|
| Max XP per activity per student | ❌ Not validated on frontend |
| Penalty points within violation type range | ❌ Not validated on frontend |
| Student must not have existing captain role before `make-captain` | ❌ Not checked |
| Attendance cannot be submitted for future dates | ❌ No validation |
| Stage dates cannot overlap | ❌ Not validated |
